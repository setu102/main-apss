
import { RAJBARI_DATA } from './constants.tsx';

export const db = {
  extractJSON: (text: string | undefined) => {
    if (!text) return null;
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      return null;
    } catch (e) { 
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
      const now = new Date();
      const timeStr = now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', hour12: true });
      const dateStr = now.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });

      const baseInstruction = `
        আজ ${dateStr}, সময় ${timeStr}। আপনি রাজবাড়ী স্মার্ট পোর্টালের সহকারী।
        আপনার কাজ রাজবাড়ী জেলা সম্পর্কে নিখুঁত তথ্য দেওয়া।
        ১) ভাষা: বাংলা। ২) তথ্যসূত্র: গুগল সার্চ ও ফেসবুক লাইভ আপডেট। 
        ৩) সতর্কতা: "Gemini", "AI", বা "জেমিনি" নাম কখনো বলবেন না। ৪) ট্রেন ট্র্যাকিং: সঠিক লোকেশন না পেলে "সম্ভাব্য" বলবেন।
        ${params.systemInstruction || ""}
      `;

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

      if (!response.ok) throw new Error("API_DOWN");

      const data = await response.json();
      
      return {
        text: data.text,
        mode: 'smart_engine_online',
        sources: data.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
          title: chunk.web?.title || "তথ্যসূত্র",
          uri: chunk.web?.uri || "#"
        })).filter((s: any) => s.uri !== "#") || []
      };

    } catch (error: any) {
      return {
        text: null,
        mode: 'local_engine',
        error: error.message
      };
    }
  },

  getCategory: async (category: string) => {
    return (RAJBARI_DATA as any)[category] || [];
  }
};
