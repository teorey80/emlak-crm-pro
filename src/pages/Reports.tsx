import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { BarChart3, PieChart, TrendingUp, Wallet, DollarSign, Users, Calendar, ChevronLeft, ChevronRight, User, Home as HomeIcon, Target, Activity, ArrowUpRight, ArrowDownRight, Minus, Loader2, Sparkles, Lightbulb, ThumbsUp, AlertCircle, MessageCircle } from 'lucide-react';
import { Sale, UserProfile, ActivityTrendData, ConversionFunnelData, PerformanceInsight, GoalProgress, AIPerformanceAnalysis } from '../types';
import { generatePerformanceAnalysis, prepareAnalyticsData } from '../services/aiInsightService';
import {
  getActivityTrend,
  getConversionFunnel,
  getPerformanceInsights,
  getGoalProgress,
  getMetricTypeLabel,
  formatMetricValue,
} from '../services/analyticsService';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend
} from 'recharts';

// ==========================================
// BROKER VIEW COMPONENT
// ==========================================
interface BrokerReportViewProps {
  sales: Sale[];
  teamMembers: UserProfile[];
  properties: any[];
  customers: any[];
  activities: any[];
}

const BrokerReportView: React.FC<BrokerReportViewProps> = ({ sales, teamMembers, properties, customers, activities }) => {
  const [viewMode, setViewMode] = useState<'overview' | 'commission' | 'analytics'>('overview');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Parse selected month
  const monthRange = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const monthName = firstDay.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });
    return { firstDay, lastDay, monthName, year, month };
  }, [selectedMonth]);

  // Calculate monthly commission stats
  const commissionStats = useMemo(() => {
    const { firstDay, lastDay } = monthRange;

    const monthlySales = sales?.filter(s => {
      const saleDate = new Date(s.saleDate || s.sale_date || '');
      return saleDate >= firstDay && saleDate <= lastDay;
    }) || [];

    const totalCommission = monthlySales.reduce((sum, s) => sum + (s.commissionAmount || s.commission_amount || 0), 0);
    const totalOfficeShare = monthlySales.reduce((sum, s) => sum + (s.officeShareAmount || s.office_share_amount || 0), 0);
    const totalConsultantShare = monthlySales.reduce((sum, s) => sum + (s.consultantShareAmount || s.consultant_share_amount || 0), 0);
    const totalExpenses = monthlySales.reduce((sum, s) => sum + (s.totalExpenses || s.total_expenses || 0), 0);
    const totalRevenue = monthlySales.reduce((sum, s) => sum + (s.salePrice || s.sale_price || 0), 0);

    // Per consultant breakdown
    const consultantBreakdown = teamMembers.map(member => {
      const memberSales = monthlySales.filter(s =>
        s.consultantId === member.id || s.consultant_id === member.id || s.user_id === member.id
      );
      const commission = memberSales.reduce((sum, s) => sum + (s.consultantShareAmount || s.consultant_share_amount || 0), 0);
      const revenue = memberSales.reduce((sum, s) => sum + (s.salePrice || s.sale_price || 0), 0);
      const saleCount = memberSales.filter(s => s.transactionType !== 'rental').length;
      const rentalCount = memberSales.filter(s => s.transactionType === 'rental').length;

      return {
        ...member,
        commission,
        saleCount,
        rentalCount,
        revenue
      };
    }).sort((a, b) => b.commission - a.commission);

    const saleTxCount = monthlySales.filter(s => s.transactionType !== 'rental').length;
    const rentalTxCount = monthlySales.filter(s => s.transactionType === 'rental').length;

    return {
      monthlySales,
      totalCommission,
      totalOfficeShare,
      totalConsultantShare,
      totalExpenses,
      totalRevenue,
      saleCount: saleTxCount,
      rentalCount: rentalTxCount,
      totalTx: monthlySales.length,
      consultantBreakdown
    };
  }, [sales, teamMembers, monthRange]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const newDate = new Date(year, month - 1 + (direction === 'next' ? 1 : -1), 1);
    setSelectedMonth(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`);
  };

  // Calculate Stats
  const totalPortfolioValue = properties.reduce((acc, curr) => acc + curr.price, 0);
  const activeCustomers = customers.filter(c => c.status === 'Aktif').length;
  const totalActivities = activities.length;

  // Portfolio Type Distribution
  const typeCounts: Record<string, number> = {};
  properties.forEach(p => {
    typeCounts[p.type] = (typeCounts[p.type] || 0) + 1;
  });
  const totalProps = properties.length || 1;

  // Activity Status Distribution
  const activityCounts: Record<string, number> = {};
  activities.forEach(a => {
    activityCounts[a.status] = (activityCounts[a.status] || 0) + 1;
  });
  const totalActs = activities.length || 1;

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Ofis Performans Raporları (Broker)</h2>

        {/* View Mode Toggle */}
        <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-1 flex">
          <button
            onClick={() => setViewMode('overview')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${viewMode === 'overview'
                ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
          >
            Genel Bakış
          </button>
          <button
            onClick={() => setViewMode('commission')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${viewMode === 'commission'
                ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
          >
            Komisyon Raporu
          </button>
          <button
            onClick={() => setViewMode('analytics')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${viewMode === 'analytics'
                ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
          >
            Analitik
          </button>
        </div>
      </div>

      {/* Commission Report View */}
      {viewMode === 'commission' && (
        <div className="space-y-6">
          {/* Month Selector */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#1193d4]" />
                <span className="text-lg font-bold text-slate-800 dark:text-white capitalize">{monthRange.monthName}</span>
              </div>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
            </div>
          </div>

          {/* Commission Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-5 rounded-xl text-white">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-6 h-6 opacity-80" />
                <span className="text-sm opacity-90">Toplam Komisyon</span>
              </div>
              <p className="text-2xl font-bold">{commissionStats.totalCommission.toLocaleString('tr-TR')} TL</p>
              <p className="text-xs opacity-75 mt-1">{commissionStats.saleCount} satış, {commissionStats.rentalCount} kiralama</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-5 rounded-xl text-white">
              <div className="flex items-center gap-3 mb-2">
                <Wallet className="w-6 h-6 opacity-80" />
                <span className="text-sm opacity-90">Ofis Payı</span>
              </div>
              <p className="text-2xl font-bold">{commissionStats.totalOfficeShare.toLocaleString('tr-TR')} TL</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-violet-600 p-5 rounded-xl text-white">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-6 h-6 opacity-80" />
                <span className="text-sm opacity-90">Danışmanlara Ödenen</span>
              </div>
              <p className="text-2xl font-bold">{commissionStats.totalConsultantShare.toLocaleString('tr-TR')} TL</p>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-5 rounded-xl text-white">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-6 h-6 opacity-80" />
                <span className="text-sm opacity-90">Toplam Ciro</span>
              </div>
              <p className="text-2xl font-bold">{(commissionStats.totalRevenue / 1000000).toFixed(1)}M TL</p>
            </div>
          </div>

          {/* Transaction Summary Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">İşlem Özeti</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{commissionStats.saleCount}</div>
                <div className="text-sm text-blue-600/70 dark:text-blue-400/70 font-medium">Satış</div>
              </div>
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{commissionStats.rentalCount}</div>
                <div className="text-sm text-indigo-600/70 dark:text-indigo-400/70 font-medium">Kiralama</div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-slate-700">
                <div className="text-2xl font-bold text-slate-800 dark:text-white">{commissionStats.totalTx}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">Toplam İşlem</div>
              </div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{(commissionStats.totalRevenue / 1000000).toFixed(2)}M</div>
                <div className="text-sm text-emerald-600/70 dark:text-emerald-400/70 font-medium">Toplam Hacim</div>
              </div>
            </div>
          </div>

          {/* Consultant Breakdown */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-slate-800 dark:to-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                Danışman Bazında Komisyon Dağılımı
              </h3>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-slate-700">
              {commissionStats.consultantBreakdown.map((consultant, index) => (
                <div key={consultant.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        index === 1 ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' :
                          index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                            'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                      }`}>
                      {index + 1}
                    </div>
                    <img src={consultant.avatar} alt={consultant.name} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white">{consultant.name}</p>
                      <p className="text-xs text-slate-500">{consultant.saleCount} satış, {consultant.rentalCount} kiralama</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600 dark:text-green-400">{consultant.commission.toLocaleString('tr-TR')} TL</p>
                    <p className="text-xs text-slate-400">Ciro: {(consultant.revenue / 1000000).toFixed(1)}M</p>
                  </div>
                </div>
              ))}
              {commissionStats.consultantBreakdown.length === 0 && (
                <div className="p-8 text-center text-slate-400">
                  Bu ay henüz satış yapılmamış.
                </div>
              )}
            </div>
          </div>

          {/* Recent Sales Table */}
          {commissionStats.monthlySales.length > 0 && (
            <SalesTable sales={commissionStats.monthlySales} isBroker={true} />
          )}
        </div>
      )}

      {/* Overview View */}
      {viewMode === 'overview' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Toplam Portföy Değeri</p>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{(totalPortfolioValue / 1000000).toFixed(1)} Milyon ₺</h3>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Aktif Müşteri Oranı</p>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
                    {Math.round((activeCustomers / customers.length) * 100)}%
                  </h3>
                  <p className="text-xs text-green-600 dark:text-green-400">Toplam {customers.length} müşteriden {activeCustomers} aktif</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Toplam Etkileşim</p>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{totalActivities}</h3>
                  <p className="text-xs text-gray-400 dark:text-slate-500">Bu ay kaydedilen aktiviteler</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Portfolio Distribution Chart */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 transition-colors">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                Portföy Dağılımı
              </h3>
              <div className="space-y-4">
                {Object.keys(typeCounts).map((type) => {
                  const percent = Math.round((typeCounts[type] / totalProps) * 100);
                  return (
                    <div key={type}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 dark:text-slate-300 font-medium">{type}</span>
                        <span className="text-gray-500 dark:text-slate-400">{percent}% ({typeCounts[type]})</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2.5">
                        <div className="bg-[#1193d4] h-2.5 rounded-full" style={{ width: `${percent}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Activity Performance */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 transition-colors">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                Aktivite Sonuçları
              </h3>
              <div className="space-y-4">
                {/* Custom visual bars for activity status */}
                {Object.keys(activityCounts).map((status) => {
                  const count = activityCounts[status];
                  const percent = Math.round((count / totalActs) * 100);
                  let colorClass = 'bg-gray-400 dark:bg-slate-600';
                  if (status === 'Olumlu') colorClass = 'bg-emerald-500';
                  if (status === 'Olumsuz') colorClass = 'bg-red-500';
                  if (status === 'Düşünüyor') colorClass = 'bg-amber-500';
                  if (status === 'Tamamlandı') colorClass = 'bg-blue-500';

                  return (
                    <div key={status} className="flex items-center">
                      <div className="w-24 text-sm font-medium text-gray-600 dark:text-slate-400">{status}</div>
                      <div className="flex-1 bg-gray-100 dark:bg-slate-700 h-8 rounded-lg overflow-hidden relative">
                        <div
                          className={`h-full ${colorClass} transition-all duration-500`}
                          style={{ width: `${percent}%` }}
                        ></div>
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600 dark:text-slate-300 z-10">
                          {count}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Analytics View */}
      {viewMode === 'analytics' && (
        <AnalyticsView />
      )}
    </div>
  );
};

// ==========================================
// ANALYTICS VIEW COMPONENT
// ==========================================
const AnalyticsView: React.FC = () => {
  const { userProfile } = useData();
  const [loading, setLoading] = useState(true);
  const [activityTrend, setActivityTrend] = useState<ActivityTrendData[]>([]);
  const [conversionFunnel, setConversionFunnel] = useState<ConversionFunnelData[]>([]);
  const [insights, setInsights] = useState<PerformanceInsight[]>([]);
  const [goalProgress, setGoalProgress] = useState<GoalProgress[]>([]);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  // AI Analysis State
  const [aiAnalysis, setAiAnalysis] = useState<AIPerformanceAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiExpanded, setAiExpanded] = useState(true);

  // Calculate date range
  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    switch (dateRange) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
    }
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  };

  // Handle AI Analysis
  const handleAIAnalysis = async () => {
    setAiLoading(true);
    setAiError(null);

    try {
      // Prepare analytics data for AI
      const analyticsData = prepareAnalyticsData(activityTrend, insights, goalProgress);

      // Generate AI analysis
      const analysis = await generatePerformanceAnalysis(analyticsData);
      setAiAnalysis(analysis);
      setAiExpanded(true);
    } catch (error) {
      console.error('AI Analysis Error:', error);
      setAiError('Analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setAiLoading(false);
    }
  };

  // Load analytics data
  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const { start, end } = getDateRange();
        const officeId = userProfile?.officeId || undefined;

        const [trendData, funnelData, insightData, goalData] = await Promise.all([
          getActivityTrend(undefined, officeId, start, end, dateRange === '90d' ? 'weekly' : 'daily').catch(() => []),
          getConversionFunnel(undefined, officeId, start, end).catch(() => []),
          getPerformanceInsights(undefined, officeId, start, end).catch(() => []),
          getGoalProgress(undefined, officeId).catch(() => []),
        ]);

        setActivityTrend(trendData);
        setConversionFunnel(funnelData);
        setInsights(insightData);
        setGoalProgress(goalData);
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [dateRange, userProfile?.officeId]);

  // Get insight by name
  const getInsight = (name: string): PerformanceInsight | undefined => {
    return insights.find(i => i.metric_name === name);
  };

  // Funnel colors
  const FUNNEL_COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#6366F1'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#1193d4]" />
        <span className="ml-3 text-slate-600 dark:text-slate-400">Analitik verileri yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex justify-end">
        <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-1 flex">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                dateRange === range
                  ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              {range === '7d' ? '7 Gün' : range === '30d' ? '30 Gün' : '90 Gün'}
            </button>
          ))}
        </div>
      </div>

      {/* AI Performance Analysis Section */}
      <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-slate-800 dark:to-slate-800 border border-violet-200 dark:border-slate-700 rounded-2xl overflow-hidden">
        {/* AI Header */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
              <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white">AI Performans Analizi</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Yapay zeka destekli performans değerlendirmesi ve öneriler
              </p>
            </div>
          </div>
          <button
            onClick={handleAIAnalysis}
            disabled={aiLoading || loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              aiLoading || loading
                ? 'bg-gray-200 dark:bg-slate-700 text-gray-400 cursor-not-allowed'
                : 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-200 dark:shadow-none'
            }`}
          >
            {aiLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analiz Ediliyor...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analiz Yap</span>
              </>
            )}
          </button>
        </div>

        {/* AI Error */}
        {aiError && (
          <div className="mx-4 mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400">{aiError}</p>
          </div>
        )}

        {/* AI Results */}
        {aiAnalysis && (
          <div className="border-t border-violet-200 dark:border-slate-700">
            {/* Toggle Header */}
            <button
              onClick={() => setAiExpanded(!aiExpanded)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-violet-100/50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
                Son analiz: {new Date(aiAnalysis.generatedAt).toLocaleString('tr-TR')}
              </span>
              <ChevronRight className={`w-5 h-5 text-violet-500 transition-transform ${aiExpanded ? 'rotate-90' : ''}`} />
            </button>

            {/* Expanded Content */}
            {aiExpanded && (
              <div className="px-4 pb-4 space-y-4">
                {/* Summary */}
                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                    Özet
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{aiAnalysis.summary}</p>
                </div>

                {/* Strengths & Improvements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Strengths */}
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                    <h4 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4 text-emerald-500" />
                      Güçlü Yönler
                    </h4>
                    {aiAnalysis.strengths.length > 0 ? (
                      <ul className="space-y-2">
                        {aiAnalysis.strengths.map((strength, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-400">Henüz analiz yapılmadı</p>
                    )}
                  </div>

                  {/* Improvements */}
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                    <h4 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-amber-500" />
                      Gelişim Alanları
                    </h4>
                    {aiAnalysis.improvements.length > 0 ? (
                      <ul className="space-y-2">
                        {aiAnalysis.improvements.map((improvement, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-400">Henüz analiz yapılmadı</p>
                    )}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-violet-500" />
                    Öneriler
                  </h4>
                  {aiAnalysis.recommendations.length > 0 ? (
                    <div className="space-y-2">
                      {aiAnalysis.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-violet-200 dark:bg-violet-800 text-violet-700 dark:text-violet-300 text-xs font-bold flex-shrink-0">
                            {i + 1}
                          </span>
                          <p className="text-sm text-slate-700 dark:text-slate-300">{rec}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">Henüz öneri yok</p>
                  )}
                </div>

                {/* Motivational Note */}
                {aiAnalysis.motivationalNote && (
                  <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white">
                    <div className="flex items-start gap-3">
                      <MessageCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-medium leading-relaxed">{aiAnalysis.motivationalNote}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Insight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <InsightCard
          title="Dönüşüm Oranı"
          value={getInsight('conversion_rate')?.metric_value || 0}
          unit="%"
          change={getInsight('conversion_rate')?.change_from_previous}
          icon={<Target className="w-5 h-5" />}
          color="blue"
        />
        <InsightCard
          title="Aktivite/Sonuç"
          value={getInsight('activity_per_result')?.metric_value || 0}
          unit="aktivite"
          icon={<Activity className="w-5 h-5" />}
          color="purple"
        />
        <InsightCard
          title="Ort. Satış Süresi"
          value={getInsight('avg_sale_duration')?.metric_value || 0}
          unit="gün"
          icon={<Calendar className="w-5 h-5" />}
          color="amber"
        />
        <InsightCard
          title="En Verimli Gün"
          value={getInsight('best_day')?.metric_value || 0}
          unit={getInsight('best_day')?.metric_unit || '-'}
          icon={<TrendingUp className="w-5 h-5" />}
          color="emerald"
          isText
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Trend Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Aktivite Trendi
          </h3>
          {activityTrend.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activityTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="period_label"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total_activities"
                    name="Toplam"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="showings"
                    name="Gösterim"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="phone_calls"
                    name="Arama"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-400">
              Bu dönem için aktivite verisi bulunamadı
            </div>
          )}
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-500" />
            Dönüşüm Hunisi
          </h3>
          {conversionFunnel.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={conversionFunnel}
                  layout="vertical"
                  margin={{ left: 20, right: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis
                    type="category"
                    dataKey="stage"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                    formatter={(value: number, name: string, props: any) => [
                      `${value} (${props.payload.percentage}%)`,
                      'Adet',
                    ]}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {conversionFunnel.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-400">
              Bu dönem için huni verisi bulunamadı
            </div>
          )}
        </div>
      </div>

      {/* Goal Progress Section */}
      {goalProgress.length > 0 && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-500" />
            Hedef Takibi
          </h3>
          <div className="space-y-4">
            {goalProgress.map((goal) => (
              <GoalProgressBar key={goal.goal_id} goal={goal} />
            ))}
          </div>
        </div>
      )}

      {/* Period Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-5 rounded-xl text-white">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-6 h-6 opacity-80" />
            <span className="text-sm opacity-90">Dönem Komisyonu</span>
          </div>
          <p className="text-2xl font-bold">
            {(getInsight('period_commission')?.metric_value || 0).toLocaleString('tr-TR')} TL
          </p>
          <ChangeIndicator change={getInsight('period_commission')?.change_from_previous} />
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-5 rounded-xl text-white">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 opacity-80" />
            <span className="text-sm opacity-90">Dönem İşlemleri</span>
          </div>
          <p className="text-2xl font-bold">
            {getInsight('period_transactions')?.metric_value || 0} işlem
          </p>
          <ChangeIndicator change={getInsight('period_transactions')?.change_from_previous} />
        </div>
      </div>
    </div>
  );
};

// ==========================================
// INSIGHT CARD COMPONENT
// ==========================================
interface InsightCardProps {
  title: string;
  value: number;
  unit: string;
  change?: number;
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'amber' | 'emerald';
  isText?: boolean;
}

const InsightCard: React.FC<InsightCardProps> = ({ title, value, unit, change, icon, color, isText }) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          {isText ? (
            <p className="text-xl font-bold text-slate-800 dark:text-white">{unit}</p>
          ) : (
            <p className="text-2xl font-bold text-slate-800 dark:text-white">
              {typeof value === 'number' ? value.toLocaleString('tr-TR') : value}
              <span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>
            </p>
          )}
        </div>
        {change !== undefined && change !== 0 && <ChangeIndicator change={change} small />}
      </div>
    </div>
  );
};

// ==========================================
// CHANGE INDICATOR COMPONENT
// ==========================================
interface ChangeIndicatorProps {
  change?: number;
  small?: boolean;
}

const ChangeIndicator: React.FC<ChangeIndicatorProps> = ({ change, small }) => {
  if (change === undefined || change === 0) return null;

  const isPositive = change > 0;
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
  const colorClass = isPositive
    ? 'text-emerald-400 bg-emerald-400/20'
    : 'text-red-400 bg-red-400/20';

  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium ${colorClass}`}>
      <Icon className={small ? 'w-3 h-3' : 'w-4 h-4'} />
      {Math.abs(change).toFixed(1)}%
    </span>
  );
};

// ==========================================
// GOAL PROGRESS BAR COMPONENT
// ==========================================
interface GoalProgressBarProps {
  goal: GoalProgress;
}

const GoalProgressBar: React.FC<GoalProgressBarProps> = ({ goal }) => {
  const progressPercent = Math.min(goal.progress_percentage, 100);
  const isComplete = goal.actual_value >= goal.target_value;
  const barColor = isComplete ? 'bg-emerald-500' : goal.on_track ? 'bg-blue-500' : 'bg-amber-500';

  return (
    <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-800 dark:text-white">
            {getMetricTypeLabel(goal.metric_type)}
          </span>
          {isComplete && (
            <span className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full">
              Tamamlandı
            </span>
          )}
          {!isComplete && goal.on_track && (
            <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full">
              Yolunda
            </span>
          )}
          {!isComplete && !goal.on_track && (
            <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full">
              Geride
            </span>
          )}
        </div>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {goal.days_remaining > 0 ? `${goal.days_remaining} gün kaldı` : 'Süre doldu'}
        </span>
      </div>
      <div className="relative">
        <div className="w-full bg-gray-200 dark:bg-slate-600 h-3 rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all duration-500 rounded-full`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-sm">
          <span className="text-slate-600 dark:text-slate-300 font-medium">
            {formatMetricValue(goal.actual_value, goal.metric_type)}
          </span>
          <span className="text-slate-400">
            / {formatMetricValue(goal.target_value, goal.metric_type)} ({progressPercent.toFixed(0)}%)
          </span>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// CONSULTANT VIEW COMPONENT (NEW LOGIC)
// ==========================================
interface ConsultantReportViewProps {
  sales: Sale[];
  userProfile: UserProfile;
}

const ConsultantReportView: React.FC<ConsultantReportViewProps> = ({ sales, userProfile }) => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Filter Sales for My Profile
  const mySales = useMemo(() => {
    return sales.filter(s => s.consultantId === userProfile.id || s.consultant_id === userProfile.id || s.user_id === userProfile.id);
  }, [sales, userProfile.id]);

  // Parse selected month
  const monthRange = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const monthName = firstDay.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });
    return { firstDay, lastDay, monthName, year, month };
  }, [selectedMonth]);

  // Calculate stats for My Sales
  const stats = useMemo(() => {
    const { firstDay, lastDay } = monthRange;

    // Monthly Sales
    const monthlySales = mySales.filter(s => {
      const saleDate = new Date(s.saleDate || s.sale_date || '');
      return saleDate >= firstDay && saleDate <= lastDay;
    });

    const totalRevenue = monthlySales.reduce((sum, s) => sum + (s.salePrice || s.sale_price || 0), 0);
    const grossCommission = monthlySales.reduce((sum, s) => sum + (s.commissionAmount || s.commission_amount || 0), 0);
    const myNetEarnings = monthlySales.reduce((sum, s) => sum + (s.consultantShareAmount || s.consultant_share_amount || 0), 0);
    const officeShare = monthlySales.reduce((sum, s) => sum + (s.officeShareAmount || s.office_share_amount || 0), 0);

    const saleCount = monthlySales.filter(s => s.transactionType !== 'rental').length;
    const rentalCount = monthlySales.filter(s => s.transactionType === 'rental').length;

    return {
      monthlySales,
      totalRevenue,
      grossCommission,
      myNetEarnings,
      officeShare,
      count: monthlySales.length,
      saleCount,
      rentalCount
    };
  }, [mySales, monthRange]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const newDate = new Date(year, month - 1 + (direction === 'next' ? 1 : -1), 1);
    setSelectedMonth(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Benim Performansım</h2>
          <p className="text-slate-500 dark:text-slate-400">Kişisel satış ve kazanç raporlarınız</p>
        </div>

        {/* Month Selector */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-2">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#1193d4]" />
              <span className="font-bold text-slate-800 dark:text-white capitalize">{monthRange.monthName}</span>
            </div>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Summary Mini Cards */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 flex justify-between items-center">
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase">Satış Sayısı</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{stats.saleCount}</p>
          </div>
          <TrendingUp className="w-5 h-5 text-blue-500" />
        </div>
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 flex justify-between items-center">
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase">Kiralama Sayısı</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{stats.rentalCount}</p>
          </div>
          <HomeIcon className="w-5 h-5 text-indigo-500" />
        </div>
      </div>

      {/* Personal KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Earnings (Priority) */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-5 rounded-xl text-white shadow-lg shadow-indigo-200 dark:shadow-none">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="w-6 h-6 opacity-80" />
            <span className="text-sm opacity-90 font-medium">Net Kazancım</span>
          </div>
          <p className="text-2xl font-bold">{stats.myNetEarnings.toLocaleString('tr-TR')} TL</p>
          <p className="text-xs opacity-75 mt-1 bg-white/20 inline-block px-2 py-0.5 rounded-full">Bu ay hesabıma geçen</p>
        </div>

        {/* Total Sales (Volume) */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Toplam Satış Hacmi</span>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{(stats.totalRevenue / 1000000).toFixed(2)}M TL</p>
          <p className="text-xs text-slate-400 mt-1">{stats.count} işlem</p>
        </div>

        {/* Gross Commission */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Brüt Komisyon</span>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.grossCommission.toLocaleString('tr-TR')} TL</p>
          <p className="text-xs text-slate-400 mt-1">Toplam üretilen değer</p>
        </div>

        {/* Office Contrib */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Ofis Payı</span>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.officeShare.toLocaleString('tr-TR')} TL</p>
          <p className="text-xs text-slate-400 mt-1">Ofise katkınız</p>
        </div>
      </div>

      {/* My Sales Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Bu Ayın İşlemleri
          </h3>
        </div>

        {stats.monthlySales.length > 0 ? (
          <SalesTable sales={stats.monthlySales} isBroker={false} />
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-gray-300 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-1">Henüz işlem yok</h3>
            <p className="text-slate-500 dark:text-slate-400">
              Bu ay için henüz tamamlanmış bir satış veya kiralama işleminiz bulunmuyor.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// SHARED SALES TABLE COMPONENT
// ==========================================
const SalesTable: React.FC<{ sales: Sale[], isBroker: boolean }> = ({ sales, isBroker }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-slate-700/50">
          <tr>
            <th className="text-left p-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Tarih</th>
            <th className="text-left p-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">İşlem</th>
            <th className="text-left p-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Portföy</th>
            <th className="text-right p-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Fiyat/Kira</th>
            <th className="text-right p-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Brüt Komisyon</th>
            {isBroker ? (
              <>
                <th className="text-right p-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Ofis</th>
                <th className="text-right p-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Danışman</th>
              </>
            ) : (
              <th className="text-right p-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Net Kazancım</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
          {sales.map(sale => (
            <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
              <td className="p-3 text-sm text-slate-600 dark:text-slate-300">
                {new Date(sale.saleDate || sale.sale_date || '').toLocaleDateString('tr-TR')}
              </td>
              <td className="p-3 text-sm">
                <span className={`px-2 py-1 rounded text-xs font-medium ${sale.transactionType === 'rental'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  }`}>
                  {sale.transactionType === 'rental' ? 'Kiralama' : 'Satış'}
                </span>
              </td>
              <td className="p-3 text-sm font-medium text-slate-800 dark:text-white">
                {sale.propertyTitle || '-'}
              </td>
              <td className="p-3 text-sm text-right text-slate-600 dark:text-slate-300">
                {(sale.transactionType === 'rental' ? (sale.monthlyRent || 0) : (sale.salePrice || sale.sale_price || 0)).toLocaleString('tr-TR')} TL
              </td>
              <td className="p-3 text-sm text-right font-medium text-slate-600 dark:text-slate-400">
                {(sale.commissionAmount || sale.commission_amount || 0).toLocaleString('tr-TR')} TL
              </td>

              {isBroker ? (
                <>
                  <td className="p-3 text-sm text-right text-slate-600 dark:text-slate-300">
                    {(sale.officeShareAmount || sale.office_share_amount || 0).toLocaleString('tr-TR')} TL
                  </td>
                  <td className="p-3 text-sm text-right font-medium text-green-600 dark:text-green-400">
                    {(sale.consultantShareAmount || sale.consultant_share_amount || 0).toLocaleString('tr-TR')} TL
                  </td>
                </>
              ) : (
                <td className="p-3 text-sm text-right font-bold text-indigo-600 dark:text-indigo-400">
                  {(sale.consultantShareAmount || sale.consultant_share_amount || 0).toLocaleString('tr-TR')} TL
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const Reports: React.FC = () => {
  const { properties, customers, activities, sales, teamMembers, userProfile } = useData();

  // Determine Role
  const isBroker = userProfile?.role === 'broker' || userProfile?.role === 'admin' || userProfile?.role === 'owner';

  if (isBroker) {
    return <BrokerReportView
      sales={sales}
      teamMembers={teamMembers}
      properties={properties}
      customers={customers}
      activities={activities}
    />;
  }

  return <ConsultantReportView
    sales={sales}
    userProfile={userProfile}
  />;
};

export default Reports;