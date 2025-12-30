import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Wifi, WifiOff, Database } from 'lucide-react';
import { llmOrchestrator } from '../services/llmOrchestrator';

export default function Insights({ messages, setMessages, history, setHistory }) {
    
  // This maintains the technical history (including tool calls/results) 
  // that the LLM needs, which is often different from what we display to the user.
  const [chatHistory, setChatHistory] = useState([]);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Check connection to Ollama
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch('http://localhost:11434/api/tags');
        if (res.ok) setIsOnline(true);
      } catch (e) {
        setIsOnline(false);
      }
    };
    checkConnection();
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userContent = input;
    const userDisplayMsg = { role: 'user', content: userContent };
    
    setMessages(prev => [...prev, userDisplayMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Use the Orchestrator to handle the Tool-Use loop
      const result = await llmOrchestrator.chat(userContent, chatHistory);
      
      // Update display messages
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: result.content 
      }]);
      
      // Update technical history for the next turn
      setChatHistory(result.history);

    } catch (error) {
      console.error("Orchestration Error:", error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error.message}. Please check if Ollama (11434) and MCP Server (8001) are both running.`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Manage focus transitions
  useEffect(() => {
    if (!isLoading && isOnline) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isOnline]);

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

      {/* Header Status */}
      <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 p-1.5 rounded-lg">
            <Bot className="text-blue-600" size={18} />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xs uppercase tracking-widest text-gray-700">Financial Analyst</span>
            <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
              <Database size={10} /> MCP CONNECTED
            </span>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
          {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
          {isOnline ? 'Ollama Online' : 'Ollama Offline'}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-blue-600' : 'bg-white border border-gray-100'}`}>
                {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-blue-600" />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white shadow-blue-100' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 items-center bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100">
              <Loader2 className="animate-spin text-blue-500" size={18} />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Analyst is thinking...</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-4 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 shadow-sm outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400"
            placeholder={isOnline ? "Ask about your spending (e.g., 'What was my top expense in 2025?')..." : "Please start Ollama to chat..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!isOnline || isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={!isOnline || isLoading || !input.trim()}
          className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:bg-gray-300 shadow-lg shadow-blue-100 transition-all flex-shrink-0"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}