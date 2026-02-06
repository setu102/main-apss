
import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Cloud,
  Zap,
  LogOut,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Globe,
  Sparkles,
  Server,
  AlertTriangle
} from 'lucide-react';
import { db } from '../db';

interface AdminPanelProps {
  onLogout: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [testResult, setTestResult] = useState('');

  const runDiagnostics = async () => {
    setTestStatus('loading');
    setTestResult('');
    try {
      const response = await db.callAI({
        contents: "Hello, system check. Are you online?",
        systemInstruction: "You are a diagnostic tool. Reply with exactly: 'SYSTEM_ONLINE'"
      });
      
      if (response.mode === 'local_fallback' || !response.text) {
        throw new Error("Local fallback triggered. Check API key.");
      }
      
      setTestStatus('success');
      setTestResult(`জেমিনি এআই সফলভাবে সংযুক্ত হয়েছে! রেসপন্স মোড: ${response.mode}`);
    } catch (e: any) {
      console.error("Diagnostic Error:", e);
      setTestStatus('error');
      setTestResult(e.message === 'API_KEY_MISSING' 
        ? "API Key পাওয়া যায়নি। অনুগ্রহ করে এনভায়রনমেন্ট ভেরিয়েবল (API_KEY) চেক করুন।" 
        : `সংযোগে ত্রুটি: ${e.message || "Unknown error"}. এটি নেটওয়ার্ক বা কোটা সমস্যা হতে পারে।`);
    }
  };

  return (
    <div className="p-6 animate-slide-up pb-32 max-w-lg mx-auto">
      <div className="mb-8 p-8 bg-gradient-to-br from-slate-900 to-indigo-900 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <Activity className="w-24 h-24 animate-pulse" />
        </div>
        <div className="relative z-10 flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/20">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">সিস্টেম কন্ট্রোল</h2>
              <p className="text-indigo-200 text-[10px] font-bold opacity-80 uppercase tracking-[0.3em]">Smart Engine Dashboard</p>
            </div>
          </div>
          <button onClick={onLogout} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/20 transition-all text-white"><LogOut className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 premium-shadow mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg"><Server className="w-6 h-6" /></div>
          <div>
            <h4 className="text-xl font-black dark:text-white tracking-tighter uppercase">সার্ভার স্ট্যাটাস</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Gemini API Diagnostic</p>
          </div>
        </div>

        <button 
          onClick={runDiagnostics}
          disabled={testStatus === 'loading'}
          className="w-full flex items-center justify-center gap-3 py-5 bg-indigo-600 text-white rounded-[1.8rem] font-black shadow-xl hover:bg-indigo-700 active:scale-95 transition-all mb-6 disabled:opacity-50"
        >
          {testStatus === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
          {testStatus === 'loading' ? 'কানেকশন টেস্ট হচ্ছে...' : 'জেমিনি কানেকশন টেস্ট করুন'}
        </button>

        {testStatus !== 'idle' && (
          <div className={`p-6 rounded-[2rem] border flex items-start gap-4 animate-slide-up ${
            testStatus === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/50' : 
            testStatus === 'error' ? 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/50' : 'bg-slate-50 border-slate-100 text-slate-600 dark:bg-slate-800/50 dark:border-slate-800'
          }`}>
            {testStatus === 'success' ? <CheckCircle2 className="w-6 h-6 shrink-0 mt-1" /> : <AlertTriangle className="w-6 h-6 shrink-0 mt-1" />}
            <div>
              <p className="font-black text-sm uppercase tracking-widest mb-1">{testStatus === 'success' ? 'জেমিনি অনলাইন' : 'জেমিনি অফলাইন'}</p>
              <p className="text-xs font-medium leading-relaxed opacity-90">{testResult}</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/20 p-6 rounded-[2.5rem] border border-amber-100 dark:border-amber-900/50 flex items-start gap-4">
          <Globe className="w-8 h-8 text-amber-500 shrink-0" />
          <div className="space-y-2">
            <p className="text-[10px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-widest">গুরুত্বপূর্ণ টিপস</p>
            <p className="text-xs font-bold text-amber-700 dark:text-amber-500 leading-relaxed">
              যদি আপনার API Key সেট করা থাকে কিন্তু তবুও "অফলাইন" দেখায়, তবে নিশ্চিত হোন যে আপনার এপিআই কী-তে পর্যাপ্ত কোটা আছে এবং এটি `gemini-3-flash-preview` মডেল সাপোর্ট করে।
            </p>
          </div>
      </div>
    </div>
  );
};

export default AdminPanel;
