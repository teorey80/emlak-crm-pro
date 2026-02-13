import { GoogleGenAI } from "@google/genai";
import { config } from "./config";
import { AIPerformanceAnalysis, AIInsightRequest, ActivityTrendData, PerformanceInsight, GoalProgress } from "../types";

// Initialize the Gemini client
const getClient = () => {
  const apiKey = config.geminiApiKey;
  if (!apiKey) {
    console.error("Gemini API_KEY is not defined.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Build the prompt for performance analysis
 */
export function buildPerformancePrompt(data: AIInsightRequest): string {
  return `Sen bir emlak performans danışmanısın. Aşağıdaki verilere göre kısa, net ve motive edici bir analiz yap. Türkçe cevap ver.

VERİLER:
- Bu dönem toplam aktivite: ${data.totalActivities}
- Telefon görüşmeleri: ${data.phoneCalls}
- Yer gösterimleri: ${data.showings}
- Yeni portföyler: ${data.newProperties}
- Yeni müşteriler: ${data.newCustomers}
- Satışlar: ${data.salesClosed}
- Kiralamalar: ${data.rentalsClosed}
- Dönüşüm oranı: ${data.conversionRate.toFixed(1)}%
- Ortalama satış süresi: ${data.avgSalesDays} gün
- Geçen döneme göre aktivite değişimi: ${data.activityChange > 0 ? '+' : ''}${data.activityChange.toFixed(1)}%
- En verimli gün: ${data.topPerformingDay || 'Bilinmiyor'}
- Hedef ilerleme: ${data.goalProgress.toFixed(0)}%

Lütfen SADECE aşağıdaki JSON formatında yanıt ver, başka hiçbir şey yazma:
{
  "summary": "2-3 cümlelik genel değerlendirme",
  "strengths": ["güçlü yön 1", "güçlü yön 2"],
  "improvements": ["geliştirilecek alan 1", "geliştirilecek alan 2"],
  "recommendations": ["öneri 1", "öneri 2", "öneri 3"],
  "motivationalNote": "Kısa motivasyonel mesaj"
}`;
}

/**
 * Parse Gemini response to structured format
 */
function parseGeminiResponse(responseText: string): AIPerformanceAnalysis | null {
  try {
    // Try to extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in response");
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      summary: parsed.summary || "Analiz tamamlandı.",
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      motivationalNote: parsed.motivationalNote || "Başarılar!",
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    return null;
  }
}

/**
 * Generate AI performance analysis
 */
export async function generatePerformanceAnalysis(data: AIInsightRequest): Promise<AIPerformanceAnalysis> {
  const ai = getClient();

  if (!ai) {
    return {
      summary: "API anahtarı eksik. Lütfen yapılandırmayı kontrol edin.",
      strengths: [],
      improvements: [],
      recommendations: [],
      motivationalNote: "",
      generatedAt: new Date().toISOString()
    };
  }

  try {
    const prompt = buildPerformancePrompt(data);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const responseText = response.text || "";
    const parsed = parseGeminiResponse(responseText);

    if (parsed) {
      return parsed;
    }

    // Fallback if parsing fails
    return {
      summary: responseText.substring(0, 200) || "Analiz tamamlanamadı.",
      strengths: [],
      improvements: [],
      recommendations: [],
      motivationalNote: "",
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return {
      summary: "Analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.",
      strengths: [],
      improvements: [],
      recommendations: [],
      motivationalNote: "",
      generatedAt: new Date().toISOString()
    };
  }
}

/**
 * Collect analytics data and prepare for AI analysis
 */
export function prepareAnalyticsData(
  activityTrend: ActivityTrendData[],
  insights: PerformanceInsight[],
  goals: GoalProgress[]
): AIInsightRequest {
  // Calculate totals from activity trend
  const totals = activityTrend.reduce((acc, day) => ({
    totalActivities: acc.totalActivities + (day.total_activities || 0),
    phoneCalls: acc.phoneCalls + (day.phone_calls || 0),
    showings: acc.showings + (day.showings || 0),
    positiveOutcomes: acc.positiveOutcomes + (day.positive_outcomes || 0),
  }), { totalActivities: 0, phoneCalls: 0, showings: 0, positiveOutcomes: 0 });

  // Extract metrics from insights
  const conversionInsight = insights.find(i => i.metric_name === 'conversion_rate');
  const avgDaysInsight = insights.find(i => i.metric_name === 'avg_sale_duration');
  const bestDayInsight = insights.find(i => i.metric_name === 'best_day');
  const activityChangeInsight = insights.find(i => i.metric_name === 'activity_change');

  // Calculate goal progress average
  const activeGoals = goals.filter(g => g.status === 'active');
  const avgGoalProgress = activeGoals.length > 0
    ? activeGoals.reduce((sum, g) => sum + (g.progress_percentage || 0), 0) / activeGoals.length
    : 0;

  return {
    totalActivities: totals.totalActivities,
    phoneCalls: totals.phoneCalls,
    showings: totals.showings,
    newProperties: 0, // Will be filled from other data if available
    newCustomers: 0,  // Will be filled from other data if available
    salesClosed: totals.positiveOutcomes,
    rentalsClosed: 0, // Will be filled from other data if available
    conversionRate: conversionInsight?.metric_value || 0,
    avgSalesDays: avgDaysInsight?.metric_value || 0,
    activityChange: activityChangeInsight?.metric_value || 0,
    topPerformingDay: bestDayInsight?.insight_text || 'Bilinmiyor',
    goalProgress: avgGoalProgress
  };
}
