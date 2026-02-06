
import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.API_KEY || process.env.VITE_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'API_KEY_MISSING',
      details: 'Vercel ড্যাশবোর্ড থেকে API_KEY পাওয়া যায়নি।' 
    });
  }

  try {
    const { contents, systemInstruction, tools, model } = req.body;
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: model || 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction: systemInstruction || "আপনি রাজবাড়ী জেলার একজন ডিজিটাল রেলওয়ে অ্যাসিস্ট্যান্ট। আপনার কাজ হলো গুগল সার্চ ব্যবহার করে ট্রেনের বর্তমান অবস্থান খুঁজে বের করা। যদি সঠিক অবস্থান না পাওয়া যায়, তবে শিডিউল অনুযায়ী সম্ভাব্য অবস্থান বলুন।",
        tools: tools || [{ googleSearch: {} }],
        temperature: 0.1, // তথ্যের নির্ভুলতা বাড়াতে টেম্পারেচার কমানো হয়েছে
      },
    });

    return res.status(200).json({
      text: response.text,
      groundingMetadata: response.candidates?.[0]?.groundingMetadata || null,
      mode: 'live_v4_deep_search'
    });

  } catch (error) {
    console.error("AI Bridge Error:", error.message);
    return res.status(500).json({ 
      error: 'AI_GATEWAY_ERROR',
      details: error.message
    });
  }
}
