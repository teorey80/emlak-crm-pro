import { GoogleGenAI } from "@google/genai";
import { config } from "./config";

// Initialize the client safely
const getClient = () => {
  const apiKey = config.geminiApiKey;
  if (!apiKey) {
    console.error("API_KEY is not defined in environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateRealEstateAdvice = async (prompt: string): Promise<string> => {
  const ai = getClient();
  if (!ai) return "API Key eksik. Lütfen yapılandırmayı kontrol edin.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Sen bir uzman Emlak Asistanısın. Kullanıcıya Türkçe cevap ver.
      Kullanıcının sorduğu soruya profesyonel, yardımsever ve kısa bir şekilde cevap ver.
      Eğer ilan açıklaması isteniyorsa, emlak terminolojisine uygun, cazip bir dil kullan.
      
      Soru: ${prompt}`,
    });

    return response.text || "Bir cevap oluşturulamadı.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Üzgünüm, şu anda asistan servisine ulaşılamıyor.";
  }
};