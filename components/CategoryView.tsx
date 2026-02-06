
import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  MapPin, 
  Loader2, 
  TrainFront,
  X,
  Sparkles,
  Info,
  RefreshCcw,
  AlertCircle,
  Clock,
  Globe,
  Activity,
  Zap,
  MessageCircle,
  Navigation2,
  Cpu,
  Facebook,
  ShoppingBasket,
  Megaphone,
  Briefcase,
  TrendingUp,
  TrendingDown,
  Calendar,
  Building2,
  UserRoundSearch,
  Landmark,
  School,
  Crown
} from 'lucide-react';
import { Category, Train, AIInference } from '../types.ts';
import { db } from '../db.ts';

interface CategoryViewProps {
  category: Category;
  onBack: () => void;
}

const CategoryView: React.FC<CategoryViewProps> = ({ category }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrain, setSelectedTrain] = useState<Train | null>(null);
  const [isInferring, setIsInferring] = useState(false);
  const [currentStation, setCurrentStation] = useState<string | null>(null);
  const [inferenceMode, setInferenceMode] = useState<'gemini' | 'puter'>('gemini');
  const [aiInference, setAiInference] = useState<AIInference & { reason: string }>({ 
    delayMinutes: 0, 
    confidence: 0, 
    reason: '', 
    isAI: true 
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const items = await db.getCategory(category);
      setData(items);

      if (category === 'market_price' || items.length === 0) {
        const aiResponse = await db.callAI({
          contents: `বর্তমানে ২০২৬ সাল। রাজবাড়ী জেলার আজকের ${category === 'market_price' ? 'বাজারদর' : 'সবশেষ তথ্য'} বের করুন এবং JSON অ্যারে হিসেবে দিন।`,
          systemInstruction: "আপনি রাজবাড়ী জেলার লাইভ ডাটা অ্যাসিস্ট্যান্ট। কেবল JSON রিটার্ন করুন।",
          useSearch: true
        });
        const aiItems = db.extractJSON(aiResponse.text);
        if (aiItems && Array.isArray(aiItems) && aiItems.length > 0) {
          setData(aiItems);
        }
      }
    } catch (e: any) {
      console.error("Fetch Error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, [category]);

  const generateLocalReasoning = (train: Train, errorType?: string) => {
    const hour = new Date().getHours();
    let status = `ট্রেনটি বর্তমানে রাজবাড়ী থেকে তার গন্তব্যের পথে রয়েছে।`;
    if (hour < 8) status = `ট্রেনটি যাত্রা শুরু করার প্রস্তুতি নিচ্ছে।`;
    
    let prefix = "সিস্টেম নোট (অফলাইন): বর্তমানে জেমিনি এআই সার্ভার ডাউন।";
    if (errorType === 'TIMEOUT') prefix = "সিস্টেম নোট: লাইভ ডাটা সার্চ করতে অনেক সময় লাগছে।";
    
    return `${prefix} লোকাল ডাটাবেস অনুযায়ী: ট্রেনটি রাজবাড়ী থেকে ছেড়ে সূর্যনগর, বেলগাছি ও কালুখালী জংশন হয়ে গন্তব্যে যাবে। বর্তমান সময় অনুযায়ী: ${status}`;
  };

  const runTrainTracking = async (train: Train) => {
    if (isInferring) return;
    setIsInferring(true);
    setCurrentStation(null);
    setAiInference({ delayMinutes: 0, confidence: 0, reason: 'Gemini AI (২০২৬ লাইভ ডাটা) ফেসবুক ও ওয়েব সার্চ করছে...', isAI: true });
    
    const response = await db.callAI({
      contents: `২০২৬ সাল। ট্রেনের নাম: ${train.name}। ফেসবুকের "Rajbari Train Tracking Group" বা "বাংলাদেশ রেলওয়ে" গ্রুপ থেকে আজকের সর্বশেষ অবস্থান বের করুন। তথ্যটি স্পষ্টভাবে বাংলায় ব্যাখ্যা করুন।`,
      systemInstruction: "আপনি একজন ২০২৬ সালের স্মার্ট রেলওয়ে অ্যাসিস্ট্যান্ট। ফেসবুক ও ওয়েবের লাইভ ডাটা ব্যবহার করে সঠিক অবস্থান বলুন।",
      useSearch: true
    });

    if (response.mode === 'local_fallback' || !response.text) {
      setInferenceMode('puter');
      setAiInference({ delayMinutes: 0, confidence: 0.7, reason: generateLocalReasoning(train, response.error), isAI: true });
    } else {
      setInferenceMode('gemini');
      setAiInference({ delayMinutes: 0, confidence: 1.0, reason: response.text, isAI: true });
      
      // Try to highlight current station on route map
      const stations = train.detailedRoute.split(',').map(s => s.trim());
      const foundStation = stations.find(s => response.text!.includes(s));
      if (foundStation) setCurrentStation(foundStation);
    }
    setIsInferring(false);
  };

  const formatText = (text: string) => {
    return text.split('**').map((part, i) => i % 2 === 1 ? <strong key={i} className="font-black text-slate-900 dark:text-white">{part}</strong> : part);
  };

  const renderItem = (item: any) => {
    if (category === 'trains') return (
      <div key={item.id} onClick={() => { setSelectedTrain(item); runTrainTracking(item); }} className="bg-white dark:bg-slate-900 p-6 rounded-[2.8rem] shadow-sm mb-4 border border-slate-100 dark:border-slate-800 flex flex-col gap-4 cursor-pointer active:scale-95 transition-all group relative overflow-hidden">
        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform"><TrainFront className="w-6 h-6" /></div>
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white text-lg mb-1">{item.name}</h4>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{item.route}</p>
            </div>
          </div>
          <div className="text-right">
             <div className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 text-[9px] font-black px-2 py-0.5 rounded-full mb-1 border border-indigo-100 uppercase flex items-center gap-1">
               <Zap className="w-2 h-2 fill-indigo-600" /> Smart Live 2026
             </div>
             <p className="text-sm font-black text-slate-800 dark:text-white">{item.departure}</p>
          </div>
        </div>
      </div>
    );
    // ... rest of the renderItem logic (same as before)
    if (category === 'market_price') return (
      <div key={item.id} className="bg-white dark:bg-slate-900 p-5 rounded-[2.2rem] mb-3 flex items-center justify-between border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 flex items-center justify-center bg-lime-50 dark:bg-lime-900/20 rounded-2xl text-lime-600 shadow-inner"><ShoppingBasket className="w-6 h-6" /></div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-white text-sm">{item.name} <span className="text-[10px] text-slate-400 font-normal">({item.unit})</span></h4>
            <p className="text-[12px] font-black text-indigo-600 mt-0.5">{item.priceRange}</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          {item.trend === 'up' ? <TrendingUp className="w-4 h-4 text-rose-500" /> : item.trend === 'down' ? <TrendingDown className="w-4 h-4 text-emerald-500" /> : <Clock className="w-4 h-4 text-slate-300" />}
        </div>
      </div>
    );

    if (category === 'notices') return (
      <div key={item.id} className={`p-6 rounded-[2.5rem] mb-4 border shadow-sm ${item.priority === 'high' ? 'bg-rose-50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/50' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
        <div className="flex items-center gap-3 mb-3">
          <Megaphone className={`w-5 h-5 ${item.priority === 'high' ? 'text-rose-600' : 'text-orange-500'}`} />
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{item.date}</span>
        </div>
        <h4 className="font-black text-slate-800 dark:text-white text-md mb-2">{item.title}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.summary}</p>
      </div>
    );

    if (category === 'jobs') return (
      <div key={item.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] mb-4 border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-2xl"><Briefcase className="w-6 h-6" /></div>
          <div>
            <h4 className="font-black text-slate-800 dark:text-white text-md">{item.title}</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase">{item.org} • {item.type}</p>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800 pt-4">
           <span className="text-[10px] font-bold text-slate-400">মেয়াদ: {item.deadline}</span>
           <a href={item.link} className="text-indigo-600 text-xs font-black flex items-center gap-1">আবেদন <Navigation2 className="w-3 h-3 rotate-45" /></a>
        </div>
      </div>
    );

    const getIcon = () => {
      if (category === 'doctors') return <UserRoundSearch className="w-6 h-6 text-blue-500" />;
      if (category === 'hospitals') return <Building2 className="w-6 h-6 text-emerald-500" />;
      if (category === 'govt_services') return <Landmark className="w-6 h-6 text-cyan-600" />;
      if (category === 'education') return <School className="w-6 h-6 text-sky-500" />;
      if (category === 'personalities') return <Crown className="w-6 h-6 text-amber-500" />;
      return <Info className="w-6 h-6 text-indigo-500" />;
    };

    return (
      <div key={item.id} className="bg-white dark:bg-slate-900 p-5 rounded-[2.2rem] mb-3 flex items-center justify-between border border-slate-50 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-2xl shadow-inner">
            {getIcon()}
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-white text-sm">{item.name || item.title || item.org}</h4>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">{item.number || item.mobile || item.time || item.deadline || item.specialty || item.service}</p>
          </div>
        </div>
        {(item.mobile || item.number) && <a href={`tel:${item.mobile || item.number}`} className="p-4 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 rounded-2xl active:scale-90 transition-all"><Phone className="w-5 h-5" /></a>}
      </div>
    );
  };

  return (
    <div className="px-6 py-6 pb-40 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase leading-none mb-1">
            {category === 'trains' ? 'AI স্মার্ট ট্র্যাকিং' : 
             category === 'market_price' ? 'লাইভ বাজারদর' : 
             category === 'notices' ? 'অফিসিয়াল নোটিশ' :
             category === 'jobs' ? 'চাকরি বিজ্ঞপ্তি' : 'বিস্তারিত তালিকা'}
          </h3>
          <p className="text-[10px] text-indigo-500 font-black uppercase tracking-[0.5em]">
            District Smart Portal 2026
          </p>
        </div>
        <button onClick={fetchData} className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 text-indigo-600 active:rotate-180 transition-all">
           <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-6">
          <Loader2 className="w-16 h-16 animate-spin text-indigo-600 opacity-20" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">লোড হচ্ছে...</p>
        </div>
      ) : (
        <div className="animate-slide-up">
          {data.length > 0 ? data.map(renderItem) : <div className="text-center py-20"><p className="text-slate-400 font-bold text-sm">তথ্য পাওয়া যায়নি</p></div>}
        </div>
      )}

      {selectedTrain && (
        <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-end md:items-center justify-center p-4">
          <div className="bg-slate-50 dark:bg-slate-900 w-full max-w-lg rounded-[3rem] overflow-hidden shadow-3xl relative animate-slide-up flex flex-col max-h-[95vh]">
            <button onClick={() => { setSelectedTrain(null); setCurrentStation(null); }} className="absolute top-6 right-6 p-2 bg-white dark:bg-slate-800 rounded-full text-slate-400 z-50 shadow-md hover:text-rose-500 transition-all"><X className="w-5 h-5" /></button>
            <div className="p-8 pb-32 overflow-y-auto no-scrollbar">
               <div className="flex items-center gap-4 mb-8">
                 <div className="w-14 h-14 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl"><TrainFront className="w-7 h-7" /></div>
                 <div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white leading-tight">{selectedTrain.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                       <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${inferenceMode === 'gemini' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'} flex items-center gap-1 shadow-sm`}>
                         {inferenceMode === 'gemini' ? <Sparkles className="w-2.5 h-2.5" /> : <Cpu className="w-2.5 h-2.5" />}
                         {inferenceMode === 'gemini' ? 'Gemini AI (Cloud Live)' : 'Puter Engine (Simulated)'}
                       </span>
                    </div>
                 </div>
               </div>
               <div className="bg-white dark:bg-slate-800/50 rounded-[2.2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-sm mb-8 relative overflow-hidden">
                  <div className="flex items-center gap-2 mb-4">
                    <Facebook className={`w-4 h-4 ${inferenceMode === 'gemini' ? 'text-blue-500' : 'text-slate-400'}`} />
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Live Social Data 2026</span>
                  </div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                    {formatText(aiInference.reason)}
                  </div>
               </div>
               <div className="space-y-4">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><Navigation2 className="w-3 h-3 rotate-45" /> Route Map</h4>
                 <div className="relative pl-8 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-200 dark:before:bg-slate-700">
                    {selectedTrain.detailedRoute.split(',').map((st, idx) => {
                      const stationName = st.trim();
                      const isCurrent = currentStation && stationName.includes(currentStation);
                      return (
                        <div key={idx} className="relative flex items-center gap-4">
                          <div className={`absolute -left-[22px] w-3.5 h-3.5 rounded-full border-2 bg-white dark:bg-slate-900 transition-all duration-700 ${isCurrent ? 'border-indigo-600 bg-indigo-600 scale-150 shadow-[0_0_15px_rgba(79,70,229,0.3)]' : 'border-slate-300 dark:border-slate-600'}`}></div>
                          <span className={`text-xs font-bold transition-all ${isCurrent ? 'text-indigo-600 dark:text-indigo-400 scale-110' : 'text-slate-400'}`}>{stationName}</span>
                        </div>
                      );
                    })}
                 </div>
               </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
               <button 
                 disabled={isInferring}
                 onClick={() => runTrainTracking(selectedTrain)}
                 className="w-full py-5 bg-indigo-600 rounded-[1.8rem] flex items-center justify-center gap-3 text-white font-black shadow-xl active:scale-95 transition-all disabled:opacity-50"
               >
                 {isInferring ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCcw className="w-5 h-5" />}
                 লাইভ আপডেট চেক করুন
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryView;
