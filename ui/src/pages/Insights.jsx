import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Wifi, WifiOff } from 'lucide-react';

export default function Insights() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I am your local financial analyst. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Check if Ollama is running locally
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
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen2.5:14b', // or your preferred model like 'mistral'
          messages: [...messages, userMsg],
          stream: false // Set to false for simpler UI logic initially
        }),
      });

      const data = await response.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message.content
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error: I cannot reach Ollama. Make sure it is running with OLLAMA_ORIGINS="*"'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Add this effect to manage focus transitions
  useEffect(() => {
    if (!isLoading && isOnline) {
      // A tiny delay (50ms) ensures the DOM has re-enabled the input
      // after the 'disabled' prop changes to false.
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          // Optional: Ensure cursor is at the end of any text
          const len = inputRef.current.value.length;
          inputRef.current.setSelectionRange(len, len);
        }
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [isLoading, isOnline]);

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

      {/* Header Status */}
      <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
        <div className="flex items-center gap-2">
          <Bot className="text-blue-600" size={20} />
          <span className="font-black text-sm uppercase tracking-widest text-gray-700">AI Financial Insights</span>
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
            <div className={`max-w-[80%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-100'}`}>
                {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-gray-600" />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'bg-gray-100 text-gray-800'}`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-gray-100 p-4 rounded-2xl">
              <Loader2 className="animate-spin text-gray-400" size={18} />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-4 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
        <div className="flex-1 relative"> {/* Wrapper to help with layout stability */}
          <input
            ref={inputRef}
            type="text"
            tabIndex={0}
            className="w-full bg-white border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 shadow-sm outline-hidden transition-all"
            placeholder={isOnline ? "Ask about your spending..." : "Please start Ollama to chat..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!isOnline || isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={!isOnline || isLoading}
          className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:bg-gray-400 shadow-lg shadow-blue-100 transition-all flex-shrink-0"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}