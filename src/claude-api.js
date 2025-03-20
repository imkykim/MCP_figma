// claude-api.js - API Server for Claude to interact with Figma MCP
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const mcpCore = require("./mcp/core");

// Create Express app
const app = express();
const PORT = 3333; // Different from your MCP port

// Enable CORS and JSON
app.use(cors());
app.use(bodyParser.json());

// Serve static files from a public directory
app.use(express.static(path.join(__dirname, "../public")));

// Status endpoint
app.get("/status", (req, res) => {
  const active = mcpCore.hasActiveConnections();
  const connections = mcpCore.getActiveConnectionIds();

  res.json({
    status: active ? "connected" : "disconnected",
    connections,
    message: active ? "Connected to Figma" : "No active Figma connections",
  });
});

// Command execution endpoint
app.post("/command", async (req, res) => {
  try {
    const command = req.body;

    if (!command || !command.command) {
      return res.status(400).json({ error: "Invalid command format" });
    }

    console.log(`Executing command: ${command.command}`);
    console.log(JSON.stringify(command.params, null, 2));

    // Check for active connections
    const connectionIds = mcpCore.getActiveConnectionIds();
    if (!connectionIds.length) {
      return res.status(503).json({ error: "No active Figma connections" });
    }
    const connectionId = connectionIds[0];

    // Execute the command
    const result = await mcpCore.executeCommand(
      command.command,
      command.params,
      connectionId
    );
    res.json({ success: true, result });
  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Special endpoint for template listing
app.get("/templates", async (req, res) => {
  try {
    const templates =
      require("./templates/portfolio-templates").getTemplateList();
    res.json({ templates });
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ error: error.message });
  }
});

// Start the server
function startAPI() {
  app.listen(PORT, () => {
    console.log(`Claude API server running at http://localhost:${PORT}`);
  });
}

// Export the function
module.exports = { startAPI };

// Start if this file is run directly
if (require.main === module) {
  startAPI();
}
