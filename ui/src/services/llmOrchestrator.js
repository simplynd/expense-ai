import { mcpClient } from './mcpClient';

const OLLAMA_URL = "http://127.0.0.1:11434/api/chat";
const MODEL = "llama3.1:latest";

const SYSTEM_PROMPT = `You are a Senior Financial Analyst. You have access to a user's transaction database through MCP tools.

### CONVERSATIONAL RULES:
- If the user greets you (e.g., "Hi", "Hello") or asks a general question that doesn't require data (e.g., "How are you?"), respond naturally WITHOUT calling any tools.
- ONLY use tools when the user's request requires data from the database (spending, transactions, totals).

### DOMAIN KNOWLEDGE:
- NET SPENDING: In this database, 'Net Spending' is (Sum of Debits) - (Sum of Refunds).
- PAYMENTS/TRANSFERS: Transactions with keywords like "PAYMENT", "TRANSFER", or "CREDIT CARD" are internal movements. They represent paying off a debt, not a new expense.
- REFUNDS: Negative amounts (e.g., -$50.00) are refunds or credits and should reduce the total spending.

### TOOL SELECTION STRATEGY:
- ACCURACY FIRST: If the user asks for a total, net spend, or summary, the 'get_net_spending_summary' tool is the most accurate as it performs math at the database level.
- DETAILS SECOND: If the user asks for a list, a breakdown, or to see "why" a number is what it is, use 'fetch_all_transactions_for_year' or 'search_spending'.
- HYBRID: You may call 'get_net_spending_summary' to get the "Truth" and then 'fetch_all_transactions_for_year' to provide the context/list to the user.

### PRESENTATION:
- Always be precise with numbers. 
- Use Markdown tables for transaction lists.
- If you notice a discrepancy, explain your reasoning (e.g., "I excluded $3,600 in payments to show actual spending").`;

// ... rest of your orchestrator logic (OLLAMA_URL, MODEL, etc.)

export const llmOrchestrator = {
  async chat(userMessage, history = []) {
    console.log("--- Starting New Orchestration ---");

    try {
      // 1. Get the latest tool definitions from MCP
      const tools = await mcpClient.getTools();
      console.log("🛠️ Available MCP Tools:", tools.map(t => t.name));

      // Map MCP tools to Ollama's expected format
      const ollamaTools = tools.map(t => ({
        type: "function",
        function: {
          name: t.name,
          description: t.description,
          parameters: t.inputSchema
        }
      }));

      let messages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...history,
        { role: "user", content: userMessage }
      ];

      // --- START AGENT LOOP ---
      for (let i = 0; i < 5; i++) {
        console.log(`Step ${i + 1}: Contacting Ollama...`);

        const response = await fetch(OLLAMA_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: MODEL,
            messages: messages,
            tools: ollamaTools,
            stream: false,
            options: {
              temperature: 0 // Keep the model focused on math and facts
            }
          })
        });

        if (!response.ok) {
          throw new Error(`Ollama API returned ${response.status}`);
        }

        const data = await response.json();
        const assistantMessage = data.message;
        messages.push(assistantMessage);

        // Check if the AI wants to use a tool
        if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
          console.warn("⚠️ AI IS CALLING A TOOL:", assistantMessage.tool_calls.map(c => c.function.name));

          for (const call of assistantMessage.tool_calls) {
            try {
              // Validate that the tool name exists before calling
              const toolExists = ollamaTools.some(t => t.function.name === call.function.name);
              if (!toolExists) {
                console.error(`❌ AI tried to call non-existent tool: ${call.function.name}`);
                continue;
              }

              const result = await mcpClient.callTool(call.function.name, call.function.arguments);
              console.log(`✅ TOOL SUCCESS: ${call.function.name}`);

              messages.push({
                role: "tool",
                content: typeof result === 'string' ? result : JSON.stringify(result),
                tool_call_id: call.id
              });
            } catch (toolError) {
              console.error(`❌ TOOL CRASHED (${call.function.name}):`, toolError);
              messages.push({
                role: "tool",
                content: `Error: ${toolError.message}`,
                tool_call_id: call.id
              });
            }
          }
          // Very important: This 'continue' sends the tool results back to the LLM 
          // so it can generate the final natural language answer.
          continue;
        }

        // No more tool calls? Return the final text answer
        console.log("🏁 Finalizing response...");
        return {
          content: assistantMessage.content,
          history: messages
        };
      }
    } catch (error) {
      console.error("🚨 Orchestrator Error:", error);
      throw error;
    }
  }
};