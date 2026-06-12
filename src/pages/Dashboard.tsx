import React, { useState, useMemo } from 'react';
import { Calendar, Clock, MapPin, ChevronRight, MoreVertical, Sparkles, Send, TrendingUp, TrendingDown, Users, Home as HomeIcon, Check, X, DollarSign } from 'lucide-react';
import { generateRealEstateAdvice } from '../services/geminiService';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { findMatches } from '../services/matchingService';

const Dashboard: React.FC = () => {
  const { customers, properties, activities, requests, sales } = useData();
  const navigate = useNavigate();

  // Calculate real statistics
  const stats = useMemo(() => {
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Recent requests (last 7 days)
    const recentRequests = requests.filter(r => {
      if (!r.date) return false;
      const reqDate = new Date(r.date);
      return reqDate >= sevenDaysAgo;
    }).length;

    // Active customers
    const activeCustomers = customers.filter(c => c.status === 'Aktif').length;

    // Previous month active customers for trend
    const previousMonthCustomers = customers.filter(c => {
      if (!c.createdAt) return false;
      const created = new Date(c.createdAt);
      return created >= sixtyDaysAgo && created < thirtyDaysAgo;
    }).length;

    const currentMonthCustomers = customers.filter(c => {
      if (!c.createdAt) return false;
      const created = new Date(c.createdAt);
      return created >= thirtyDaysAgo;
    }).length;

    const customerTrend = previousMonthCustomers > 0
      ? Math.round(((currentMonthCustomers - previousMonthCustomers) / previousMonthCustomers) * 100)
      : currentMonthCustomers > 0 ? 100 : 0;

    // Sales this month
    const monthlySales = sales?.filter(s => {
      if (!s.saleDate) return false;
      const saleDate = new Date(s.saleDate);
      return saleDate >= thirtyDaysAgo;
    }) || [];

    const totalMonthlySalesValue = monthlySales.reduce((sum, s) => sum + (s.salePrice || 0), 0);

    // Properties for sale
    const forSaleProperties = properties.filter(p => p.listingStatus !== 'Satıldı' && p.listingStatus !== 'Kiralandı').length;

    // Total portfolio value
    const totalPortfolioValue = properties.reduce((acc, curr) => acc + curr.price, 0);

    // Completed activities this week
    const completedActivities = activities.filter(a => {
      if (!a.date) return false;
      const actDate = new Date(a.date);
      return actDate >= sevenDaysAgo && (a.status === 'Tamamlandı' || a.status === 'Olumlu');
    }).length;

    return {
      recentRequests,
      activeCustomers,
      customerTrend,
      totalPortfolioValue,
      forSaleProperties,
      monthlySalesCount: monthlySales.length,
      totalMonthlySalesValue,
      completedActivities
    };
  }, [customers, properties, activities, requests, sales]);

  // Calculate Matches
  const smartMatches = React.useMemo(() => {
    return findMatches(properties, requests).slice(0, 3);
  }, [properties, requests]);

  // Combined Schedule: Upcoming appointments + Today's requests
  const dailySchedule = React.useMemo(() => {
    // Helper to get local date string YYYY-MM-DD
    const getLocalDateString = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const todayStr = getLocalDateString(new Date());

    // 1. Map Appointments
    const appointments = activities
      .filter(a => a.status === 'Planlandı' && new Date(a.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
      .map(a => ({
        id: a.id,
        type: 'activity',
        subtype: a.type,
        title: a.customerName,
        date: a.date,
        time: a.time,
        customerId: a.customerId,
        description: a.description
      }));

    // 2. Map Today's Requests
    // Compare dates robustly (handle 'YYYY-MM-DD' and 'YYYY-MM-DDTHH:mm:ss...')
    const todayRequests = requests
      .filter(r => (r.date && r.date.startsWith(todayStr)))
      .map(r => ({
        id: r.id,
        type: 'request',
        subtype: 'Müşteri Talebi',
        title: r.customerName,
        date: r.date,
        time: 'Yeni',
        customerId: r.customerId,
        description: `${r.requestType} ${r.type} - Max ${r.maxPrice.toLocaleString()} ₺`
      }));

    // Combine and sort by date/time
    return [...appointments, ...todayRequests]
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time === 'Yeni' ? '00:00' : (a.time || '00:00')}`).getTime();
        const dateB = new Date(`${b.date}T${b.time === 'Yeni' ? '00:00' : (b.time || '00:00')}`).getTime();
        return dateA - dateB;
      })
      .slice(0, 6);
  }, [activities, requests]);

  const [aiInput, setAiInput] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const handleAiAsk = async () => {
    if (!aiInput.trim()) return;
    setIsThinking(true);
    setAiResponse('');

    const response = await generateRealEstateAdvice(aiInput);

    setAiResponse(response);
    setIsThinking(false);
  };

  return (
    <div className="space-y-6">
      {/* Stats Row - Clickable Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Aktif Müşteri */}
        <div
          onClick={() => navigate('/customers')}
          className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm transition-all cursor-pointer hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 hover:scale-[1.02]"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">Aktif Müşteri</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{stats.activeCustomers}</h3>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className={`flex items-center text-xs font-medium ${stats.customerTrend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {stats.customerTrend >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            <span>Bu ay %{Math.abs(stats.customerTrend)} {stats.customerTrend >= 0 ? 'artış' : 'azalış'}</span>
          </div>
        </div>

        {/* Portföy İlanları */}
        <div
          onClick={() => navigate('/properties')}
          className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm transition-all cursor-pointer hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 hover:scale-[1.02]"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">Portföy İlanları</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{stats.forSaleProperties}</h3>
            </div>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
              <HomeIcon className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center text-xs text-gray-500 dark:text-slate-500 font-medium">
            <span>Toplam {(stats.totalPortfolioValue / 1000000).toFixed(1)}M TL</span>
          </div>
        </div>

        {/* Yeni Talepler */}
        <div
          onClick={() => navigate('/requests')}
          className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm transition-all cursor-pointer hover:shadow-md hover:border-sky-200 dark:hover:border-sky-800 hover:scale-[1.02]"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">Yeni Talep (7 Gün)</p>
              <h3 className="text-3xl font-bold text-sky-600 dark:text-sky-400 mt-1">{stats.recentRequests}</h3>
            </div>
            <div className="p-2 bg-sky-50 dark:bg-sky-900/20 rounded-lg text-sky-600 dark:text-sky-400">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center text-xs text-gray-500 dark:text-slate-500 font-medium">
            <span>Toplam {requests.length} talep</span>
          </div>
        </div>

        {/* Aylık Satış */}
        <div
          onClick={() => navigate('/reports')}
          className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm transition-all cursor-pointer hover:shadow-md hover:border-green-200 dark:hover:border-green-800 hover:scale-[1.02]"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">Aylık Satış</p>
              <h3 className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.monthlySalesCount}</h3>
            </div>
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center text-xs text-green-600 dark:text-green-400 font-medium">
            <span>{stats.totalMonthlySalesValue > 0 ? `${(stats.totalMonthlySalesValue / 1000000).toFixed(1)}M TL` : 'Satış bekleniyor'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 animate-fade-in">

        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">

          {/* Smart Matches Banner */}
          {smartMatches.length > 0 && (
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-10 transform translate-x-10 -translate-y-10">
                <Sparkles className="w-40 h-40" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-6 h-6 text-yellow-300" />
                  <h2 className="text-xl font-bold">Yapay Zeka Eşleşmeleri</h2>
                </div>
                <div className="space-y-3">
                  {smartMatches.map((match, idx) => (
                    <div key={idx} className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/20 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{match.request.customerName}</p>
                        <p className="text-sm text-indigo-100">Arıyor: {match.request.type} (Max {match.request.maxPrice ? match.request.maxPrice.toLocaleString() : '?'} ₺)</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-yellow-300">Bulundu: {match.property.title}</p>
                        <p className="text-sm text-indigo-100">{match.property.price.toLocaleString()} ₺</p>
                      </div>
                      <button
                        onClick={() => navigate(`/properties/${match.property.id}`)}
                        className="ml-4 px-3 py-1.5 bg-white text-indigo-600 rounded-lg text-xs font-bold hover:bg-gray-100"
                      >
                        İncele
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Schedule Section - Takes up 2 cols */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6 transition-colors">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Günlük Program</h2>
              <button className="text-sky-600 dark:text-sky-400 text-sm font-medium hover:underline">Tümünü Gör</button>
            </div>

            <div className="space-y-4">
              {dailySchedule.length === 0 ? (
                <div className="p-8 text-center text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Planlanmış randevu veya yeni talep bulunmuyor.</p>
                  <button
                    onClick={() => navigate('/activities/new')}
                    className="mt-3 text-xs text-[#1193d4] font-medium hover:underline"
                  >
                    Randevu Ekle
                  </button>
                </div>
              ) : (
                dailySchedule.map((item) => (
                  <div key={item.id} className="flex items-center p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-700 hover:border-sky-100 dark:hover:border-sky-800 transition-colors">
                    <div className={`p-3 rounded-full ${item.subtype === 'Yer Gösterimi' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' :
                      item.subtype === 'Telefon Görüşmesi' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                        item.subtype === 'Tapu İşlemi' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                          item.type === 'request' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' :
                            'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400'
                      }`}>
                      {item.subtype === 'Yer Gösterimi' ? <MapPin className="w-5 h-5" /> :
                        item.subtype === 'Tapu İşlemi' ? <Clock className="w-5 h-5" /> :
                          item.type === 'request' ? <Sparkles className="w-5 h-5" /> :
                            <Calendar className="w-5 h-5" />}
                    </div>
                    <div className="ml-4 flex-1">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.subtype} - {item.title}</h4>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {item.date} • {item.time === 'Yeni' ? <span className="text-orange-600 dark:text-orange-400 font-bold">YENİ TALEP</span> : item.time || 'Saat Yok'}
                        {item.description ? ` • ${item.description}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(item.type === 'activity' ? `/customers/${item.customerId}` : `/requests/edit/${item.id}`)}
                      className="p-2 text-gray-400 dark:text-slate-500 hover:text-[#1193d4] hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* AI Assistant Section - Takes up 1 col */}
          <div className="bg-gradient-to-b from-sky-50 to-white dark:from-slate-800 dark:to-slate-800 rounded-2xl border border-sky-100 dark:border-slate-700 shadow-sm p-6 flex flex-col transition-colors">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-sky-600 p-1.5 rounded-lg shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Akıllı Asistan</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
              Gününüzü planlamanıza, ilan açıklamaları yazmanıza veya piyasa analizi yapmanıza yardımcı olabilirim.
            </p>

            <div className="flex-1 overflow-y-auto mb-4 min-h-[200px] max-h-[300px] bg-white/50 dark:bg-slate-900/50 rounded-lg p-3 text-sm border border-sky-50 dark:border-slate-700">
              {!aiResponse && !isThinking && <span className="text-gray-400 dark:text-slate-500 italic">Nasıl yardımcı olabilirim?</span>}
              {isThinking && (
                <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                  <span className="animate-pulse">Düşünüyorum...</span>
                </div>
              )}
              {aiResponse && <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-200">{aiResponse}</div>}
            </div>

            <div className="relative">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiAsk()}
                placeholder="Bir soru sorun..."
                className="w-full pl-4 pr-10 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-sm"
              />
              <button
                onClick={handleAiAsk}
                disabled={isThinking}
                className="absolute right-2 top-2 p-1.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Matching Rates Widget */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6 transition-colors">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 dark:text-white">Eşleşme Oranları</h3>
          </div>
          {smartMatches.length > 0 ? (
            <div className="space-y-4">
              {smartMatches.slice(0, 3).map((match, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1 text-sm">
                      <span className="text-slate-600 dark:text-slate-300 font-medium">{match.request.customerName}</span>
                      <span className="text-sky-600 dark:text-sky-400 font-bold">{match.score}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2">
                      <div className="bg-sky-600 dark:bg-sky-500 h-2 rounded-full" style={{ width: `${match.score}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                      {match.property.title} - {match.property.price.toLocaleString('tr-TR')} TL
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/properties/${match.property.id}`)}
                    className="px-3 py-1.5 bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 text-xs font-medium rounded-lg hover:bg-sky-200 dark:hover:bg-sky-900/50"
                  >
                    Görüntüle
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400 dark:text-slate-500">
              <p className="text-sm">Henüz eşleşme bulunamadı</p>
              <p className="text-xs mt-1">Talep ve portföy ekledikçe eşleşmeler görünecek</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;