import { mcpClient } from './mcpClient';

const OLLAMA_URL = "http://127.0.0.1:11434/api/chat";
const MODEL = "qwen2.5:14b"; 

export const llmOrchestrator = {
  async chat(userMessage, history = []) {
    // 1. Get the latest tool definitions from MCP
    const tools = await mcpClient.getTools();
    
    // Map MCP tools to Ollama's expected format
    const ollamaTools = tools.map(t => ({
      type: "function",
      function: {
        name: t.name,
        description: t.description,
        parameters: t.inputSchema // MCP uses 'inputSchema'
      }
    }));

    let messages = [
      { role: "system", content: "You are an expert financial assistant. Use the provided tools to fetch real data before answering questions." },
      ...history,
      { role: "user", content: userMessage }
    ];

    try {
      // --- START AGENT LOOP ---
      // We loop because the model might need to call multiple tools
      for (let i = 0; i < 5; i++) { 
        const response = await fetch(OLLAMA_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: MODEL,
            messages: messages,
            tools: ollamaTools,
            stream: false // Set to false for easier tool handling
          })
        });

        const data = await response.json();
        const assistantMessage = data.message;
        messages.push(assistantMessage);

        // Check if the model wants to call a tool
        if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
          console.log("LLM requesting tools:", assistantMessage.tool_calls);
          
          for (const call of assistantMessage.tool_calls) {
            const result = await mcpClient.callTool(call.function.name, call.function.arguments);
            
            // Add the tool result back to the conversation history
            messages.push({
              role: "tool",
              content: result,
              tool_call_id: call.id // Optional but good practice
            });
          }
          // Continue the loop to let the LLM analyze the tool results
          continue; 
        }

        // No more tool calls? Return the final text answer
        return {
          content: assistantMessage.content,
          history: messages
        };
      }
    } catch (error) {
      console.error("Orchestrator Error:", error);
      throw error;
    }
  }
};