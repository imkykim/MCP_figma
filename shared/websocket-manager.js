/**
 * WebSocket Manager
 * Centralized WebSocket connection handling for MCP architecture
 */
class WebSocketManager {
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
    this.messageHandlers = new Map();
    this.pendingMessages = [];
    
    // Bind methods to maintain context
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.send = this.send.bind(this);
    this.onMessage = this.onMessage.bind(this);
  }
  
  /**
   * Connect to WebSocket server
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
        this.ws = new WebSocket(this.url);
        
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
          
          if (this.debug) console.log('WebSocket connected');
          
          // Send any pending messages
          while (this.pendingMessages.length > 0) {
            const msg = this.pendingMessages.shift();
            this.send(msg);
          }
          
          resolve(true);
        };
        
        // Message received
        this.ws.onmessage = this.onMessage;
        
        // Connection closed
        this.ws.onclose = () => {
          this.isConnected = false;
          this.connectionId = null;
          clearTimeout(timeout);
          
          if (this.debug) console.log('WebSocket disconnected');
          
          // Auto reconnect if enabled
          if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => this.connect(), this.reconnectInterval);
          }
        };
        
        // Error handling
        this.ws.onerror = (error) => {
          if (this.debug) console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        if (this.debug) console.error('WebSocket connection error:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Disconnect from WebSocket server
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
   * Send message to WebSocket server
   * @param {object} message - Message to send
   * @returns {boolean} - Success status
   */
  send(message) {
    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    } else {
      // Queue message to send when connected
      this.pendingMessages.push(message);
      
      // Try to connect if not already connecting
      if (!this.ws && this.autoReconnect) {
        this.connect();
      }
      return false;
    }
  }
  
  /**
   * Handle incoming WebSocket messages
   * @param {MessageEvent} event - WebSocket message event
   */
  onMessage(event) {
    try {
      const message = JSON.parse(event.data);
      
      // Handle connection ID message
      if (message.type === 'CONNECTION_ESTABLISHED') {
        this.connectionId = message.connectionId;
        if (this.debug) console.log(`Connection established with ID: ${this.connectionId}`);
      }
      
      // Dispatch message to registered handlers
      if (this.messageHandlers.has(message.type)) {
        this.messageHandlers.get(message.type)(message);
      }
      
      // Dispatch to wildcard handler if exists
      if (this.messageHandlers.has('*')) {
        this.messageHandlers.get('*')(message);
      }
    } catch (error) {
      if (this.debug) console.error('Error processing message:', error);
    }
  }
  
  /**
   * Register message handler
   * @param {string} type - Message type to handle (use '*' for all messages)
   * @param {function} handler - Handler function
   */
  on(type, handler) {
    this.messageHandlers.set(type, handler);
  }
  
  /**
   * Remove message handler
   * @param {string} type - Message type to remove handler for
   */
  off(type) {
    this.messageHandlers.delete(type);
  }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WebSocketManager;
} else {
  window.WebSocketManager = WebSocketManager;
}