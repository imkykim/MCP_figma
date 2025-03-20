// FigmaMCP.js - Direct control tool for Claude
class FigmaMCP {
  constructor(options = {}) {
    this.apiUrl = options.apiUrl || "http://localhost:3333";
    this.connected = false;
    this.debug = options.debug || false;
  }

  async _logStep(message) {
    if (this.debug) {
      console.log(`FigmaMCP: ${message}`);
    }
    return message;
  }

  async initialize() {
    try {
      await this._logStep("Checking connection to Figma MCP...");
      const status = await this.checkStatus();
      this.connected = status.status === "connected";

      if (this.connected) {
        await this._logStep(
          `✅ Connected to Figma! ${status.connections.length} active connections`
        );
        return {
          success: true,
          message: status.message,
        };
      } else {
        await this._logStep(`❌ Not connected to Figma: ${status.message}`);
        return {
          success: false,
          message: status.message,
        };
      }
    } catch (error) {
      await this._logStep(`❌ Error connecting to Figma MCP: ${error.message}`);
      return {
        success: false,
        message: `Error: ${error.message}`,
      };
    }
  }

  async sendCommand(command, params) {
    await this._logStep(`Sending command: ${command}`);
    try {
      const response = await fetch(`${this.apiUrl}/command`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          command,
          params,
        }),
      });

      const data = await response.json();

      if (data.error) {
        await this._logStep(`❌ Error: ${data.error}`);
        throw new Error(data.error);
      }

      await this._logStep(`✅ Command completed successfully`);
      return data.result;
    } catch (error) {
      await this._logStep(`❌ Error: ${error.message}`);
      throw error;
    }
  }

  async checkStatus() {
    try {
      const response = await fetch(`${this.apiUrl}/status`);
      return await response.json();
    } catch (error) {
      return {
        status: "error",
        message: error.message,
      };
    }
  }

  async getTemplates() {
    await this._logStep("Getting available templates...");
    try {
      const response = await fetch(`${this.apiUrl}/templates`);
      const data = await response.json();
      return data.templates;
    } catch (error) {
      await this._logStep(`❌ Error getting templates: ${error.message}`);
      throw error;
    }
  }

  // Figma commands
  async createFrame(params) {
    return this.sendCommand("createFrame", params);
  }

  async createText(params) {
    return this.sendCommand("createText", params);
  }

  async createRectangle(params) {
    return this.sendCommand("createRectangle", params);
  }

  async createImagePlaceholder(params) {
    return this.sendCommand("createImagePlaceholder", params);
  }

  async createSection(params) {
    return this.sendCommand("createSection", params);
  }

  async generatePortfolio(params) {
    return this.sendCommand("generatePortfolio", params);
  }
}

// Helper to execute and render Figma commands
async function executeFigmaCommand(fn) {
  try {
    // Initialize the Figma MCP tool
    const figma = new FigmaMCP({ debug: true });
    const initResult = await figma.initialize();

    if (!initResult.success) {
      return `Failed to connect to Figma MCP: ${initResult.message}`;
    }

    // Execute the command function
    const result = await fn(figma);
    return `Command executed successfully:\n${JSON.stringify(result, null, 2)}`;
  } catch (error) {
    return `Error executing Figma command: ${error.message}`;
  }
}

// Export for use
window.FigmaMCP = FigmaMCP;
window.executeFigmaCommand = executeFigmaCommand;
