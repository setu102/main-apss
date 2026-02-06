
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
  Zap,
  Globe,
  Facebook,
  ShoppingBasket,
  Megaphone,
  Briefcase,
  TrendingUp,
  TrendingDown,
  Clock,
  ExternalLink,
  History,
  ChevronRight,
  Link as LinkIcon
} from 'lucide-react';
import { Category, Train } from '../types.ts';
import { db } from '../db.ts';

interface CategoryViewProps {
  category: Category;
  onBack: () => void;
}

const STATION_ALIASES: Record<string, string[]> = {
  "ঢাকা (কমলাপুর)": ["ঢাকা", "কমলাপুর", "komlapur", "dhaka"],
  "রাজবাড়ী": ["রাজবাড়ি", "রাজবাড়ী", "rajbari"],
  "পাংশা": ["পাংশা", "pangsha"],
  "ভাঙ্গা জংশন": ["ভাঙ্গা", "bhanga"],
  "মাওয়া": ["মাওয়া", "mawa"],
  "বেনাপোল": ["বেনাপোল", "benapole"],
  "কুষ্টিয়া কোর্ট": ["কুষ্টিয়া", "কুষ্টিয়া", "kushtia"],
  "পোড়াদহ জংশন": ["পোড়াদহ", "poradoho"],
  "চুয়াডাঙ্গা": ["চুয়াডাঙ্গা", "chuadanga"],
  "খুলনা": ["খুলনা", "khulna"]
};

