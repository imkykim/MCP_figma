/**
 * MCP Client
 * 
 * A unified WebSocket client for MCP architecture that works in both
 * Node.js and browser/Figma plugin environments.
 */

// Detect environment and import WebSocket if needed
const isNode = typeof window === 'undefined';
const WebSocketImpl = isNode ? require('ws') : WebSocket;

class MCPClient {
  constructor(options = {}) {
    this.url = options.url || 'ws://localhost:9000';
    this.autoReconnect = options.autoReconnect !== false;
    this.reconnectInterval = options.reconnectInterval || 5000;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.debug = options.debug || false;
    
    this.ws = null;
    this.isConnected = false;
    this.connectionId = null;
    this.reconnectAttempts = 0;
    this.eventHandlers = {
      message: [],
      open: [],
      close: [],
      error: [],
      reconnect: []
    };
    this.pendingMessages = [];
    this.commandCallbacks = new Map();
    this.commandIdCounter = 1;
    
    // Bind methods
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.send = this.send.bind(this);
    this.executeCommand = this.executeCommand.bind(this);
    this._handleMessage = this._handleMessage.bind(this);
  }
  
  /**
   * Connect to MCP server
   * @param {string} url - Optional URL to override default
   * @returns {Promise} - Resolves when connected
   */
  connect(url) {
    return new Promise((resolve, reject) => {
      try {
        // Close existing connection if any
        if (this.ws) {
          this.disconnect();
        }
        
        this.url = url || this.url;
        this.ws = new WebSocketImpl(this.url);
        
        // Connection timeout
        const timeout = setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('Connection timeout'));
            this.ws.close();
          }
        }, 10000);
        
        // Connection established
        this.ws.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          clearTimeout(timeout);
          
          if (this.debug) console.log('MCP connected to', this.url);
          
          // Send any pending messages
          while (this.pendingMessages.length > 0) {
            const msg = this.pendingMessages.shift();
            this.send(msg);
          }
          
          // Trigger event handlers
          this._triggerEvent('open');
          
          resolve(true);
        };
        
        // Message received
        this.ws.onmessage = (event) => {
          const data = isNode ? event : event.data;
          this._handleMessage(data);
        };
        
        // Connection closed
        this.ws.onclose = (event) => {
          this.isConnected = false;
          clearTimeout(timeout);
          
          if (this.debug) console.log('MCP disconnected');
          
          // Trigger event handlers
          this._triggerEvent('close', event);
          
          // Auto reconnect if enabled
          if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
              if (this.debug) console.log(`Reconnecting (attempt ${this.reconnectAttempts})...`);
              this._triggerEvent('reconnect', this.reconnectAttempts);
              this.connect();
            }, this.reconnectInterval);
          }
        };
        
        // Error handling
        this.ws.onerror = (error) => {
          if (this.debug) console.error('MCP connection error:', error);
          this._triggerEvent('error', error);
          reject(error);
        };
      } catch (error) {
        if (this.debug) console.error('MCP connection error:', error);
        this._triggerEvent('error', error);
        reject(error);
      }
    });
  }
  
  /**
   * Disconnect from MCP server
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
      this.connectionId = null;
    }
  }
  
  /**
   * Send message to MCP server
   * @param {object} message - Message to send
   * @returns {boolean} - Success status
   */
  send(message) {
    if (this.isConnected && this.ws) {
      const readyState = isNode ? WebSocketImpl.OPEN : WebSocket.OPEN;
      
      if (this.ws.readyState === readyState) {
        this.ws.send(JSON.stringify(message));
        return true;
      }
    }
    
    // Queue message to send when connected
    if (this.autoReconnect) {
      this.pendingMessages.push(message);
      
      // Try to connect if not already connecting
      if (!this.ws) {
        this.connect();
      }
    }
    
    return false;
  }
  
  /**
   * Execute a command on the MCP server and get the result
   * @param {string} command - Command name
   * @param {object} params - Command parameters
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise} - Resolves with command result
   */
  executeCommand(command, params = {}, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const commandId = this.commandIdCounter++;
      
      // Set up timeout
      const timeoutId = setTimeout(() => {
        this.commandCallbacks.delete(commandId);
        reject(new Error(`Command ${command} timed out after ${timeout}ms`));
      }, timeout);
      
      // Store callback
      this.commandCallbacks.set(commandId, {
        resolve: (result) => {
          clearTimeout(timeoutId);
          resolve(result);
        },
        reject: (error) => {
          clearTimeout(timeoutId);
          reject(error);
        }
      });
      
      // Send command
      this.send({
        type: 'EXECUTE_COMMAND',
        commandId,
        command,
        params
      });
    });
  }
  
  /**
   * Register event handler
   * @param {string} event - Event name (message, open, close, error, reconnect)
   * @param {function} handler - Handler function
   */
  on(event, handler) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].push(handler);
    }
  }
  
  /**
   * Remove event handler
   * @param {string} event - Event name
   * @param {function} handler - Handler function to remove
   */
  off(event, handler) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
    }
  }
  
  /**
   * Handle incoming message
   * @private
   * @param {string} data - Message data
   */
  _handleMessage(data) {
    try {
      const message = JSON.parse(typeof data === 'string' ? data : data.toString());
      
      // Handle connection ID message
      if (message.type === 'CONNECTION_ESTABLISHED') {
        this.connectionId = message.connectionId;
        if (this.debug) console.log(`MCP connection established with ID: ${this.connectionId}`);
      }
      
      // Handle command response
      if (message.type === 'COMMAND_RESPONSE' && message.commandId) {
        const callback = this.commandCallbacks.get(message.commandId);
        if (callback) {
          this.commandCallbacks.delete(message.commandId);
          if (message.error) {
            callback.reject(new Error(message.error));
          } else {
            callback.resolve(message.result);
          }
        }
      }
      
      // Trigger message event handlers
      this._triggerEvent('message', message);
    } catch (error) {
      if (this.debug) console.error('Error processing message:', error);
    }
  }
  
  /**
   * Trigger event handlers
   * @private
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  _triggerEvent(event, data) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in ${event} handler:`, error);
        }
      });
    }
  }
}

// Export for both Node.js and browser environments
if (isNode) {
  module.exports = MCPClient;
} else {
  window.MCPClient = MCPClient;
}