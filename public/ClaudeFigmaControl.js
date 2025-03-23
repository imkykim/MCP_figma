// Claude-Figma Control Interface
// This file provides a simple, direct interface for Claude to interact with Figma

/**
 * ClaudeFigmaControl - A simple class for controlling Figma directly from Claude
 *
 * This class allows Claude to directly manipulate Figma documents through the MCP architecture.
 * It provides simplified methods for common operations like creating frames, adding text,
 * and generating portfolios from templates.
 */
class ClaudeFigmaControl {
  constructor() {
    this.apiUrl = "http://localhost:3333"; // The Claude API server port
    this.connected = false;
    this.debug = true;
  }

  /**
   * Initialize the connection to Figma MCP
   * @returns {Promise<{success: boolean, message: string}>} Connection status
   */
  async connect() {
    try {
      const result = await this.checkStatus();
      this.connected = result.status === "connected";

      if (this.connected) {
        this._log(
          `✅ Connected to Figma! ${result.connections.length} active connections`
        );
        return {
          success: true,
          message: result.message,
        };
      } else {
        this._log(`❌ Not connected to Figma: ${result.message}`);
        return {
          success: false,
          message: result.message,
        };
      }
    } catch (error) {
      this._log(`❌ Error connecting to Figma MCP: ${error.message}`);
      return {
        success: false,
        message: `Error: ${error.message}`,
      };
    }
  }

  /**
   * Log debug messages if debug mode is enabled
   * @param {string} message - Message to log
   * @private
   */
  _log(message) {
    if (this.debug) {
      console.log(`ClaudeFigma: ${message}`);
    }
  }

  /**
   * Check the connection status of the MCP server
   * @returns {Promise<Object>} Status object with connection information
   */
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