const CategoryView: React.FC<CategoryViewProps> = ({ category }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [dataSource, setDataSource] = useState<'live' | 'local' | 'cache'>('local');
  const [selectedTrain, setSelectedTrain] = useState<Train | null>(null);
  const [isInferring, setIsInferring] = useState(false);
  const [currentStation, setCurrentStation] = useState<string | null>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [aiInference, setAiInference] = useState({ 
    reason: 'লাইভ ডাটা লোড হচ্ছে...', 
    delay: '০ মিনিট'
  });

  const getLiveTimeContext = () => {
    const now = new Date();
    return `আজ ${now.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}, সময় ${now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
  };

  const fetchData = async (forceRefresh = false) => {
    setLoading(true);
    setIsAiLoading(false);
    
    try {
      const localItems = await db.getCategory(category);
      setData(localItems);
      setDataSource('local');
      
      if (['market_price', 'notices', 'jobs'].includes(category)) {
        if (category === 'jobs' && !forceRefresh) {
          const cachedData = localStorage.getItem('rajbari_jobs_cache');
          const cacheTime = localStorage.getItem('rajbari_jobs_timestamp');
          const today = new Date().toDateString();

          if (cachedData && cacheTime === today) {
            setData(JSON.parse(cachedData));
            setDataSource('cache');
            setLoading(false);
            return;
          }
        }
        await fetchAiCategoryData(category, localItems);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAiCategoryData = async (cat: string, fallbackData: any[]) => {
    setIsAiLoading(true);
    const timeContext = getLiveTimeContext();
    let prompt = "";

    if (cat === 'market_price') {
      prompt = `${timeContext}। রাজবাড়ীর আজকের লাইভ বাজারদর দিন। ফরম্যাট: [{name, unit, priceRange, trend: 'up'|'down'|'stable'}]`;
    } else if (cat === 'notices') {
      prompt = `${timeContext}। রাজবাড়ী জেলা প্রশাসনের সর্বশেষ ৫টি জরুরি নোটিশ ও সারাংশ দিন। ফরম্যাট: [{title, date, summary, priority: 'high'|'normal'}]`;
    } else if (cat === 'jobs') {
      prompt = `${timeContext}। রাজবাড়ী জেলার আজকের লেটেস্ট চাকরির বিজ্ঞপ্তি দিন। ফরম্যাট: [{title, org, deadline, link, type: 'Govt'|'Private'}]`;
    }

    try {
      const response = await db.callAI({
        contents: prompt,
        category: cat,
        useSearch: true
      });

      if (response.mode === 'local_engine' || !response.text) throw new Error("FAIL");

      const aiParsed = db.extractJSON(response.text);
      if (aiParsed && Array.isArray(aiParsed)) {
        setData(aiParsed);
        setDataSource('live');
        if (cat === 'jobs') {
          localStorage.setItem('rajbari_jobs_cache', JSON.stringify(aiParsed));
          localStorage.setItem('rajbari_jobs_timestamp', new Date().toDateString());
        }
      }
    } catch (e) {
      setData(fallbackData);
      setDataSource('local');
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [category]);

  const normalize = (text: string) => text.toLowerCase().replace(/[ড়র]/g, 'র').replace(/\s+/g, '').trim();

  const findStationInText = (text: string, route: string) => {
    if (!text) return null;
    const stations = route.split(',').map(s => s.trim());
    const nText = normalize(text);
    for (const station of stations) {
      const aliases = STATION_ALIASES[station] || [station];
      for (const alias of aliases) {
        if (nText.includes(normalize(alias))) return station;
      }
    }
    return null;
  };

  const runTrainTracking = async (train: Train) => {
    if (isInferring) return;
    setIsInferring(true);
    setCurrentStation(null);
    setSources([]);
    const timeContext = getLiveTimeContext();
    setAiInference({ reason: 'স্মার্ট ইঞ্জিন ক্লাউড থেকে তথ্য সংগ্রহ করছে...', delay: 'হিসাব হচ্ছে...' });
    
    try {
      const prompt = `${timeContext}। ${train.name} ট্রেনটির (রুট: ${train.route}) বর্তমান লাইভ অবস্থান কোথায়? রাজবাড়ী রেলওয়ে নিউজ পোর্টাল চেক করুন।`;
      const response = await db.callAI({ contents: prompt, useSearch: true });
      
      if (response.mode === 'local_engine' || !response.text) throw new Error("FAIL");
      
      setAiInference({ reason: response.text, delay: 'লাইভ ডাটা অনুযায়ী' });
      setSources(response.sources || []);
      const found = findStationInText(response.text, train.detailedRoute);
      if (found) setCurrentStation(found);
    } catch (error) {
      // Improved Fallback Estimation
      const now = new Date();
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      const totalMinutes = currentHour * 60 + currentMin;

      // Extract departure time (e.g., "06:10 AM")
      const depTimeStr = train.departure;
      const isPM = depTimeStr.includes('PM');
      const timeParts = depTimeStr.replace(' AM', '').replace(' PM', '').split(':');
      let depHour = parseInt(timeParts[0]);
      if (isPM && depHour < 12) depHour += 12;
      const depMinutes = depHour * 60 + parseInt(timeParts[1]);

      const stations = train.detailedRoute.split(',').map(s => s.trim());
      const travelDiff = totalMinutes - depMinutes;

      let estimatedIdx = 0;
      if (travelDiff < 0) {
        estimatedIdx = 0; // Not yet departed
      } else {
        // Assume roughly 30 mins between major station chunks
        estimatedIdx = Math.min(Math.floor(travelDiff / 30), stations.length - 1);
      }

      const loc = stations[estimatedIdx];

      setAiInference({ 
        reason: `অফলাইন মোড নোট: লাইভ সার্ভারে কানেক্ট করা যায়নি।\nনির্ধারিত সময়সূচী অনুযায়ী ট্রেনটি এখন সম্ভবত ${loc} স্টেশনের আশেপাশে অবস্থান করছে। এটি একটি স্মার্ট ক্যালকুলেশন, নিশ্চিত তথ্য নয়।`, 
        delay: 'শিডিউল অনুযায়ী' 
      });
      setCurrentStation(loc);
    } finally {
      setIsInferring(false);
    }
  };

  const renderItem = (item: any, index: number) => {
    if (category === 'trains') return (
      <div key={item.id || index} onClick={() => { setSelectedTrain(item); runTrainTracking(item); }} className="bg-white dark:bg-slate-900 p-6 rounded-[2.8rem] shadow-sm mb-4 border border-slate-100 dark:border-slate-800 flex flex-col gap-4 cursor-pointer active:scale-95 transition-all group relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors"></div>
        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform"><TrainFront className="w-6 h-6" /></div>
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white text-lg mb-1">{item.name}</h4>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{item.route}</p>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
             <div className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 text-[9px] font-black px-3 py-1 rounded-full mb-1 border border-indigo-100/50 uppercase flex items-center gap-1 shadow-sm">
               <Zap className="w-2.5 h-2.5 fill-indigo-600 animate-pulse" /> Tracker
             </div>
             <p className="text-sm font-black text-slate-800 dark:text-white mt-1">{item.departure}</p>
          </div>
        </div>
      </div>
    );

    if (category === 'market_price') return (
      <div key={item.id || index} className="bg-white dark:bg-slate-900 p-5 rounded-[2.2rem] mb-3 flex items-center justify-between border border-slate-50 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 flex items-center justify-center bg-lime-50 dark:bg-lime-950/20 rounded-2xl text-lime-600">
            <ShoppingBasket className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-white text-sm">{item.name}</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.unit}</p>
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
          <p className="text-sm font-black text-slate-800 dark:text-white">{item.priceRange}</p>
          {item.trend === 'up' && <span className="flex items-center text-[10px] text-rose-500 font-bold"><TrendingUp className="w-3 h-3 mr-1" /> বাড়ছে</span>}
          {item.trend === 'down' && <span className="flex items-center text-[10px] text-emerald-500 font-bold"><TrendingDown className="w-3 h-3 mr-1" /> কমছে</span>}
        </div>
      </div>
    );

    if (category === 'notices') return (
      <div key={item.id || index} className={`bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] mb-4 border ${item.priority === 'high' ? 'border-rose-100 dark:border-rose-900/50 bg-rose-50/30' : 'border-slate-100 dark:border-slate-800'} shadow-sm`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-xl ${item.priority === 'high' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
            <Megaphone className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.date}</span>
        </div>
        <h4 className="font-bold text-slate-800 dark:text-white text-base mb-2 leading-tight">{item.title}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">{item.summary}</p>
      </div>
    );

    if (category === 'jobs') return (
      <div key={item.id || index} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] mb-4 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center text-purple-600">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white text-sm">{item.title}</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase">{item.org}</p>
            </div>
          </div>
          <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 text-[8px] font-black px-2 py-1 rounded-full uppercase">{item.type}</span>
        </div>
        <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-50 dark:border-slate-800">
           <div className="flex items-center gap-2 text-slate-400">
             <Clock className="w-3.5 h-3.5" />
             <span className="text-[10px] font-bold">শেষ সময়: {item.deadline}</span>
           </div>
           <a href={item.link} target="_blank" className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase">
             বিস্তারিত <ExternalLink className="w-3 h-3" />
           </a>
        </div>
      </div>
    );
    
    return (
        <div key={item.id || index} className="bg-white dark:bg-slate-900 p-5 rounded-[2.2rem] mb-3 flex items-center justify-between border border-slate-50 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-2xl text-indigo-500"><Info className="w-6 h-6" /></div>
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white text-sm">{item.name || item.title}</h4>
              <p className="text-[10px] text-slate-400 font-bold">{item.number || item.mobile || item.time || item.deadline || item.priceRange}</p>
            </div>
          </div>
          {(item.mobile || item.number) && <a href={`tel:${item.mobile || item.number}`} className="p-4 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 rounded-2xl active:scale-90 transition-all"><Phone className="w-5 h-5" /></a>}
        </div>
    );
  };

  return (
    <div className="px-6 py-6 pb-44 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase leading-none mb-1">
             {category === 'trains' ? 'স্মার্ট ট্রেন রাডার' : 
              category === 'market_price' ? 'লাইভ বাজারদর' :
              category === 'notices' ? 'জরুরি নোটিশ' :
              category === 'jobs' ? 'চাকরি বিজ্ঞপ্তি' : 'বিস্তারিত তালিকা'}
          </h3>
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-indigo-500 font-black uppercase tracking-[0.4em]">
              {isAiLoading ? 'Scanning Socials...' : 
               dataSource === 'live' ? 'Live Cloud Active' : 
               dataSource === 'cache' ? 'Data Cached' : 'Smart Engine Offline'}
            </p>
            {(dataSource === 'live' || isAiLoading) && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>}
          </div>
        </div>
        <button onClick={() => fetchData(true)} className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 text-indigo-600 active:rotate-180 transition-all">
           <RefreshCcw className={`w-5 h-5 ${loading || isAiLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6">
          <Loader2 className="w-16 h-16 animate-spin text-indigo-600 opacity-20" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">পাওয়ারিং আপ স্মার্ট ইঞ্জিন...</p>
        </div>
      ) : (
        <div className="animate-slide-up space-y-1">
          {isAiLoading && (
            <div className="bg-indigo-50 dark:bg-indigo-950/40 p-5 rounded-[2rem] border border-indigo-100/50 dark:border-indigo-900/50 mb-6 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles className="w-3 h-3 animate-bounce" /> Smart Scan in Progress
                </span>
                <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
              </div>
              <div className="w-full h-1 bg-indigo-200 dark:bg-indigo-900 rounded-full overflow-hidden">
                <div className="w-full h-full bg-indigo-600 animate-[shimmer_1.5s_infinite]"></div>
              </div>
            </div>
          )}
          {data.length > 0 ? data.map((item, i) => renderItem(item, i)) : <div className="text-center py-20 text-slate-400 font-bold">কোনো তথ্য পাওয়া যায়নি</div>}
        </div>
      )}

      {selectedTrain && (
        <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-xl flex items-end md:items-center justify-center p-4">
          <div className="bg-slate-50 dark:bg-slate-900 w-full max-w-lg rounded-[3.5rem] overflow-hidden shadow-3xl relative animate-slide-up flex flex-col max-h-[92vh]">
            <button onClick={() => { setSelectedTrain(null); setCurrentStation(null); }} className="absolute top-8 right-8 p-3 bg-white dark:bg-slate-800 rounded-full text-slate-400 z-50 shadow-xl active:scale-90 transition-all hover:text-rose-500"><X className="w-6 h-6" /></button>
            <div className="p-8 pb-36 overflow-y-auto no-scrollbar">
               <div className="flex items-center gap-5 mb-10">
                 <div className="w-16 h-16 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl animate-pulse-slow"><TrainFront className="w-8 h-8" /></div>
                 <div>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">{selectedTrain.name}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                       <span className="text-[9px] font-black uppercase px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm border border-white/20 bg-indigo-600 text-white">
                         <Sparkles className="w-3 h-3 fill-white" /> স্মার্ট লাইভ আপডেট
                       </span>
                    </div>
                 </div>
               </div>
               <div className="bg-white dark:bg-slate-800 rounded-[2.8rem] p-7 border border-slate-100 dark:border-slate-800 shadow-sm mb-10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Globe className="w-20 h-20" /></div>
                  <div className="flex items-center gap-2 mb-5">
                    <Facebook className="w-4 h-4 text-blue-500" />
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">লাইভ নিউজ ফিড</span>
                  </div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line italic">
                    {isInferring ? (
                       <div className="flex flex-col gap-3 py-4">
                         <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden relative">
                            <div className="absolute inset-y-0 left-0 bg-indigo-500 w-1/3 animate-shimmer"></div>
                         </div>
                         <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest animate-pulse">স্ক্যানিং লাইভ ফিড...</p>
                       </div>
                    ) : aiInference.reason}
                  </div>
                  {!isInferring && sources.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-700 space-y-3">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><LinkIcon className="w-3 h-3" /> তথ্যসূত্র:</p>
                       {sources.map((src, i) => (
                         <a key={i} href={src.uri} target="_blank" className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-500 transition-all">
                            <span className="text-xs font-bold text-indigo-600 truncate max-w-[200px]">{src.title}</span>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                         </a>
                       ))}
                    </div>
                  )}
               </div>
               <div className="space-y-6">
                 <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2"><MapPin className="w-4 h-4 text-rose-500" /> Live Station Radar</h4>
                 <div className="relative pl-10 space-y-8 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200 dark:before:bg-slate-700">
                    {selectedTrain.detailedRoute.split(',').map((st, idx) => {
                      const stationName = st.trim();
                      const isCurrent = currentStation && normalize(stationName).includes(normalize(currentStation));
                      return (
                        <div key={idx} className="relative flex items-center gap-5 group/st">
                          <div className={`absolute -left-[30px] w-6 h-6 rounded-full border-[3px] bg-white dark:bg-slate-900 transition-all duration-1000 flex items-center justify-center ${isCurrent ? 'border-indigo-600 scale-150 shadow-[0_0_20px_rgba(79,70,229,0.5)] z-10' : 'border-slate-300 dark:border-slate-600'}`}>
                             {isCurrent && <TrainFront className="w-3 h-3 text-indigo-600 animate-bounce" />}
                          </div>
                          <div className="flex flex-col">
                            <span className={`text-sm font-black transition-all duration-700 ${isCurrent ? 'text-indigo-600 dark:text-indigo-400 scale-110 tracking-tight' : 'text-slate-400 opacity-60'}`}>
                               {stationName}
                            </span>
                            {isCurrent && <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mt-0.5 animate-pulse">Now Crossing</span>}
                          </div>
                        </div>
                      );
                    })}
                 </div>
               </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shadow-2xl backdrop-blur-md">
               <button 
                 disabled={isInferring}
                 onClick={() => runTrainTracking(selectedTrain)}
                 className="w-full py-6 bg-indigo-600 rounded-[2.2rem] flex items-center justify-center gap-4 text-white font-black shadow-[0_15px_40px_rgba(79,70,229,0.3)] active:scale-95 transition-all disabled:opacity-50 group"
               >
                 {isInferring ? <Loader2 className="w-6 h-6 animate-spin" /> : <RefreshCcw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-700" />}
                 {isInferring ? 'রিয়েল-টাইম তথ্য খোঁজা হচ্ছে...' : 'লাইভ লোকেশন আপডেট করুন'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryView;
