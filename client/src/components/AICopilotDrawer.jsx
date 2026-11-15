import React, { useState, useEffect, useRef } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import MarkdownRenderer from './MarkdownRenderer';
import { 
  Sparkles, 
  X, 
  Send, 
  RotateCcw, 
  Copy, 
  Check, 
  Bot, 
  User, 
  ChevronRight, 
  TrendingUp, 
  AlertTriangle, 
  BookOpen, 
  MessageSquare, 
  Truck,
  ArrowRight
} from 'lucide-react';

const SUGGESTIONS = [
  { label: "Today's Sales & Revenue?", query: "What are today's sales, discounts, and customer revenue metrics?" },
  { label: "Low Stock Items?", query: "Which inventory products are running low on stock?" },
  { label: "Draft WhatsApp Offer", query: "Can you draft a high-converting 20% off WhatsApp weekend discount promo message?" },
  { label: "Customer Udhaar Balances", query: "Who owes us money and what is the total outstanding market udhaar?" },
  { label: "Net Profit & Loss", query: "What is our net profit or loss based on sales and operating expenses?" },
  { label: "Staff Attendance Today", query: "Who is on duty today and what is our monthly payroll obligation?" },
  { label: "Supplier Accounts Payable", query: "How much do we owe our suppliers and what are pending vendor orders?" }
];

export default function AICopilotDrawer() {
  const { merchant } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: `### 👋 Welcome to Antigravity AI Copilot!

I am connected to your live store database for **${merchant?.store_name || 'your store'}**. 

You can ask me to:
* 📊 Summarize sales and checkout loyalty discounts
* ⚠️ Identify inventory items needing restock
* 📒 Review customer Udhaar credit debts
* 💬 Draft personalized WhatsApp promotional offers
* 📈 Calculate your net profit & operating margins

Try one of the quick suggestions below or type your question!`
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || loading) return;

    const userMessageId = `user-${Date.now()}`;
    const newMessages = [
      ...messages,
      { id: userMessageId, sender: 'user', text: query }
    ];

    setMessages(newMessages);
    setInputQuery('');
    setLoading(true);

    try {
      // Build conversation history for API
      const historyPayload = newMessages
        .filter(m => m.id !== 'welcome')
        .slice(-6)
        .map(m => ({ sender: m.sender, text: m.text }));

      const res = await api.ai.chat(query, historyPayload);

      if (res.success && res.reply) {
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: res.reply,
            source: res.source
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: "I encountered an issue processing that query. Please try asking again in a moment."
          }
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `⚠️ **Error connecting to AI Copilot**: ${err.message || 'Unable to reach backend service.'}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: `### 🔄 Chat Reset

I am ready for your next question! Ask about your real-time sales, low stock alerts, customer khata balances, or WhatsApp broadcast drafts.`
      }
    ]);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-extrabold text-xs sm:text-sm shadow-2xl shadow-indigo-600/50 hover:scale-105 active:scale-95 transition-all group border border-white/20"
        title="Open AI Business Copilot"
      >
        <div className="relative">
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
        </div>
        <span>Copilot AI</span>
        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/20 text-white hidden sm:inline-block">
          Live Store
        </span>
      </button>

      {/* Slide-over Drawer Backdrop */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Slide-over Drawer Panel */}
      <div className={`fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[460px] bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col transition-transform duration-300 ease-out transform ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-sm sm:text-base tracking-tight">Antigravity Copilot</h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Connected to {merchant?.store_name || 'Merchant'} database
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleResetChat}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Reset Conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-900/30 shrink-0">
          <div className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 px-1 tracking-wider">
            Quick Inquiries
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {SUGGESTIONS.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(sug.query)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-950/20 text-slate-300 hover:text-white text-[11px] font-medium whitespace-nowrap transition shrink-0 flex items-center gap-1"
              >
                <span>{sug.label}</span>
                <ArrowRight className="w-2.5 h-2.5 text-indigo-400 opacity-60" />
              </button>
            ))}
          </div>
        </div>

        {/* Chat Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div 
                key={msg.id} 
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs ${
                  isUser 
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-none shadow-md shadow-indigo-600/20' 
                    : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none space-y-2'
                }`}>
                  {isUser ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  ) : (
                    <>
                      <MarkdownRenderer content={msg.text} />
                      
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-500">
                        <span className="font-mono">
                          {msg.source ? `model: ${msg.source}` : 'Antigravity Store Copilot'}
                        </span>
                        <button
                          onClick={() => handleCopyText(msg.id, msg.text)}
                          className="flex items-center gap-1 text-slate-400 hover:text-white transition"
                          title="Copy Answer"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400 font-bold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing Indicator */}
          {loading && (
            <div className="flex gap-2.5 justify-start items-center">
              <div className="w-7 h-7 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[11px] text-slate-400">Copilot analyzing store records...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Bar */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-900/60 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask about sales, low stock, debts, or draft offers..."
              disabled={loading}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-95 disabled:opacity-40 transition shadow-md shadow-indigo-600/30 shrink-0"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-[10px] text-slate-500 text-center mt-1.5">
            Powered by Google Gemini 1.5 & Real-Time Tenant CRM Engine
          </div>
        </div>
      </div>
    </>
  );
}
