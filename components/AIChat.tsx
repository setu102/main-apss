
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, Trash2, AlertCircle, RefreshCcw, ShieldCheck, Globe, Zap, Cpu, MapPin, Phone, TrainFront, Code2, Heart, Info } from 'lucide-react';
import { db } from '../db';
import { RAJBARI_DATA } from '../constants.tsx';

const SYSTEM_INSTRUCTION = `
আপনি হলেন "রাজবাড়ী জেলা তথ্য সহায়িকা – Smart Assistant"।
ডেভেলপার তথ্য: এই অ্যাপ্লিকেশনটি ডেভেলপ করেছেন এক্সপার্ট সফটওয়্যার ইঞ্জিনিয়ার **SOVRAB ROY** (সৌরভ রায়)।
আপনার কাজ রাজবাড়ী জেলা সম্পর্কে নির্ভুল তথ্য দেওয়া। আপনি লাইভ ক্লাউড ইঞ্জিন ব্যবহার করছেন।
`;

interface Message {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
  mode?: 'live' | 'puter';
  localData?: any[];
}

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'স্বাগতম! আমি রাজবাড়ী স্মার্ট অ্যাসিস্ট্যান্ট। রাজবাড়ী জেলা সম্পর্কে যেকোনো তথ্য জানতে আমাকে জিজ্ঞাসা করুন।', mode: 'live' }
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

  const runPuterLocalSearch = (query: string): { text: string; data: any[] } => {
    const q = query.toLowerCase();
    let results: any[] = [];
    let responseText = "";

    if (q.includes('developer') || q.includes('ডেভেলপার') || q.includes('sovrab') || q.includes('সৌরভ') || q.includes('তৈরি') || q.includes('বানিয়েছে')) {
      responseText = "এই স্মার্ট পোর্টালটি ডেভেলপ করেছেন রাজবাড়ীর সন্তান,  **SOVRAB ROY** (সৌরভ রায়)।";
    } 
    else if (q.includes('ট্রেন') || q.includes('train')) {
      results = RAJBARI_DATA.trains;
      responseText = "বর্তমানে স্মার্ট ইঞ্জিন অফলাইন মোডে কাজ করছে। রাজবাড়ী স্টেশনের প্রধান সময়সূচী নিচে দেওয়া হলো:";
    } 
    else if (q.includes('ডাক্তার') || q.includes('doctor')) {
      results = RAJBARI_DATA.doctors;
      responseText = "অফলাইন ডাটাবেস থেকে রাজবাড়ীর প্রধান ডাক্তারদের তালিকা:";
    } 
    else if (q.includes('জরুরি') || q.includes('emergency')) {
      results = RAJBARI_DATA.emergency;
      responseText = "রাজবাড়ী জেলার জরুরি হেল্পলাইন নম্বরগুলো:";
    }
    else {
      responseText = "দুঃখিত, বর্তমানে লাইভ সার্ভার সংযোগ বিচ্ছিন্ন থাকায় আমি আপনার প্রশ্নের সরাসরি উত্তর দিতে পারছি না। তবে রাজবাড়ীর ট্রেন বা ডাক্তার সম্পর্কে জানতে 'ট্রেন' বা 'ডাক্তার' লিখে সার্চ করতে পারেন।";
    }

    return { text: responseText, data: results };
  };

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
        throw new Error("SERVER_OFFLINE");
      }

      setMessages(prev => [...prev, { role: 'model', text: data.text, mode: 'live' }]);
    } catch (error: any) {
      const puterResponse = runPuterLocalSearch(userMessage);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: puterResponse.text, 
        mode: 'puter',
        localData: puterResponse.data
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
            <h3 className="font-black text-slate-800 dark:text-white leading-none text-sm uppercase tracking-tight">Smart Assistant</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter bg-emerald-100 text-emerald-600 shadow-sm">
                <Globe className="w-2.5 h-2.5" />
                Live Server
              </div>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setMessages([{ role: 'model', text: 'সবকিছু ক্লিয়ার করা হয়েছে। নতুনভাবে কী জানতে চান?', mode: 'live' }])} 
          className="p-3 text-slate-400 hover:text-rose-500 rounded-xl transition-colors active:scale-90"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8 bg-slate-50 dark:bg-slate-950">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[92%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-indigo-600 border border-slate-100 dark:border-slate-800'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className="flex flex-col gap-1.5">
                {msg.role === 'model' && (
                   <span className={`text-[8px] font-black uppercase tracking-widest flex items-center gap-1 mb-1 px-2 py-0.5 rounded-full w-fit ${msg.mode === 'live' ? 'bg-indigo-50 text-indigo-500' : 'bg-amber-100 text-amber-600'}`}>
                     {msg.mode === 'live' ? <Sparkles className="w-2 h-2" /> : <Cpu className="w-2 h-2" />}
                     {msg.mode === 'live' ? 'Smart Cloud Engine' : 'Offline Engine'}
                   </span>
                )}
                <div className={`p-4 rounded-[1.8rem] text-sm leading-relaxed whitespace-pre-line shadow-sm border ${
                  msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none border-indigo-600' 
                  : msg.mode === 'puter' 
                    ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-900 rounded-tl-none'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-tl-none border-slate-100 dark:border-slate-800'
                }`}>
                  {formatText(msg.text)}
                  
                  {msg.localData && msg.localData.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {msg.localData.slice(0, 4).map((item, i) => (
                        <div key={i} className="bg-white/50 dark:bg-black/20 p-3 rounded-xl border border-white/20 flex justify-between items-center transition-all active:scale-95">
                          <div className="flex items-center gap-2">
                            {item.route ? <TrainFront className="w-3.5 h-3.5 text-indigo-600" /> : <User className="w-3.5 h-3.5 text-indigo-600" />}
                            <div className="flex flex-col">
                                <span className="text-[11px] font-black text-slate-800 dark:text-white">{item.name}</span>
                                <span className="text-[8px] text-slate-400 font-bold uppercase">{item.specialty || item.route || item.type}</span>
                            </div>
                          </div>
                          {(item.mobile || item.number) && <a href={`tel:${item.mobile || item.number}`} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Phone className="w-3.5 h-3.5" /></a>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100 dark:border-slate-800"><Bot className="w-4 h-4" /></div>
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
            placeholder="কিছু জানতে জিজ্ঞাসা করুন..." 
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
