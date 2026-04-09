"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, X, Send, Cpu } from "lucide-react";
import chatData from "../data/chatResponses.json";

export const AgentSumit = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "agent", content: "Systems online. AGENT_SUMIT initialized. Awaiting input or terminal command..." }
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setInput("");

    // Simple keyword matching for static RAG approach
    setTimeout(() => {
      let agentResponse = chatData.default;
      const lowerInput = userMessage.toLowerCase();

      for (const item of chatData.responses) {
        if (item.keywords.some(kw => lowerInput.includes(kw))) {
          agentResponse = item.response;
          break;
        }
      }

      setMessages(prev => [...prev, { role: "agent", content: agentResponse }]);
    }, 600); // Simulate processing delay
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-black border border-[#00f3ff] rounded-full shadow-[0_0_20px_rgba(0,243,255,0.3)] flex items-center justify-center group hover:bg-[#00f3ff]/10 transition-colors"
          >
            <div className="absolute inset-0 rounded-full border border-[#00f3ff] animate-ping opacity-20"></div>
            <Cpu className="text-[#00f3ff] group-hover:scale-110 transition-transform" size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 glass-panel rounded-lg shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: '80vh', height: '500px' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#00f3ff]/20 bg-black/50">
              <div className="flex items-center gap-2">
                <Terminal className="text-[#00f3ff]" size={18} />
                <span className="font-orbitron text-xs text-[#00f3ff] uppercase tracking-widest">
                  Agent.Sumit_v2.0
                </span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-[#ff00ff] transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-black/40">
              <div className="flex flex-col gap-4">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] rounded-md p-3 font-inter text-sm ${
                      msg.role === 'user' 
                        ? 'bg-[#00f3ff]/20 border border-[#00f3ff]/50 text-white' 
                        : 'bg-white/5 border border-white/10 text-gray-300'
                    }`}>
                      {msg.role === 'agent' && (
                        <span className="text-[#00f3ff] font-orbitron text-[10px] block mb-1 tracking-widest">
                          &gt; SYSTEM
                        </span>
                      )}
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 border-t border-[#00f3ff]/20 bg-black/60 flex gap-2">
              <span className="text-[#ff00ff] font-orbitron mt-2">$</span>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask query or try /bio..."
                className="flex-1 bg-transparent border-none outline-none text-white font-inter text-sm placeholder:text-gray-600 focus:ring-0"
              />
              <button 
                type="submit" 
                className="text-[#00f3ff] hover:text-white transition-colors disabled:opacity-50"
                disabled={!input.trim()}
              >
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
