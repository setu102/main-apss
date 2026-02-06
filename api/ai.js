
import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'CONFIG_ERROR',
      details: 'Vercel Environment Variables-এ API_KEY সেট করা নেই।' 
    });
  }

  try {
    const { contents, systemInstruction, tools } = req.body;
    const ai = new GoogleGenAI({ apiKey });
    
    // Using gemini-3-flash-preview for maximum speed on Vercel
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction: systemInstruction || "আপনি রাজবাড়ী স্মার্ট পোর্টালের একজন সহকারী। তথ্যগুলো বাংলায় দিন।",
        tools: tools || [{ googleSearch: {} }],
        temperature: 0.1,
      },
    });

    // Ensure we return the text and grounding metadata correctly
    return res.status(200).json({
      text: response.text,
      groundingMetadata: response.candidates?.[0]?.groundingMetadata || null,
      mode: 'live_cloud_v3'
    });

  } catch (error) {
    console.error("AI Bridge Error:", error.message);
    return res.status(500).json({ 
      error: 'SERVER_ERROR',
      details: error.message
    });
  }
}
