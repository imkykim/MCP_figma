// figma-tool.js
class FigmaTool {
  constructor() {
    this.apiUrl = "http://localhost:3333";
  }

  async sendCommand(command, params) {
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
        throw new Error(data.error);
      }

      return data.result;
    } catch (error) {
      console.error("Error sending command:", error);
      throw error;
    }
  }

  async checkStatus() {
    const response = await fetch(`${this.apiUrl}/status`);
    return response.json();
  }

  async getTemplates() {
    const response = await fetch(`${this.apiUrl}/templates`);
    const data = await response.json();
    return data.templates;
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

// Create an instance
const figma = new FigmaTool();
