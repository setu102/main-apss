import React, { useState, useEffect } from 'react';
import {
  Phone,
  Loader2,
  TrainFront,
  X,
  Sparkles,
  Info,
  RefreshCcw,
  Clock,
  Navigation2,
  Cpu,
  Facebook,
  ShoppingBasket,
  Megaphone,
  Briefcase,
  TrendingUp,
  TrendingDown,
  Building2,
  UserRoundSearch,
  Landmark,
  School,
  Crown,
} from 'lucide-react';

import { Category, Train, AIInference } from '../types';
import { db } from '../db';

interface CategoryViewProps {
  category: Category;
  onBack?: () => void;
}

type GenericItem = Record<string, any>;

const CategoryView: React.FC<CategoryViewProps> = ({ category }) => {
  const [data, setData] = useState<GenericItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrain, setSelectedTrain] = useState<Train | null>(null);
  const [isInferring, setIsInferring] = useState(false);
  const [currentStation, setCurrentStation] = useState<string | null>(null);
  const [inferenceMode, setInferenceMode] = useState<'gemini' | 'puter'>('gemini');

  const [aiInference, setAiInference] = useState<
    AIInference & { reason: string }
  >({
    delayMinutes: 0,
    confidence: 0,
    reason: '',
    isAI: true,
  });

  /* ---------------- Fetch Data ---------------- */

  const fetchData = async () => {
    setLoading(true);
    try {
      const items = await db.getCategory(category);
      setData(items ?? []);
    } catch (err) {
      console.error('Fetch error:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [category]);

  /* ---------------- Train Tracking ---------------- */

  const generateFallbackReason = (train: Train) => {
    return `সিস্টেম নোট: লাইভ ডাটা পাওয়া যায়নি।
লোকাল ডাটাবেস অনুযায়ী ${train.name} রাজবাড়ী থেকে কালুখালী হয়ে গন্তব্যে যাচ্ছে।
সর্বশেষ শিডিউল যাচাই করুন।`;
  };

  const runTrainTracking = async (train: Train) => {
    if (isInferring) return;

    setIsInferring(true);
    setCurrentStation(null);
    setInferenceMode('gemini');
    setAiInference({
      delayMinutes: 0,
      confidence: 0,
      reason: 'লাইভ ডাটা স্ক্যান করা হচ্ছে...',
      isAI: true,
    });

    try {
      const response = await db.callAI({
        contents: `২০২৬ সালে ${train.name} ট্রেনটি এখন কোন স্টেশনে আছে?`,
        systemInstruction:
          'আপনি একজন রেলওয়ে ট্র্যাকিং অ্যাসিস্ট্যান্ট। সংক্ষেপে উত্তর দিন।',
        useSearch: true,
      });

      if (!response?.text) throw new Error('Empty AI response');

      setInferenceMode('gemini');
      setAiInference({
        delayMinutes: 0,
        confidence: 1,
        reason: response.text,
        isAI: true,
      });

      const stations = train.detailedRoute
        .split(',')
        .map((s) => s.trim().toLowerCase());

      const match = stations.find((s) =>
        response.text.toLowerCase().includes(s),
      );

      if (match) setCurrentStation(match);
    } catch (err) {
      console.warn('Fallback used:', err);
      setInferenceMode('puter');
      setAiInference({
        delayMinutes: 0,
        confidence: 0.5,
        reason: generateFallbackReason(train),
        isAI: true,
      });
    } finally {
      setIsInferring(false);
    }
  };

  /* ---------------- Render Helpers ---------------- */

  const formatText = (text: string) =>
    text.split('**').map((part, i) =>
      i % 2 ? (
        <strong key={i} className="font-black text-slate-900 dark:text-white">
          {part}
        </strong>
      ) : (
        part
      ),
    );

  /* ---------------- Item Renderer ---------------- */

  const renderItem = (item: GenericItem) => {
    switch (category) {
      case 'trains':
        return (
          <div
            key={item.id}
            onClick={() => {
              setSelectedTrain(item);
              runTrainTracking(item);
            }}
            className="bg-white dark:bg-slate-900 p-6 rounded-[2.8rem] mb-4 cursor-pointer active:scale-95 transition-all"
          >
            <div className="flex justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
                  <TrainFront className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold">{item.name}</h4>
                  <p className="text-xs text-slate-400">{item.route}</p>
                </div>
              </div>
              <p className="font-black">{item.departure}</p>
            </div>
          </div>
        );

      case 'market_price':
        return (
          <div key={item.id} className="p-5 bg-white rounded-[2.2rem] mb-3">
            <div className="flex justify-between items-center">
              <div className="flex gap-3">
                <ShoppingBasket className="text-lime-600" />
                <div>
                  <h4 className="font-bold text-sm">{item.name}</h4>
                  <p className="text-xs text-indigo-600">{item.priceRange}</p>
                </div>
              </div>
              {item.trend === 'up' ? (
                <TrendingUp className="text-rose-500" />
              ) : item.trend === 'down' ? (
                <TrendingDown className="text-emerald-500" />
              ) : (
                <Clock className="text-slate-400" />
              )}
            </div>
          </div>
        );

      case 'notices':
        return (
          <div key={item.id} className="p-6 bg-white rounded-[2.5rem] mb-4">
            <h4 className="font-black">{item.title}</h4>
            <p className="text-xs text-slate-500">{item.summary}</p>
          </div>
        );

      case 'jobs':
        return (
          <div key={item.id} className="p-6 bg-white rounded-[2.5rem] mb-4">
            <h4 className="font-black">{item.title}</h4>
            <p className="text-xs text-slate-400">{item.org}</p>
          </div>
        );

      default:
        return (
          <div key={item.id} className="p-5 bg-white rounded-[2.2rem] mb-3">
            <h4 className="font-bold">{item.name || item.title}</h4>
          </div>
        );
    }
  };

  /* ---------------- Render ---------------- */

  return (
    <div className="px-6 py-6 pb-40 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xl font-black uppercase">{category}</h3>
        <button onClick={fetchData}>
          <RefreshCcw className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        data.map(renderItem)
      )}
    </div>
  );
};

export default CategoryView;
