import React, { useState } from 'react';
import { Calendar, Clock, MapPin, ChevronRight, MoreVertical, Sparkles, Send, TrendingUp, Users, Home as HomeIcon, Check, X } from 'lucide-react';
import { generateRealEstateAdvice } from '../services/geminiService';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { findMatches } from '../services/matchingService';

const Dashboard: React.FC = () => {
  const { customers, properties, activities, requests } = useData();
  const navigate = useNavigate();

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

  // DEBUG: Get Today's string for display
  const debugToday = (() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();
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

  const totalPortfolioValue = properties.reduce((acc, curr) => acc + curr.price, 0);

  // Mock matching criteria data
  const matchingCriteria = [
    { label: 'Fiyat Aralığı', matched: true },
    { label: 'Konum (Şişli)', matched: true },
    { label: 'Oda Sayısı (3+1)', matched: true },
    { label: 'Bina Yaşı (<10)', matched: true },
    { label: 'Site İçerisinde', matched: false },
  ];

  return (
    <div className="space-y-6">
      {/* DEBUG PANEL - REMOVE AFTER FIX */}
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r shadow-sm">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Users className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-xs font-bold text-red-800 uppercase">Geliştirici Debug Modu</h3>
            <div className="mt-1 text-xs text-red-700">
              <p>Sistem Tarihi (Local): <strong>{debugToday}</strong></p>
              <p>Toplam Talep Sayısı: <strong>{requests.length}</strong> (Gelen Veri)</p>
              <p>Son 3 Request Tarihleri:</p>
              <ul className="list-disc pl-5 mt-1">
                {requests.slice(0, 3).map(r => (
                  <li key={r.id}>{r.customerName}: <strong>{r.date}</strong> (Eşleşiyor mu? {r.date && r.date.startsWith(debugToday) ? 'EVET' : 'HAYIR'})</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm transition-colors">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">Aktif Müşteri Sayısı</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{customers.filter(c => c.status === 'Aktif').length}</h3>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center text-xs text-green-600 dark:text-green-400 font-medium">
            <TrendingUp className="w-3 h-3 mr-1" />
            <span>Bu ay %12 artış</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm transition-colors">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">Portföydeki İlan Sayısı</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{properties.length}</h3>
            </div>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
              <HomeIcon className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center text-xs text-gray-500 dark:text-slate-500 font-medium">
            <span>Toplam {(totalPortfolioValue / 1000000).toFixed(1)}m TL değerinde</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm transition-colors">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">Yeni Talep (Son 7 Gün)</p>
              <h3 className="text-3xl font-bold text-sky-600 dark:text-sky-400 mt-1">5</h3>
            </div>
            <div className="p-2 bg-sky-50 dark:bg-sky-900/20 rounded-lg text-sky-600 dark:text-sky-400">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center text-xs text-green-600 dark:text-green-400 font-medium">
            <TrendingUp className="w-3 h-3 mr-1" />
            <span>Hedefin üzerinde</span>
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
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Ahmet Yılmaz - Portföy Eşleşmesi</span>
                <span className="text-sky-600 dark:text-sky-400 font-bold">80%</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2.5 mb-6">
                <div className="bg-sky-600 dark:bg-sky-500 h-2.5 rounded-full w-[80%]"></div>
              </div>

              {/* Matched Criteria List */}
              <div className="grid grid-cols-2 gap-3">
                {matchingCriteria.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    {item.matched ? (
                      <div className="bg-green-100 dark:bg-green-900/30 p-0.5 rounded-full">
                        <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                      </div>
                    ) : (
                      <div className="bg-gray-100 dark:bg-slate-700 p-0.5 rounded-full">
                        <X className="w-3 h-3 text-gray-400 dark:text-slate-500" />
                      </div>
                    )}
                    <span className={item.matched ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-gray-400 dark:text-slate-500'}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

            </div>
            <div className="flex-1 md:max-w-xs">
              <div className="p-4 bg-sky-50 dark:bg-sky-900/20 rounded-xl border border-sky-100 dark:border-sky-800/50">
                <p className="text-sm text-sky-900 dark:text-sky-300 font-semibold mb-1">Uygun İlanlar Bulundu</p>
                <p className="text-xs text-sky-700 dark:text-sky-400 mb-3">Müşteri profiline ve kriterlerine uygun 3 yeni ilan tespit edildi.</p>
                <button
                  onClick={() => navigate('/properties')}
                  className="px-4 py-2.5 bg-sky-600 text-white text-xs font-bold rounded-lg hover:bg-sky-700 transition-colors w-full shadow-sm"
                >
                  İlanları Görüntüle
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;