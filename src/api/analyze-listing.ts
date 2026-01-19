// Vercel Serverless Function
export const config = {
    maxDuration: 60,
};

const GEMINI_API_KEY = "AIzaSyCBmKMylhAdzl3X5otJrAb1XZn3f8EweDs";

// Helper to always return JSON
function jsonResponse(data: any, status: number = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

export default async function handler(request: Request) {
    // Wrap everything in try-catch to prevent Vercel error pages
    try {
        if (request.method !== 'POST') {
            return jsonResponse({ error: 'Method not allowed' }, 405);
        }

        let body;
        try {
            body = await request.json();
        } catch {
            return jsonResponse({ error: 'Geçersiz JSON body' }, 400);
        }

        const { url, text } = body;
        let contentToAnalyze = text || "";

        // URL Fetching
        if (url && !text) {
            try {
                let targetUrl = url;
                if (!/^https?:\/\//i.test(targetUrl)) {
                    targetUrl = 'https://' + targetUrl;
                }
                new URL(targetUrl);

                const response = await fetch(targetUrl, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                    }
                });

                if (!response.ok) {
                    return jsonResponse({ error: `Link açılamadı: ${response.status}` }, 400);
                }

                const html = await response.text();
                contentToAnalyze = html
                    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gm, "")
                    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gm, "")
                    .replace(/<[^>]+>/g, " ")
                    .slice(0, 15000);
            } catch (err: any) {
                return jsonResponse({ error: `Link hatası: ${err.message}` }, 400);
            }
        }

        if (!contentToAnalyze || contentToAnalyze.trim().length < 5) {
            return jsonResponse({ error: 'Analiz edilecek yeterli içerik yok.' }, 400);
        }

        // Gemini API
        const prompt = `Sen emlak asistanısın. Aşağıdaki metinden JSON çıkar. Sadece JSON döndür:
{
  "title": "Başlık",
  "description": "Açıklama",
  "price": 0,
  "currency": "TL",
  "location": "Konum",
  "rooms": "Oda",
  "bathrooms": 1,
  "area": 0,
  "type": "Satılık",
  "propertyType": "Daire"
}

Metin:
${contentToAnalyze.slice(0, 10000)}`;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

        let aiResponse;
        try {
            aiResponse = await fetch(geminiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });
        } catch (fetchErr: any) {
            return jsonResponse({ error: `AI bağlantı hatası: ${fetchErr.message}` }, 500);
        }

        if (!aiResponse.ok) {
            const errBody = await aiResponse.text().catch(() => "");
            return jsonResponse({ error: `AI API hatası: ${aiResponse.status}` }, 500);
        }

        let aiData;
        try {
            aiData = await aiResponse.json();
        } catch {
            return jsonResponse({ error: 'AI yanıtı okunamadı' }, 500);
        }

        const rawText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) {
            return jsonResponse({ error: 'AI boş cevap verdi' }, 500);
        }

        // Parse JSON from response
        let jsonStr = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        const start = jsonStr.indexOf('{');
        const end = jsonStr.lastIndexOf('}');

        if (start === -1 || end === -1) {
            return jsonResponse({ error: 'AI geçerli JSON döndürmedi' }, 500);
        }

        jsonStr = jsonStr.substring(start, end + 1);

        let data;
        try {
            data = JSON.parse(jsonStr);
        } catch {
            return jsonResponse({ error: 'JSON parse hatası' }, 500);
        }

        return jsonResponse(data, 200);

    } catch (globalError: any) {
        // Last resort error handler
        return jsonResponse({ error: `Beklenmeyen hata: ${globalError.message || 'Bilinmeyen'}` }, 500);
    }
}
