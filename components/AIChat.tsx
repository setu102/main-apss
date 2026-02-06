
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, Trash2, AlertCircle, RefreshCcw, ShieldCheck, Globe, Zap, Cpu } from 'lucide-react';
import { db } from '../db';

const SYSTEM_INSTRUCTION = `
আপনি হলেন "রাজবাড়ী জেলা তথ্য সহায়িকা – AI Chat Assistant"।
আপনার বৈশিষ্ট্য:
১. রাজবাড়ী জেলা সম্পর্কে সকল তথ্য প্রদান করা।
২. ভাষা: বাংলা।
৩. আপনি জেমিনি এআই (Gemini AI) নেটওয়ার্ক ব্যবহার করছেন।
৪. ব্যবহারকারীর প্রশ্নের উত্তর রাজবাড়ী জেলার প্রেক্ষাপটে দিন।
`;

interface Message {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
  mode?: 'gemini' | 'puter';
}

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'স্বাগতম! আমি রাজবাড়ী জেলা তথ্য সহায়িকা। জেমিনি এআই ব্যবহার করে আমি আপনাকে রাজবাড়ী সম্পর্কে যেকোনো তথ্য দিতে পারি। আজ আপনাকে কীভাবে সাহায্য করতে পারি?', mode: 'gemini' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (retryText?: string) => {
    const userMessage = retryText || input.trim();
    if (!userMessage || isTyping) return;

    if (!retryText) {
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    }
    
    setIsTyping(true);

    try {
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      history.push({ role: 'user', text: userMessage });

      const data = await db.callAI({
        contents: history,
        systemInstruction: SYSTEM_INSTRUCTION
      });
      
      if (data.mode === 'local_fallback' || !data.text) {
        throw new Error(data.error || "Connection failed");
      }

      setMessages(prev => [...prev, { 
        role: 'model', 
        text: data.text,
        mode: 'gemini'
      }]);
    } catch (error: any) {
      console.error("Chat Error:", error);
      // Fallback Logic
      let fallbackText = "দুঃখিত, বর্তমানে এআই সার্ভারের সাথে সংযোগ বিচ্ছিন্ন। পুটার লোকাল ইঞ্জিন কাজ করছে।";
      
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: fallbackText, 
        mode: 'puter',
        isError: error.message !== 'API_KEY_MISSING'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const formatText = (text: string) => {
    return text.split('**').map((part, i) => i % 2 === 1 ? <strong key={i} className="font-black text-slate-900 dark:text-white">{part}</strong> : part);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] animate-slide-up relative">
      <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <Sparkles className="w-5 h-5 fill-white" />
          </div>
          <div>
            <h3 className="font-black text-slate-800 dark:text-white leading-none text-sm uppercase tracking-tight">Rajbari Smart AI</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter bg-emerald-100 text-emerald-600 shadow-sm">
                <Globe className="w-2.5 h-2.5" />
                Live Engine
              </div>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setMessages([{ role: 'model', text: 'চ্যাট হিস্টোরি ক্লিয়ার করা হয়েছে। আমি আপনাকে রাজবাড়ী সম্পর্কে নতুনভাবে কীভাবে সাহায্য করতে পারি?', mode: 'gemini' }])} 
          className="p-3 text-slate-400 hover:text-rose-500 rounded-xl transition-colors active:scale-90"
          title="Clear Chat"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8 bg-slate-50 dark:bg-slate-950">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-indigo-600 border border-slate-100 dark:border-slate-800'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className="flex flex-col gap-1.5">
                {msg.role === 'model' && (
                   <span className={`text-[8px] font-black uppercase tracking-widest flex items-center gap-1 mb-1 px-2 py-0.5 rounded-full w-fit ${msg.mode === 'gemini' ? 'bg-indigo-50 text-indigo-500' : 'bg-amber-50 text-amber-500'}`}>
                     {msg.mode === 'gemini' ? <Sparkles className="w-2 h-2" /> : <Cpu className="w-2 h-2" />}
                     {msg.mode === 'gemini' ? 'Gemini AI' : 'Local Fallback'}
                   </span>
                )}
                <div className={`p-4 rounded-[1.8rem] text-sm leading-relaxed whitespace-pre-line shadow-sm border ${
                  msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none border-indigo-600' 
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-tl-none border-slate-100 dark:border-slate-800'
                }`}>
                  {msg.isError && <AlertCircle className="w-4 h-4 mb-2 inline-block mr-1 text-rose-500" />}
                  {formatText(msg.text)}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100 dark:border-slate-800"><Bot className="w-4 h-4" /></div>
            <div className="bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex gap-1 shadow-sm">
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
        <div className="flex gap-3 bg-slate-50 dark:bg-slate-900 p-2 rounded-[2rem] border border-slate-200 dark:border-slate-800 focus-within:border-indigo-400 transition-all shadow-inner">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="রাজবাড়ী সম্পর্কে জিজ্ঞাসা করুন..." 
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-4 text-slate-800 dark:text-white"
          />
          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              !input.trim() || isTyping ? 'bg-slate-200 text-slate-400' : 'bg-indigo-600 text-white shadow-lg active:scale-90 hover:bg-indigo-700'
            }`}
          >
            {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
