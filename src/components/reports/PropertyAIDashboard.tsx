import React, { useState, useCallback } from 'react';
import {
  X, Sparkles, Loader2, Phone, Eye, MessageSquare, TrendingUp,
  CheckCircle2, XCircle, Clock, Target,
  BarChart3, AlertCircle, ChevronRight, ThumbsUp, ThumbsDown,
  RefreshCw, Calendar, Activity, Zap
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { config } from '../../services/config';
import { Activity as ActivityType, Property } from '../../types';

// ─────────────────────────── Types ────────────────────────────
interface CustomerSentiment {
  customerName: string;
  activityType: string;
  date: string;
  sentiment: 'Olumlu' | 'Olumsuz' | 'Düşünüyor';
  note: string;
  aiComment: string;
}

interface AIPortfolioReport {
  overallScore: number;                  // 0-100
  marketPosition: string;               // "Güçlü" | "Orta" | "Zayıf"
  executiveSummary: string;
  activityAnalysis: string;
  customerSentiments: CustomerSentiment[];
  hotLeads: string[];                    // En sıcak müşteri isimleri
  redFlags: string[];                    // Dikkat edilmesi gerekenler
  recommendations: string[];
  pricingInsight: string;
  nextSteps: string[];
  motivationalNote: string;
  generatedAt: string;
}

interface PropertyAIDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  activities: ActivityType[];
}

