
import { GoogleGenAI } from "@google/genai";
import { RAJBARI_DATA } from './constants.tsx';

export const db = {
  /**
   * AI থেকে আসা টেক্সট থেকে JSON ব্লক খুঁজে বের করে পার্স করা।
   */
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

  /**
   * Gemini AI Call - acting as "Puter AI"
   */
  callAI: async (params: { 
    contents: any; 
    systemInstruction?: string;
    useSearch?: boolean;
  }) => {
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey || apiKey === "undefined") {
        console.warn("API_KEY is missing or undefined.");
        throw new Error("API_KEY_MISSING");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      let formattedContents: any;

      if (typeof params.contents === 'string') {
        formattedContents = params.contents;
      } else if (Array.isArray(params.contents)) {
        formattedContents = params.contents.map((msg: any) => ({
          role: msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.text || "" }]
        }));
      } else {
        formattedContents = params.contents;
      }

      // Enhanced system instruction for 2026 and social media focus
      const enhancedSystemInstruction = params.systemInstruction || `
        আপনি হলেন "Puter AI", রাজবাড়ী জেলার প্রধান ডিজিটাল অ্যাসিস্ট্যান্ট।
        বর্তমান সময়: ২০২৬ সাল।
        আপনার বিশেষত্ব:
        ১. ট্রেনের বর্তমান অবস্থান এবং রাজবাড়ীর খবরের জন্য আপনি গুগল সার্চ ব্যবহার করে ফেসবুকের বিভিন্ন লোকাল ট্রেন গ্রুপ এবং নিউজ পোর্টালের ২০২৬ সালের লেটেস্ট পোস্টগুলো বিশ্লেষণ করেন।
        ২. সবসময় ২০২৬ সালের প্রেক্ষাপটে উত্তর দেবেন। কোনোভাবেই পুরনো বা ২০২৪-এর তথ্য দেবেন না।
        ৩. ট্রেনের ক্ষেত্রে "রাজবাড়ী রেলওয়ে গ্রুপ" বা এই জাতীয় সোর্স থেকে প্রাপ্ত তথ্যকে গুরুত্ব দিন।
        ৪. ভাষা: শুদ্ধ বাংলা।
      `;

      const responsePromise = ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: formattedContents,
        config: {
          systemInstruction: enhancedSystemInstruction,
          tools: params.useSearch ? [{ googleSearch: {} }] : undefined,
          temperature: 0.1, // More factual
        },
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("TIMEOUT")), 25000)
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
      console.error("AI Cloud Error:", error);
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
