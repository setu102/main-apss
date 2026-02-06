
import { RAJBARI_DATA } from './constants.tsx';

export const db = {
  extractJSON: (text: string | undefined) => {
    if (!text) return null;
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      return null;
    } catch (e) { 
      console.error("JSON Parse Error:", e);
      return null; 
    }
  },

  callAI: async (params: { 
    contents: any; 
    systemInstruction?: string;
    useSearch?: boolean;
    category?: string;
  }) => {
    try {
      // Vercel-এ হোস্ট করার পর ব্রাউজারে এপিআই কী কাজ করে না। 
      // তাই আমরা আমাদের তৈরি করা /api/ai এন্ডপয়েন্টটি কল করবো।
      
      const now = new Date();
      const timeStr = now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', hour12: true });
      const dateStr = now.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });

      const baseInstruction = `
        আজ ${dateStr}, এখন সময় ${timeStr}।
        লোকেশন: রাজবাড়ী জেলা, বাংলাদেশ।
        আপনি একটি জেলা-ভিত্তিক তথ্য সহকারী (District Smart Assistant)।
        আপনার কাজ হলো রাজবাড়ী লাইভ সার্ভারের হয়ে নির্ভুল ও দায়িত্বশীলভাবে তথ্য দেওয়া।
        
        ১) ট্রেন লাইভ ট্র্যাকিং: যদি নিশ্চিত লাইভ তথ্য না পাওয়া যায়, তবে "সম্ভাবনা" বা "সময়ের উপর ভিত্তি করে" শব্দ ব্যবহার করবেন। অফিসিয়াল দাবি করবেন না।
        ২) বাজারদর: category = market_price হলে শুধু JSON দেবেন।
        ৩) জরুরি নোটিশ: category = notices হলে শুধু JSON দেবেন।
        ৪) চাকরি বিজ্ঞপ্তি: category = jobs হলে শুধু JSON দেবেন।
        ৫) ভাষা সবসময় সহজ ও বাংলা হবে।
        ${params.systemInstruction || ""}
      `;

      // API Bridge Call
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: typeof params.contents === 'string' 
            ? [{ role: 'user', parts: [{ text: params.contents }] }] 
            : params.contents,
          systemInstruction: baseInstruction,
          tools: params.useSearch ? [{ googleSearch: {} }] : undefined
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.details || "API_BRIDGE_FAILED");
      }

      const data = await response.json();

      return {
        text: data.text,
        mode: 'live_server_v2', // Rebranded
        sources: data.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
          title: chunk.web?.title || "সূত্র",
          uri: chunk.web?.uri || "#"
        })).filter((s: any) => s.uri !== "#") || []
      };

    } catch (error: any) {
      console.error("Engine Bridge Error:", error.message);
      return {
        text: null,
        mode: 'offline_fallback',
        error: error.message
      };
    }
  },

  getCategory: async (category: string) => {
    return (RAJBARI_DATA as any)[category] || [];
  }
};
