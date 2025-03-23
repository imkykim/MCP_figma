// src/claude-figma-api.js
/**
 * Claude-Figma API Server
 * This server acts as a bridge between Claude and the Figma MCP system
 */

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const mcpCore = require("./mcp/core");
const templateService = require("./templates/portfolio-templates");

// Create Express app
const app = express();
const PORT = 3333; // Different from your MCP port (9000)

// Enable CORS and JSON
app.use(cors());
app.use(bodyParser.json());

// Serve static files from a public directory
app.use(express.static(path.join(__dirname, "../public")));

// Status endpoint - Check if Figma is connected via MCP
app.get("/status", (req, res) => {
  const active = mcpCore.hasActiveConnections();
  const connections = mcpCore.getActiveConnectionIds();

  res.json({
    status: active ? "connected" : "disconnected",
    connections,
    message: active
      ? `Connected to Figma with ${connections.length} active connections`
      : "No active Figma connections",
  });
});

// Command execution endpoint - Execute Figma commands
app.post("/command", async (req, res) => {
  try {
    const command = req.body;

    if (!command || !command.command) {
      return res.status(400).json({ error: "Invalid command format" });
    }

    console.log(`API: Executing command: ${command.command}`);
    console.log(JSON.stringify(command.params || {}, null, 2));

    // Check for active connections
    const connectionIds = mcpCore.getActiveConnectionIds();
    if (!connectionIds.length) {
      return res.status(503).json({
        error:
          "No active Figma connections. Please make sure the Figma plugin is connected to the MCP server.",
      });
    }

    const connectionId = connectionIds[0]; // Use the first connection

    // Use the handleClaudeCommand function from mcpCore if available
    if (typeof mcpCore.handleClaudeCommand === "function") {
      const result = await mcpCore.handleClaudeCommand(command);
      if (result.error) {
        return res.status(500).json({ error: result.error });
      }
      return res.json({ success: true, result: result.result });
    }

    // Or use executeCommand directly
    const result = await mcpCore.executeCommand(
      command.command,
      command.params || {},
      connectionId
    );

    res.json({ success: true, result });
  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get available templates
app.get("/templates", async (req, res) => {
  try {
    const templates = templateService.getTemplateList();
    res.json({ templates });
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ error: error.message });
  }
});

// Process AI prompt
app.post("/prompt", async (req, res) => {
  try {
    const { prompt, designerName } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Check for active connections
    const connectionIds = mcpCore.getActiveConnectionIds();
    if (!connectionIds.length) {
      return res.status(503).json({
        error: "No active Figma connections",
      });
    }

    const connectionId = connectionIds[0];

    // Send the prompt message to MCP
    mcpCore.sendMessage(
      {
        type: "PROCESS_PROMPT",
        prompt,
        designerName: designerName || "Designer",
        settings: {
          aiModel: "claude-3-sonnet",
          designStyle: "modern",
        },
      },
      connectionId
    );

    res.json({
      success: true,
      message: "Prompt sent to Figma for processing",
    });
  } catch (error) {
    console.error("Prompt processing error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Start the server
function startAPI() {
  app.listen(PORT, () => {
    console.log(`Claude-Figma API server running at http://localhost:${PORT}`);
  });
}

// Export the function
module.exports = { startAPI };

// Start if this file is run directly
if (require.main === module) {
  startAPI();
}