  /**
   * Get available templates
   * @returns {Promise<Array>} List of available templates
   */
  async getTemplates() {
    this._log("Getting available templates...");
    try {
      const response = await fetch(`${this.apiUrl}/templates`);
      const data = await response.json();
      return data.templates;
    } catch (error) {
      this._log(`❌ Error getting templates: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send a command to the Figma plugin
   * @param {string} command - Command name
   * @param {Object} params - Command parameters
   * @returns {Promise<Object>} Command result
   */
  async sendCommand(command, params = {}) {
    this._log(`Sending command: ${command}`);
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
        this._log(`❌ Error: ${data.error}`);
        throw new Error(data.error);
      }

      this._log(`✅ Command completed successfully`);
      return data.result;
    } catch (error) {
      this._log(`❌ Error: ${error.message}`);
      throw error;
    }
  }

  // Basic Figma commands

  /**
   * Create a new frame in Figma
   * @param {Object} params - Frame parameters (name, width, height, backgroundColor, etc.)
   * @returns {Promise<Object>} Created frame info
   */
  async createFrame(params) {
    return this.sendCommand("createFrame", params);
  }

  /**
   * Create text in Figma
   * @param {Object} params - Text parameters (text, frameId, x, y, etc.)
   * @returns {Promise<Object>} Created text info
   */
  async createText(params) {
    return this.sendCommand("createText", params);
  }

  /**
   * Create a rectangle in Figma
   * @param {Object} params - Rectangle parameters
   * @returns {Promise<Object>} Created rectangle info
   */
  async createRectangle(params) {
    return this.sendCommand("createRectangle", params);
  }

  /**
   * Create an image placeholder in Figma
   * @param {Object} params - Image placeholder parameters
   * @returns {Promise<Object>} Created image placeholder info
   */
  async createImagePlaceholder(params) {
    return this.sendCommand("createImagePlaceholder", params);
  }

  /**
   * Create a section in Figma
   * @param {Object} params - Section parameters
   * @returns {Promise<Object>} Created section info
   */
  async createSection(params) {
    return this.sendCommand("createSection", params);
  }

  /**
   * Generate a portfolio using a template
   * @param {string} templateId - Template ID to use
   * @param {Object} userData - User data for the portfolio (name, etc.)
   * @returns {Promise<Object>} Result of the portfolio generation
   */
  async generatePortfolio(templateId, userData) {
    return this.sendCommand("generatePortfolio", {
      templateId,
      userData,
    });
  }

  /**
   * Process an AI prompt to generate a portfolio
   * @param {string} prompt - AI prompt describing the portfolio to generate
   * @param {string} designerName - Name of the designer
   * @returns {Promise<Object>} Result of the prompt processing
   */
  async processAIPrompt(prompt, designerName) {
    return this.sendCommand("PROCESS_PROMPT", {
      prompt,
      designerName,
      settings: {
        aiModel: "claude-3-sonnet",
        designStyle: "modern",
      },
    });
  }

  /**
   * Create a simple portfolio layout
   * @param {string} name - Designer name
   * @param {string} title - Portfolio title
   * @param {Array} projects - Array of projects
   * @returns {Promise<Object>} Result of the portfolio creation
   */
  async createSimplePortfolio(name, title, projects = []) {
    // First create a frame for the portfolio
    const frame = await this.createFrame({
      name: `${name} Portfolio`,
      width: 1200,
      height: 1800,
      backgroundColor: { r: 0.98, g: 0.98, b: 0.98 },
    });

    // Add title
    await this.createText({
      frameId: frame.id,
      text: title || `${name}'s Portfolio`,
      x: 100,
      y: 100,
      width: 1000,
      styleType: "heading",
      horizontalAlignment: "LEFT",
    });

    // Add designer name
    await this.createText({
      frameId: frame.id,
      text: name,
      x: 100,
      y: 180,
      width: 1000,
      styleType: "subheading",
      horizontalAlignment: "LEFT",
    });

    // Add projects section
    const projectsSection = await this.createSection({
      frameId: frame.id,
      title: "Projects",
      x: 100,
      y: 300,
      width: 1000,
    });

    // Add each project
    let yOffset = projectsSection.contentY;
    for (const project of projects) {
      await this.createText({
        frameId: projectsSection.id,
        text: project.title || "Untitled Project",
        x: 0,
        y: yOffset,
        width: 1000,
        styleType: "body",
        horizontalAlignment: "LEFT",
      });

      yOffset += 60;

      if (project.description) {
        await this.createText({
          frameId: projectsSection.id,
          text: project.description,
          x: 0,
          y: yOffset,
          width: 1000,
          styleType: "caption",
          horizontalAlignment: "LEFT",
        });

        yOffset += 80;
      }

      // Add image placeholder
      await this.createImagePlaceholder({
        frameId: projectsSection.id,
        name: `${project.title} Image`,
        x: 0,
        y: yOffset,
        width: 1000,
        height: 300,
      });

      yOffset += 350;
    }

    return {
      success: true,
      message: "Simple portfolio created",
      frame,
    };
  }
}

// Example usage:
//
// async function testClaudeFigma() {
//   const figma = new ClaudeFigmaControl();
//   const status = await figma.connect();
//
//   if (status.success) {
//     const templates = await figma.getTemplates();
//     console.log("Available templates:", templates);
//
//     // Create a simple frame
//     const frame = await figma.createFrame({
//       name: "Created by Claude",
//       width: 800,
//       height: 600,
//       backgroundColor: { r: 0.9, g: 0.9, b: 1.0 }
//     });
//
//     console.log("Frame created:", frame);
//   }
// }
//
// // Uncomment to run:
// // testClaudeFigma();

// Export for use by Claude
window.ClaudeFigmaControl = ClaudeFigmaControl;

// Helper function for Claude to execute Figma commands
async function executeFigmaCommand(fn) {
  try {
    // Initialize the Figma control
    const figma = new ClaudeFigmaControl();
    const status = await figma.connect();

    if (!status.success) {
      return `Failed to connect to Figma MCP: ${status.message}`;
    }

    // Execute the command function
    const result = await fn(figma);
    return `Command executed successfully:\n${JSON.stringify(result, null, 2)}`;
  } catch (error) {
    return `Error executing Figma command: ${error.message}`;
  }
}

// Export the helper function
window.executeFigmaCommand = executeFigmaCommand;
