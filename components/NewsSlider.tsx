
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Newspaper, ExternalLink, Loader2, Sparkles, Zap, Search, Facebook } from 'lucide-react';
import { db } from '../db';

interface NewsItem {
  title: string;
  source: string;
  time: string;
  link?: string;
}

const NewsSlider: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const fetchNews = async () => {
    setLoading(true);
    setErrorNotice(null);
    try {
      // Prompt targeting 2026 and Facebook/Social media
      const response = await db.callAI({
        contents: "বর্তমানে ২০২৬ সাল। রাজবাড়ী জেলার বিভিন্ন ফেসবুক গ্রুপ ও নিউজ পেজ থেকে আজকের সর্বশেষ ৫টি গুরুত্বপূর্ণ খবরের হেডলাইন বের করুন। ফিল্ড: title, source, time। পুরনো ২০২৪-এর কোনো তথ্য দেবেন না।",
        systemInstruction: "আপনি একজন ২০২৬ সালের সোশ্যাল মিডিয়া রিপোর্টার। ফেসবুক পোস্ট ও গুগল সার্চ ব্যবহার করে রাজবাড়ীর লাইভ আপডেট দিন। কেবল JSON ফরম্যাটে উত্তর দিন।",
        useSearch: true
      });

      if (response.mode === 'local_fallback' || !response.text) {
        setErrorNotice(`সিস্টেম নোট: ${db.getAIErrorMessage(response.error)}`);
        throw new Error("AI_FALLBACK");
      }

      const parsed = db.extractJSON(response.text);
      if (parsed && Array.isArray(parsed)) {
        setNews(parsed);
      } else {
        throw new Error("Invalid format");
      }
    } catch (e) {
      if (!errorNotice) {
        setErrorNotice("সিস্টেম নোট: লাইভ সোশ্যাল ডাটা পাওয়া যায়নি। লোকাল আপডেট দেখানো হচ্ছে।");
      }
      setNews([
        { title: "২০২৬ রাজবাড়ী স্মার্ট সিটি প্রজেক্টের লাইভ আপডেট", source: "Facebook Feed", time: "১০ মিনিট আগে" },
        { title: "পদ্মা সেতু দিয়ে রাজবাড়ী টু ঢাকা ট্রেন চলাচলের নতুন শিডিউল", source: "Rail Group", time: "১ ঘণ্টা আগে" },
        { title: "রাজবাড়ী রেলওয়ে স্টেশনে নতুন ডিজিটাল ডিসপ্লে স্থাপন", source: "District News", time: "২ ঘণ্টা আগে" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  useEffect(() => {
    if (news.length > 0) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % news.length);
      }, 7000);
      return () => clearInterval(timer);
    }
  }, [news]);

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % news.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev === 0 ? news.length - 1 : prev - 1));

  if (loading) {
    return (
      <div className="mx-6 mb-8 bg-white dark:bg-slate-900 rounded-[2rem] p-6 h-32 flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">২০২৬ সোশ্যাল মিডিয়া আপডেট লোড হচ্ছে...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-6 mb-8 relative group">
      <div className="overflow-hidden bg-gradient-to-br from-indigo-700 to-indigo-900 dark:from-slate-900 dark:to-indigo-950 rounded-[2.5rem] p-7 md:p-8 shadow-2xl border border-white/10 relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-400/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-white/20 backdrop-blur-md p-2 rounded-lg text-white">
            <Facebook className="w-4 h-4" />
          </div>
          <span className="text-[9px] font-black text-indigo-100 uppercase tracking-[0.3em]">Social Live 2026</span>
          <div className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-400/30">
            <Sparkles className="w-2.5 h-2.5" />
            <span className="text-[8px] font-black uppercase tracking-widest">Gemini AI (Cloud Live)</span>
          </div>
        </div>

        <div className="min-h-[90px] flex flex-col justify-center">
          {errorNotice && (
            <p className="text-[11px] font-semibold text-amber-200 bg-amber-500/10 border border-amber-400/30 rounded-xl px-3 py-2 mb-3">
              {errorNotice}
            </p>
          )}
          <h3 className="text-lg md:text-xl font-black text-white leading-tight mb-4 animate-slide-up transition-all duration-500">
            {news[currentIndex]?.title}
          </h3>
          
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-bold text-indigo-200 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                {news[currentIndex]?.source}
              </span>
              <span className="text-[9px] font-bold text-indigo-300">
                {news[currentIndex]?.time}
              </span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 right-8 flex gap-2">
          <button onClick={prevSlide} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all backdrop-blur-md active:scale-90 border border-white/10">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={nextSlide} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all backdrop-blur-md active:scale-90 border border-white/10">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewsSlider;
