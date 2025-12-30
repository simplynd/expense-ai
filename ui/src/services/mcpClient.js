const MCP_URL = "http://127.0.0.1:8001/mcp";

export const mcpClient = {
  sessionId: null,

  async connect() {
    // 1. Initialize the session
    const response = await fetch(MCP_URL, {
      method: "POST",
      headers: {
        "Accept": "application/json, text/event-stream",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "expense-ai-ui", version: "1.0.0" }
        },
        id: 1
      })
    });

    // FastMCP returns the Session ID in a custom header
    this.sessionId = response.headers.get("mcp-session-id");
    
    // 2. Send the 'initialized' notification (required by protocol)
    await fetch(MCP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "mcp-session-id": this.sessionId
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "notifications/initialized"
      })
    });

    console.log("Connected to MCP with Session:", this.sessionId);
  },

  async getTools() {
    if (!this.sessionId) await this.connect();

    const response = await fetch(MCP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "mcp-session-id": this.sessionId
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/list",
        id: 2
      })
    });
    const data = await response.json();
    return data.result.tools;
  },

  async callTool(name, args) {
    const response = await fetch(MCP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "mcp-session-id": this.sessionId
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/call",
        params: { name, arguments: args },
        id: 3
      })
    });
    const data = await response.json();
    // FastMCP tool results are usually wrapped in a 'content' array
    return data.result.content[0].text;
  }
};