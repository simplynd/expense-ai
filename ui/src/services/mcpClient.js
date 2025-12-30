const MCP_URL = "http://127.0.0.1:8001/mcp";

export const mcpClient = {
  sessionId: null,

  getHeaders() {
    return {
      "Accept": "application/json, text/event-stream",
      "Content-Type": "application/json",
      ...(this.sessionId && { "mcp-session-id": this.sessionId })
    };
  },

  /**
   * Helper to handle the "event: message\ndata: {...}" format
   * that FastMCP uses for all responses.
   */
  async parseMCPResponse(response) {
    const text = await response.text();
    
    // If it's an SSE formatted string
    if (text.startsWith("event: message")) {
      try {
        // Extract the JSON portion from the data: line
        const jsonPart = text.split("data: ")[1].split("\n")[0];
        return JSON.parse(jsonPart);
      } catch (e) {
        console.error("Failed to parse SSE data:", text);
        throw new Error("Invalid MCP Stream format");
      }
    }
    
    // If it's just plain JSON
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse JSON text:", text);
      throw new Error("Invalid JSON response from MCP");
    }
  },

  async connect() {
    console.log("Connecting to MCP...");
    const response = await fetch(MCP_URL, {
      method: "POST",
      headers: this.getHeaders(),
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

    this.sessionId = response.headers.get("mcp-session-id");
    const initResult = await this.parseMCPResponse(response);
    console.log("MCP Server Info:", initResult.result.serverInfo);

    await fetch(MCP_URL, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "notifications/initialized"
      })
    });

    console.log("MCP Fully Initialized.");
  },

  async getTools() {
    if (!this.sessionId) await this.connect();
    
    const response = await fetch(MCP_URL, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/list",
        id: 2
      })
    });

    const data = await this.parseMCPResponse(response);
    return data.result.tools;
  },

  async callTool(name, args) {
    const response = await fetch(MCP_URL, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/call",
        params: { name, arguments: args },
        id: 3
      })
    });
    
    const data = await this.parseMCPResponse(response);
    // Return the text content from the first result item
    return data.result.content[0].text;
  }
};