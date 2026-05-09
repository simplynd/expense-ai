import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Wifi, WifiOff, Database } from 'lucide-react';
import { llmOrchestrator } from '../services/llmOrchestrator';

export default function Insights({ messages, setMessages, history, setHistory }) {
    
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

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

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // FIX: Ensure we are passing the history down to the orchestrator 
      // and saving the returned history so the LLM remembers its tool outputs
      const response = await llmOrchestrator.chat(input, history);
      
      setMessages(prev => [...prev, { role: 'assistant', content: response.content }]);
      setHistory(response.history); 
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "🚨 Error: I couldn't reach the analyst. Please check if Ollama and MCP are running." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      
      {/* Header Area */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shadow-inner">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-black text-gray-800 text-sm uppercase tracking-widest">Local Analyst</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isOnline ? <Wifi size={12} className="text-emerald-500" /> : <WifiOff size={12} className="text-red-500" />}
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isOnline ? 'text-emerald-600' : 'text-red-600'}`}>
                {isOnline ? 'Ollama Online' : 'Ollama Offline'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
          <Database size={14} />
          <span className="text-xs font-bold">MCP Linked</span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-gray-800 text-white' : 'bg-blue-600 text-white'}`}>
              {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-gray-800 text-white rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm'}`}>
              <div className="whitespace-pre-wrap font-medium" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>') }} />
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-4 max-w-[80%]">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Bot size={14} />
            </div>
            <div className="bg-white px-4 py-3 rounded-2xl border border-gray-100 flex items-center gap-2">
              <Loader2 className="animate-spin text-blue-500" size={16} />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Querying MCP...</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex items-center gap-3">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 shadow-inner outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400"
            placeholder={isOnline ? "Ask your local analyst a question..." : "Please start Ollama..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!isOnline || isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={!isOnline || isLoading || !input.trim()}
          className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors shadow-sm shadow-blue-200"
        >
          <Send size={18} className={input.trim() ? "translate-x-0.5 -translate-y-0.5 transition-transform" : ""} />
        </button>
      </form>
    </div>
  );
}