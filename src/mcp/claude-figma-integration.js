// src/mcp/claude-figma-integration.js
/**
 * Claude-Figma MCP Integration
 * Extends the MCP core with functionality for Claude to control Figma
 */

const mcpCore = require("./core");

/**
 * Process a command from Claude to control Figma
 * @param {Object} command - Command object from Claude
 * @returns {Promise<Object>} - Command result
 */
async function handleClaudeCommand(command) {
  // Parse the command if it's a string
  if (typeof command === "string") {
    try {
      command = JSON.parse(command);
    } catch (error) {
      return { error: `Invalid command format: ${error.message}` };
    }
  }

  try {
    // Generate a command ID
    const commandId = `claude_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    // Prepare the command for MCP
    const mcpCommand = {
      type: "command",
      command: command.command,
      params: command.params || {},
      commandId,
    };

    // Log the command
    console.log(`Executing Claude command: ${command.command}`);
    console.log(JSON.stringify(command.params, null, 2));

    // Get a connection ID (use the first active one)
    const connectionIds = mcpCore.getActiveConnectionIds();
    if (!connectionIds.length) {
      return { error: "No active Figma connections" };
    }
    const connectionId = connectionIds[0];

    // Send the command
    const result = await mcpCore.executeCommand(
      command.command,
      command.params,
      connectionId
    );
    return { success: true, result };
  } catch (error) {
    console.error("Error executing Claude command:", error);
    return { error: error.message };
  }
}

/**
 * Create a channel for Claude to send direct messages to Figma
 * @param {string} message - The message from Claude to process
 * @returns {Promise<Object>} - Result of the message processing
 */
async function processClaudeMessage(message) {
  try {
    // Try to parse the message as a command
    let command;
    try {
      // Check if the message is a valid JSON
      command = JSON.parse(message);
    } catch (error) {
      // If it's not valid JSON, treat it as a natural language prompt
      return await processNaturalLanguagePrompt(message);
    }

    // If we have a valid command, execute it
    return await handleClaudeCommand(command);
  } catch (error) {
    console.error("Error processing Claude message:", error);
    return { error: error.message };
  }
}

/**
 * Process a natural language prompt from Claude
 * @param {string} prompt - Natural language prompt
 * @returns {Promise<Object>} - Result of the prompt processing
 */
async function processNaturalLanguagePrompt(prompt) {
  try {
    // Check for active connections
    const connectionIds = mcpCore.getActiveConnectionIds();
    if (!connectionIds.length) {
      return { error: "No active Figma connections" };
    }
    const connectionId = connectionIds[0];

    // Send prompt to the PROCESS_PROMPT command
    const result = await mcpCore.executeCommand(
      "PROCESS_PROMPT",
      {
        prompt,
        designerName: "Claude User",
        settings: {
          aiModel: "claude-3-sonnet",
          designStyle: "modern",
        },
      },
      connectionId
    );

    return { success: true, result };
  } catch (error) {
    console.error("Error processing natural language prompt:", error);
    return { error: error.message };
  }
}

// Add these functions to the mcpCore module
mcpCore.handleClaudeCommand = handleClaudeCommand;
mcpCore.processClaudeMessage = processClaudeMessage;

module.exports = {
  handleClaudeCommand,
  processClaudeMessage,
};
