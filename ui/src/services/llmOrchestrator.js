import { mcpClient } from './mcpClient';

const OLLAMA_URL = "http://127.0.0.1:11434/api/chat";
const MODEL = "qwen2.5-coder:14b"; // Make sure you are using this one!

const SYSTEM_PROMPT = `You are a Senior Financial Analyst. 

### KNOWLEDGE BASE:
- DATABASE: SQLite. Primary table is 'transactions'.
- KEY FIELDS: 'vendor_normalized' (clean name), 'amount' (CAD), 'transaction_date' (YYYY-MM-DD).

### OPERATIONAL RULES:
1. NARRATIVE DISCIPLINE: Be highly concise and technical. Avoid conversational fluff.
2. TOOL PRIORITY: Always use 'get_net_spending_summary' for totals. Do not calculate totals manually if a tool is available.
3. INTERNAL TRANSFERS: Exclude transactions like "CC PAYMENT" or "TRANSFER" from expense analysis as they are debt movements.
4. NO RAW JSON: Never show the user raw JSON. If you call a tool, wait for the data, then summarize it in plain text.

### RESPONSE FORMAT:
- Use Markdown tables for data lists.`;

export const llmOrchestrator = {
  async chat(userMessage, history = []) {
    try {
      let messages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...history,
        { role: "user", content: userMessage }
      ];

      const ollamaTools = (await mcpClient.getTools()).map(tool => ({
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema
        }
      }));

      // Loop for up to 5 tool-calling turns
      for (let i = 0; i < 5; i++) {
        const response = await fetch(OLLAMA_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: MODEL,
            messages: messages,
            tools: ollamaTools,
            stream: false
          })
        });

        const data = await response.json();
        let assistantMessage = data.message;
        
        let toolCalls = assistantMessage.tool_calls || [];
        
        // --- OLLAMA TOOL LEAK INTERCEPTOR ---
        // Catch the JSON leak shown in your screenshot and force it into the tool pipeline
        if (toolCalls.length === 0 && assistantMessage.content) {
            const text = assistantMessage.content.trim();
            // If the text looks exactly like the JSON payload from your screenshot:
            if (text.startsWith("{") && text.endsWith("}") && text.includes('"name"') && text.includes('"arguments"')) {
                try {
                    const parsed = JSON.parse(text);
                    if (parsed.name && parsed.arguments) {
                        console.log("🔧 Intercepted leaked tool call:", parsed.name);
                        
                        toolCalls = [{
                            id: "call_" + Date.now(),
                            type: "function",
                            function: {
                                name: parsed.name,
                                arguments: parsed.arguments
                            }
                        }];
                        // Reconstruct the message object so the UI doesn't print the JSON
                        assistantMessage.tool_calls = toolCalls;
                        assistantMessage.content = ""; 
                    }
                } catch (e) {
                    // Not valid JSON, just let it pass to the UI as regular text
                }
            }
        }

        messages.push(assistantMessage);

        // Execute the tool call
        if (toolCalls.length > 0) {
          for (const call of toolCalls) {
            try {
              const result = await mcpClient.callTool(call.function.name, call.function.arguments);
              messages.push({
                role: "tool",
                content: typeof result === 'string' ? result : JSON.stringify(result),
                name: call.function.name // Required by some Ollama models
              });
            } catch (err) {
              messages.push({
                role: "tool",
                content: `Error: ${err.message}`,
                name: call.function.name
              });
            }
          }
          continue; // Loop back to Ollama so it can read the DB results and answer you!
        }

        // Final text response to display in the UI
        return {
          content: assistantMessage.content || "I have processed the data. Is there anything else you'd like to know?",
          history: messages
        };
      }
      
      return {
          content: "I have gathered the data but reached my maximum reasoning steps. Please refine your query.",
          history: messages
      };

    } catch (error) {
      console.error("🚨 Orchestrator Error:", error);
      throw error;
    }
  }
};