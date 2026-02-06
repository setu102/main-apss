
import React from 'react';
import { Cloud, Github, Zap, ShieldCheck, Globe, CheckCircle, Key } from 'lucide-react';

const DevGuide: React.FC = () => {
  return (
    <div className="space-y-8 pb-10">
      <div className="text-center mb-8">
        <div className="inline-block p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-3xl mb-4">
           <Globe className="w-10 h-10 text-indigo-600" />
        </div>
        <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase">স্মার্ট হোস্টিং গাইড</h3>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Live Google Search Active</p>
      </div>

      <div className="space-y-6">
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 premium-shadow">
          <div className="flex items-center gap-3 mb-4 text-indigo-600">
            <Key className="w-6 h-6" />
            <h4 className="font-black uppercase tracking-tight text-slate-900 dark:text-white">API Key সেটআপ</h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed mb-4">
            রিয়েল-টাইম ট্রেন ট্র্যাকিং এবং ওয়েব সার্চ সচল করতে আপনার একটি Gemini API Key লাগবে। এটি একদম ফ্রি (Free Tier)।
          </p>
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">কোথায় পাবেন?</p>
            <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-xs font-bold text-indigo-600 flex items-center gap-2">
              Google AI Studio <CheckCircle className="w-3 h-3" />
            </a>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 premium-shadow">
          <div className="flex items-center gap-3 mb-6 text-slate-900 dark:text-white">
            <Cloud className="w-6 h-6 text-blue-500" />
            <h4 className="font-black uppercase tracking-tight">Vercel এ হোস্টিং</h4>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            ১. প্রোজেক্টটি Vercel এ ইম্পোর্ট করুন।<br/>
            ২. Environment Variables সেকশনে যান।<br/>
            ৩. <code className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-rose-500">API_KEY</code> নামে একটি ভেরিয়েবল তৈরি করুন এবং আপনার কী-টি সেখানে দিন।
          </p>
        </section>

        <section className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-6 h-6" />
            <h4 className="font-black uppercase tracking-tight">সিকিউরিটি নোট</h4>
          </div>
          <p className="text-xs opacity-90 leading-relaxed font-medium">
            আপনার এপিআই কী-টি সরাসরি কোডে লিখবেন না। এটি সবসময় Environment Variable হিসেবে ব্যবহার করবেন যাতে আপনার কী চুরি না হয়।
          </p>
        </section>
      </div>
    </div>
  );
};

export default DevGuide;