// ─────────────────────────── Gemini Call ────────────────────────────
async function generateAIPortfolioReport(
  property: Property,
  activities: ActivityType[]
): Promise<AIPortfolioReport> {
  const apiKey = config.geminiApiKey;
  if (!apiKey) throw new Error('Gemini API anahtarı bulunamadı.');

  const ai = new GoogleGenAI({ apiKey });

  const now = new Date();
  const listingDate = property.listingDate ? new Date(property.listingDate) : now;
  const daysOnMarket = Math.floor((now.getTime() - listingDate.getTime()) / (1000 * 60 * 60 * 24));

  const showings = activities.filter(a => a.type === 'Yer Gösterimi');
  const incomingCalls = activities.filter(a => a.type === 'Gelen Arama');
  const outgoingCalls = activities.filter(a => a.type === 'Giden Arama');
  const positives = activities.filter(a => a.status === 'Olumlu');
  const negatives = activities.filter(a => a.status === 'Olumsuz');
  const thinking = activities.filter(a => a.status === 'Düşünüyor');

  // Müşteri bazlı özet (ilk 8 aktivite)
  const customerSummary = activities.slice(0, 8).map(a => ({
    musteri: a.customerName,
    tur: a.type,
    tarih: a.date,
    durum: a.status,
    not: a.description?.substring(0, 120) || ''
  }));

  const prompt = `Sen uzman bir gayrimenkul danışmanı ve piyasa analistisin. Aşağıdaki portföy verilerini analiz et ve Türkçe, profesyonel bir rapor üret.

## PORTFÖY BİLGİLERİ
- Başlık: ${property.title}
- Tip: ${property.type} | Alan: ${property.area}m² | Oda: ${property.rooms}
- Fiyat: ${property.price?.toLocaleString('tr-TR')} ₺
- Konum: ${property.location || property.city || 'Belirtilmemiş'}
- Yayınlanma Süresi: ${daysOnMarket} gün
- Durum: ${property.listingStatus || 'Aktif'}

## AKTİVİTE İSTATİSTİKLERİ
- Toplam Aktivite: ${activities.length}
- Yer Gösterimi: ${showings.length}
- Gelen Arama: ${incomingCalls.length}
- Giden Arama: ${outgoingCalls.length}
- Olumlu Yanıt: ${positives.length}
- Olumsuz Yanıt: ${negatives.length}
- Düşünüyor: ${thinking.length}
- Dönüşüm Oranı: ${activities.length > 0 ? ((positives.length / activities.length) * 100).toFixed(1) : 0}%

## MÜŞTERİ GÖRÜŞMELERİ (Son Aktiviteler)
${JSON.stringify(customerSummary, null, 2)}

## GÖREV
Lütfen SADECE şu JSON formatında yanıt ver (başka hiçbir metin ekleme, sadece JSON):
{
  "overallScore": 0-100 arası puan (aktivite yoğunluğu ve olumlu geri bildirim bazlı),
  "marketPosition": "Güçlü" veya "Orta" veya "Zayıf",
  "executiveSummary": "2-3 cümle: Bu portföyün genel durumu, piyasadaki pozisyonu ve satış/kiralama potansiyeli",
  "activityAnalysis": "2-3 cümle: Aktivite kalitesi, müşteri ilgisi trendi ve ne anlama geldiği",
  "customerSentiments": [
    {
      "customerName": "müşteri adı",
      "activityType": "aktivite türü",
      "date": "tarih",
      "sentiment": "Olumlu veya Olumsuz veya Düşünüyor",
      "note": "orijinal not kısa hali",
      "aiComment": "Bu müşteri hakkında 1 cümle AI yorumu (ilgi seviyesi, neden önemli, ne yapılmalı)"
    }
  ],
  "hotLeads": ["en ilgili ve potansiyel olan 1-3 müşteri ismi (yoksa boş liste)"],
  "redFlags": ["dikkat edilmesi gereken 1-3 önemli uyarı (yoksa boş liste)"],
  "recommendations": ["somut öneri 1", "somut öneri 2", "somut öneri 3"],
  "pricingInsight": "Fiyatlama hakkında 1-2 cümle yorum",
  "nextSteps": ["bu hafta yapılması gereken aksiyon 1", "aksiyon 2"],
  "motivationalNote": "Danışmana kısa motivasyonel mesaj"
}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  });

  const text = response.text || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI yanıtı ayrıştırılamadı.');

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    overallScore: parsed.overallScore ?? 50,
    marketPosition: parsed.marketPosition ?? 'Orta',
    executiveSummary: parsed.executiveSummary ?? '',
    activityAnalysis: parsed.activityAnalysis ?? '',
    customerSentiments: Array.isArray(parsed.customerSentiments) ? parsed.customerSentiments : [],
    hotLeads: Array.isArray(parsed.hotLeads) ? parsed.hotLeads : [],
    redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags : [],
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    pricingInsight: parsed.pricingInsight ?? '',
    nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
    motivationalNote: parsed.motivationalNote ?? '',
    generatedAt: new Date().toISOString(),
  };
}

// ─────────────────────────── Helpers ────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor"
          className="text-gray-200 dark:text-slate-700" strokeWidth="8" />
        <circle cx="50" cy="50" r={radius} fill="none" stroke={color}
          strokeWidth="8" strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div className="text-center z-10">
        <div className="text-2xl font-black" style={{ color }}>{score}</div>
        <div className="text-[10px] text-gray-500 dark:text-slate-400 font-medium">/ 100</div>
      </div>
    </div>
  );
}

function SentimentBadge({ sentiment }: { sentiment: string }) {
  if (sentiment === 'Olumlu') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
      <ThumbsUp className="w-3 h-3" /> Olumlu
    </span>
  );
  if (sentiment === 'Olumsuz') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
      <ThumbsDown className="w-3 h-3" /> Olumsuz
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
      <Clock className="w-3 h-3" /> Düşünüyor
    </span>
  );
}

// ─────────────────────────── Main Component ────────────────────────────
const PropertyAIDashboard: React.FC<PropertyAIDashboardProps> = ({
  isOpen, onClose, property, activities
}) => {
  const [report, setReport] = useState<AIPortfolioReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const result = await generateAIPortfolioReport(property, activities);
      setReport(result);
    } catch (e: any) {
      setError(e?.message || 'Analiz oluşturulamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }, [property, activities]);

  if (!isOpen) return null;

  const showings = activities.filter(a => a.type === 'Yer Gösterimi').length;
  const calls = activities.filter(a => a.type === 'Gelen Arama' || a.type === 'Giden Arama').length;
  const positives = activities.filter(a => a.status === 'Olumlu').length;
  const negatives = activities.filter(a => a.status === 'Olumsuz').length;
  const now = new Date();
  const listingDate = property.listingDate ? new Date(property.listingDate) : now;
  const daysOnMarket = Math.floor((now.getTime() - listingDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 md:p-6">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden border border-gray-200 dark:border-slate-700">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">AI Portföy Analizi</h2>
              <p className="text-violet-200 text-xs truncate max-w-xs">{property.title}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* ── Quick Stats Bar ── */}
          <div className="grid grid-cols-4 gap-0 border-b border-gray-100 dark:border-slate-800">
            {[
              { label: 'Piyasada', value: `${daysOnMarket}g`, icon: <Calendar className="w-4 h-4" />, color: 'text-blue-500' },
              { label: 'Gösterim', value: showings, icon: <Eye className="w-4 h-4" />, color: 'text-purple-500' },
              { label: 'Arama', value: calls, icon: <Phone className="w-4 h-4" />, color: 'text-green-500' },
              { label: 'Aktivite', value: activities.length, icon: <Activity className="w-4 h-4" />, color: 'text-orange-500' },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center py-4 px-2 border-r border-gray-100 dark:border-slate-800 last:border-r-0">
                <div className={`${stat.color} mb-1`}>{stat.icon}</div>
                <div className="text-xl font-black text-slate-800 dark:text-white">{stat.value}</div>
                <div className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* ── No Activities Warning ── */}
          {activities.length === 0 && (
            <div className="m-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Bu portföyde henüz aktivite kaydı bulunmuyor. AI analizi için en az bir aktivite eklemeniz önerilir.
              </p>
            </div>
          )}

          {/* ── Generate Button (Initial State) ── */}
          {!report && !loading && (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 rounded-3xl flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">AI Portföy Analizi</h3>
              <p className="text-gray-500 dark:text-slate-400 text-center max-w-md mb-8 text-sm leading-relaxed">
                Gemini AI, bu portföydeki tüm aktiviteleri, müşteri düşüncelerini ve piyasa pozisyonunu analiz ederek
                profesyonel bir rapor hazırlar.
              </p>

              {/* Sentiment preview */}
              {activities.length > 0 && (
                <div className="flex gap-4 mb-8">
                  <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-xl">
                    <ThumbsUp className="w-4 h-4 text-green-600" />
                    <span className="text-green-700 dark:text-green-400 font-semibold">{positives}</span>
                    <span className="text-green-600 text-sm">Olumlu</span>
                  </div>
                  <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-xl">
                    <ThumbsDown className="w-4 h-4 text-red-600" />
                    <span className="text-red-700 dark:text-red-400 font-semibold">{negatives}</span>
                    <span className="text-red-600 text-sm">Olumsuz</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleGenerate}
                className="flex items-center gap-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-8 py-4 rounded-2xl font-semibold text-base transition-all shadow-lg hover:shadow-violet-500/30 hover:scale-105 active:scale-100"
              >
                <Sparkles className="w-5 h-5" />
                AI Analiz Başlat
              </button>
              {error && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* ── Loading State ── */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 px-6">
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-400 to-indigo-400 animate-ping opacity-20" />
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/40 dark:to-indigo-900/40 flex items-center justify-center">
                  <Loader2 className="w-9 h-9 text-violet-600 dark:text-violet-400 animate-spin" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Analiz Yapılıyor...</h3>
              <p className="text-gray-500 dark:text-slate-400 text-sm text-center">
                Gemini AI, {activities.length} aktiviteyi inceliyor ve müşteri görüşlerini değerlendiriyor
              </p>
              <div className="mt-6 flex gap-2">
                {['Aktiviteler tarandı', 'Müşteriler analiz ediliyor', 'Rapor oluşturuluyor'].map((step, i) => (
                  <div key={step} className="flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 px-3 py-1.5 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.3}s` }}>
                    <Zap className="w-3 h-3" />
                    {step}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Report Section ── */}
          {report && !loading && (
            <div className="p-6 space-y-6">

              {/* Overall Score + Market Position */}
              <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 rounded-2xl p-5 border border-violet-100 dark:border-violet-800/50">
                <div className="flex items-start gap-6">
                  <ScoreRing score={report.overallScore} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${report.marketPosition === 'Güçlü'
                          ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                          : report.marketPosition === 'Orta'
                            ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
                            : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                        }`}>
                        {report.marketPosition === 'Güçlü' ? '📈' : report.marketPosition === 'Orta' ? '📊' : '📉'} Piyasa Pozisyonu: {report.marketPosition}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{report.executiveSummary}</p>

                    {report.motivationalNote && (
                      <div className="mt-3 flex items-start gap-2 bg-white/60 dark:bg-slate-800/60 rounded-xl p-3">
                        <Sparkles className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-violet-700 dark:text-violet-300 italic">{report.motivationalNote}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Aktivite Analizi */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="font-semibold text-slate-800 dark:text-white">Aktivite Analizi</h4>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{report.activityAnalysis}</p>
              </div>

              {/* Hot Leads & Red Flags */}
              {(report.hotLeads.length > 0 || report.redFlags.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {report.hotLeads.length > 0 && (
                    <div className="bg-green-50 dark:bg-green-900/10 rounded-2xl p-4 border border-green-100 dark:border-green-900/30">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-white" />
                        </div>
                        <h4 className="font-semibold text-green-800 dark:text-green-300">🔥 Sıcak Lead'ler</h4>
                      </div>
                      <ul className="space-y-2">
                        {report.hotLeads.map((lead, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="font-medium">{lead}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {report.redFlags.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl p-4 border border-red-100 dark:border-red-900/30">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 bg-red-500 rounded-lg flex items-center justify-center">
                          <AlertCircle className="w-4 h-4 text-white" />
                        </div>
                        <h4 className="font-semibold text-red-800 dark:text-red-300">⚠️ Dikkat Noktaları</h4>
                      </div>
                      <ul className="space-y-2">
                        {report.redFlags.map((flag, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400">
                            <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            <span>{flag}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Müşteri Görüşleri */}
              {report.customerSentiments.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2 p-5 border-b border-gray-100 dark:border-slate-700">
                    <div className="w-7 h-7 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h4 className="font-semibold text-slate-800 dark:text-white">Müşteri Görüşleri</h4>
                    <span className="ml-auto text-xs text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                      {report.customerSentiments.length} müşteri
                    </span>
                  </div>
                  <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
                    {report.customerSentiments.map((cs, i) => (
                      <div key={i} className="p-4 hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {cs.customerName?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <div className="font-semibold text-sm text-slate-800 dark:text-white">{cs.customerName}</div>
                              <div className="text-xs text-gray-400 dark:text-slate-500">{cs.activityType} · {cs.date}</div>
                            </div>
                          </div>
                          <SentimentBadge sentiment={cs.sentiment} />
                        </div>
                        {cs.note && (
                          <p className="text-xs text-gray-500 dark:text-slate-400 italic ml-10 mb-2">"{cs.note}"</p>
                        )}
                        {cs.aiComment && (
                          <div className="ml-10 flex items-start gap-1.5 bg-violet-50 dark:bg-violet-900/20 rounded-lg px-3 py-2">
                            <Sparkles className="w-3 h-3 text-violet-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-violet-700 dark:text-violet-300">{cs.aiComment}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fiyat Görüşü */}
              {report.pricingInsight && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h4 className="font-semibold text-slate-800 dark:text-white">Fiyatlama Analizi</h4>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{report.pricingInsight}</p>
                </div>
              )}

              {/* Recommendations */}
              {report.recommendations.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                      <Target className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h4 className="font-semibold text-slate-800 dark:text-white">Öneriler</h4>
                  </div>
                  <ul className="space-y-3">
                    {report.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-[10px] font-bold">{i + 1}</span>
                        </div>
                        <span className="text-sm text-slate-600 dark:text-slate-400">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Next Steps */}
              {report.nextSteps.length > 0 && (
                <div className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-800/50">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="font-semibold text-indigo-800 dark:text-indigo-200">Bu Hafta Yapılacaklar</h4>
                  </div>
                  <ul className="space-y-2.5">
                    {report.nextSteps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3 bg-white/70 dark:bg-slate-800/70 rounded-xl p-3">
                        <CheckCircle2 className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-indigo-800 dark:text-indigo-300">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-gray-400 dark:text-slate-500">
                  Gemini AI ile oluşturuldu · {new Date(report.generatedAt).toLocaleString('tr-TR')}
                </p>
                <button
                  onClick={handleGenerate}
                  className="flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 font-medium transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Yeniden Analiz Et
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyAIDashboard;
