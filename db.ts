
import { GoogleGenAI } from "@google/genai";
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
  getAIErrorMessage: (error?: string) => {
    if (!error) return "কারণ শনাক্ত করা যায়নি।";
    if (error === "API_KEY_MISSING") return "API key সেট করা নেই।";
    if (error === "TIMEOUT") return "সার্চ রিকোয়েস্ট টাইমআউট হয়েছে।";
    if (error === "EMPTY_RESPONSE") return "এআই থেকে খালি রেসপন্স এসেছে।";
    if (error === "AI_GATEWAY_ERROR") return "সার্ভারলেস এআই গেটওয়ে ত্রুটি হয়েছে।";
    return "সার্ভার ত্রুটি বা কোটা সীমা থাকতে পারে।";
  },
  callServerAI: async (params: {
    contents: any;
    systemInstruction?: string;
    useSearch?: boolean;
  }) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: params.contents,
          systemInstruction: params.systemInstruction,
          tools: params.useSearch ? [{ googleSearch: {} }] : undefined,
          model: 'gemini-3-flash-preview'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.error || 'AI_GATEWAY_ERROR');
      }

      const data = await response.json();
      if (!data?.text) {
        throw new Error("EMPTY_RESPONSE");
      }

      return {
        text: data.text,
        mode: 'serverless_live',
        groundingMetadata: data.groundingMetadata
      };
    } catch (error: any) {
      return {
        text: null,
        mode: 'local_fallback',
        error: error.name === 'AbortError' ? 'TIMEOUT' : error.message
      };
    }
  },

  callAI: async (params: { 
    contents: any; 
    systemInstruction?: string;
    useSearch?: boolean;
  }) => {
    try {
      const apiKey = import.meta.env.VITE_API_KEY || process.env.API_KEY;
      if (!apiKey || apiKey === "undefined" || apiKey === "") {
        throw new Error("API_KEY_MISSING");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      // Formalize contents for Gemini SDK
      let formattedContents: any[];
      if (typeof params.contents === 'string') {
        formattedContents = [{ role: 'user', parts: [{ text: params.contents }] }];
      } else if (Array.isArray(params.contents)) {
        formattedContents = params.contents.map((msg: any) => ({
          role: msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.text || "" }]
        }));
      } else {
        formattedContents = [params.contents];
      }

      const enhancedSystemInstruction = params.systemInstruction || `
        আপনি হলেন "Puter AI", রাজবাড়ী জেলার প্রধান ডিজিটাল অ্যাসিস্ট্যান্ট।
        আপনার স্রষ্টা ও ডেভেলপার: **SOVRAB ROY** (সৌরভ রায়)।
        বর্তমান সময়: ২০২৬ সাল।
        ১. ট্রেনের লাইভ অবস্থানের জন্য আপনি গুগল সার্চ ব্যবহার করে ফেসবুকের "Rajbari Train Tracking Group" এবং নিউজ পোর্টালের ২০২৬ সালের লেটেস্ট পোস্টগুলো বিশ্লেষণ করেন।
        ২. সবসময় ২০২৬ সালের প্রেক্ষাপটে উত্তর দেবেন।
        ৩. ভাষা: শুদ্ধ বাংলা।
      `;

      // Use Flash model for broader availability across deployments
      const modelName = params.useSearch ? 'gemini-3-flash-preview' : 'gemini-3-flash-preview';

      const responsePromise = ai.models.generateContent({
        model: modelName,
        contents: formattedContents,
        config: {
          systemInstruction: enhancedSystemInstruction,
          tools: params.useSearch ? [{ googleSearch: {} }] : undefined,
          temperature: 0.2,
        },
      });

      // Increased timeout for search tasks (up to 45 seconds)
      const timeoutLimit = params.useSearch ? 45000 : 25000;
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("TIMEOUT")), timeoutLimit)
      );

      const response: any = await Promise.race([responsePromise, timeoutPromise]);

      if (!response || !response.text) {
        throw new Error("EMPTY_RESPONSE");
      }

      return {
        text: response.text,
        mode: params.useSearch ? 'gemini_cloud_live' : 'puter_cloud_ai',
        groundingMetadata: response.candidates?.[0]?.groundingMetadata
      };
    } catch (error: any) {
      console.error("AI Cloud Error Details:", error);
      // Detailed error for debugging in console
      return {
        text: null,
        mode: 'local_fallback',
        error: error.message
      };
    }
  },

  getCategory: async (category: string) => {
    return (RAJBARI_DATA as any)[category] || [];
  }
};
