import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { BarChart3, PieChart, TrendingUp, Wallet, DollarSign, Users, Calendar } from 'lucide-react';

const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const amount = (value: number | string | null | undefined) => Number(value ?? 0);
type Period = 'thisMonth' | 'lastMonth' | 'threeMonths' | 'thisYear' | 'custom';

const Reports: React.FC = () => {
  const { properties, customers, activities, sales, teamMembers } = useData();
  const [viewMode, setViewMode] = useState<'overview' | 'commission'>('overview');
  const [period, setPeriod] = useState<Period>('thisMonth');
  const [startDate, setStartDate] = useState(() => dateKey(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [endDate, setEndDate] = useState(() => dateKey(new Date()));

  const choosePeriod = (next: Period) => {
    setPeriod(next);
    if (next === 'custom') return;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const start = next === 'lastMonth' ? new Date(year, month - 1, 1)
      : next === 'threeMonths' ? new Date(year, month - 2, 1)
      : next === 'thisYear' ? new Date(year, 0, 1)
      : new Date(year, month, 1);
    const end = next === 'lastMonth' ? new Date(year, month, 0) : now;
    setStartDate(dateKey(start));
    setEndDate(dateKey(end));
  };

  const invalidRange = Boolean(startDate && endDate && startDate > endDate);

  // Seçilen dönemdeki kapanışlar; tarih alanı DATE olduğundan günleri ISO metin olarak karşılaştırırız.
  const commissionStats = useMemo(() => {
    const periodSales = sales?.filter(s => {
      const saleDate = (s.saleDate || s.sale_date || '').slice(0, 10);
      return !invalidRange && Boolean(startDate && endDate && saleDate >= startDate && saleDate <= endDate);
    }) || [];

    const totalCommission = periodSales.reduce((sum, s) => sum + amount(s.commissionAmount ?? s.commission_amount), 0);
    const totalKdv = periodSales.reduce((sum, s) => sum + amount(s.kdvAmount ?? s.kdv_amount), 0);
    const totalGross = totalCommission + totalKdv;
    const totalOfficeShare = periodSales.reduce((sum, s) => sum + amount(s.officeShareAmount ?? s.office_share_amount), 0);
    const totalConsultantShare = periodSales.reduce((sum, s) => sum + amount(s.consultantShareAmount ?? s.consultant_share_amount), 0);
    const totalExpenses = periodSales.reduce((sum, s) => sum + amount(s.totalExpenses ?? s.total_expenses), 0);
    const totalRevenue = periodSales.reduce((sum, s) => sum + amount((s.transactionType || s.transaction_type) === 'rental' ? (s.monthlyRent ?? s.monthly_rent ?? s.salePrice ?? s.sale_price) : (s.salePrice ?? s.sale_price)), 0);

    // Per consultant breakdown
    const consultantBreakdown = teamMembers.map(member => {
      const memberSales = periodSales.filter(s =>
        s.consultantId === member.id || s.consultant_id === member.id || s.user_id === member.id
      );
      const commission = memberSales.reduce((sum, s) => sum + amount(s.consultantShareAmount ?? s.consultant_share_amount), 0);
      const saleCount = memberSales.length;
      const revenue = memberSales.reduce((sum, s) => sum + amount(s.salePrice ?? s.sale_price), 0);

      return {
        ...member,
        commission,
        saleCount,
        revenue
      };
    }).filter(member => member.saleCount > 0).sort((a, b) => b.commission - a.commission);

    return {
      periodSales,
      totalCommission,
      totalKdv,
      totalGross,
      totalOfficeShare,
      totalConsultantShare,
      totalExpenses,
      totalRevenue,
      saleCount: periodSales.length,
      consultantBreakdown
    };
  }, [sales, teamMembers, startDate, endDate, invalidRange]);

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
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Performans Raporlari</h2>

        {/* View Mode Toggle */}
        <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-1 flex">
          <button
            onClick={() => setViewMode('overview')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'overview'
                ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            Genel Bakis
          </button>
          <button
            onClick={() => setViewMode('commission')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'commission'
                ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            Komisyon Raporu
          </button>
        </div>
      </div>

      {/* Commission Report View */}
      {viewMode === 'commission' && (
        <div className="space-y-6">
          {/* Dönem ve tarih aralığı */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-2 mb-3 font-semibold text-slate-800 dark:text-white"><Calendar className="w-5 h-5 text-[#1193d4]" /> Rapor dönemi</div>
            <div className="flex flex-wrap gap-2 mb-4">
              {([['thisMonth', 'Bu ay'], ['lastMonth', 'Geçen ay'], ['threeMonths', 'Son 3 ay'], ['thisYear', 'Bu yıl'], ['custom', 'Özel aralık']] as const).map(([value, label]) => (
                <button key={value} type="button" onClick={() => choosePeriod(value)} className={`px-3 py-2 rounded-lg text-sm ${period === value ? 'bg-sky-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}>{label}</button>
              ))}
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-sm text-slate-700 dark:text-slate-300">Başlangıç<input aria-label="Başlangıç tarihi" type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPeriod('custom'); }} className="block mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" /></label>
              <label className="text-sm text-slate-700 dark:text-slate-300">Bitiş<input aria-label="Bitiş tarihi" type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPeriod('custom'); }} className="block mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" /></label>
            </div>
            {invalidRange && <p role="alert" className="mt-2 text-sm text-red-600">Başlangıç tarihi bitiş tarihinden sonra olamaz.</p>}
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Eski kayıtlarda KDV girilmediyse KDV tutarı 0 TL görünür.</p>
          </div>

          {/* Commission Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-5 rounded-xl text-white">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-6 h-6 opacity-80" />
                <span className="text-sm opacity-90">Komisyon (KDV hariç)</span>
              </div>
              <p className="text-2xl font-bold">{commissionStats.totalCommission.toLocaleString('tr-TR')} TL</p>
              <p className="text-xs opacity-75 mt-1">{commissionStats.saleCount} kapanış</p>
            </div>

            <div className="bg-gradient-to-br from-teal-500 to-cyan-600 p-5 rounded-xl text-white">
              <div className="flex items-center gap-3 mb-2"><Wallet className="w-6 h-6 opacity-80" /><span className="text-sm opacity-90">KDV</span></div>
              <p className="text-2xl font-bold">{commissionStats.totalKdv.toLocaleString('tr-TR')} TL</p>
            </div>

            <div className="bg-gradient-to-br from-sky-500 to-blue-600 p-5 rounded-xl text-white">
              <div className="flex items-center gap-3 mb-2"><DollarSign className="w-6 h-6 opacity-80" /><span className="text-sm opacity-90">KDV dahil tahsilat</span></div>
              <p className="text-2xl font-bold">{commissionStats.totalGross.toLocaleString('tr-TR')} TL</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-5 rounded-xl text-white">
              <div className="flex items-center gap-3 mb-2">
                <Wallet className="w-6 h-6 opacity-80" />
                <span className="text-sm opacity-90">Ofis Payi</span>
              </div>
              <p className="text-2xl font-bold">{commissionStats.totalOfficeShare.toLocaleString('tr-TR')} TL</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-violet-600 p-5 rounded-xl text-white">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-6 h-6 opacity-80" />
                <span className="text-sm opacity-90">Danismanlara Odenen</span>
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

          {/* Consultant Breakdown */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-slate-800 dark:to-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                Danisman Bazinda Komisyon Dagilimi
              </h3>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-slate-700">
              {commissionStats.consultantBreakdown.map((consultant, index) => (
                <div key={consultant.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      index === 1 ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' :
                      index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                      {index + 1}
                    </div>
                    <img src={consultant.avatar} alt={consultant.name} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white">{consultant.name}</p>
                      <p className="text-xs text-slate-500">{consultant.saleCount} satis</p>
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
                  Seçilen dönemde kapanış bulunmuyor.
                </div>
              )}
            </div>
          </div>

          {/* Recent Sales */}
          {commissionStats.periodSales.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-slate-700">
                <h3 className="font-bold text-slate-800 dark:text-white">Dönem Kapanışları</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-slate-700/50">
                    <tr>
                      <th className="text-left p-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Tarih</th>
                      <th className="text-left p-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Portfoy</th>
                      <th className="text-right p-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">İşlem Bedeli</th>
                      <th className="text-right p-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Komisyon (KDV hariç)</th>
                      <th className="text-right p-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">KDV</th>
                      <th className="text-right p-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">KDV dahil</th>
                      <th className="text-right p-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Ofis</th>
                      <th className="text-right p-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Danisman</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {commissionStats.periodSales.map(sale => (
                      <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                        <td className="p-3 text-sm text-slate-600 dark:text-slate-300">
                          {new Date(sale.saleDate || sale.sale_date || '').toLocaleDateString('tr-TR')}
                        </td>
                        <td className="p-3 text-sm font-medium text-slate-800 dark:text-white">{sale.propertyTitle || properties.find(p => p.id === (sale.propertyId || sale.property_id))?.title || '-'}</td>
                        <td className="p-3 text-sm text-right text-slate-600 dark:text-slate-300">
                          {amount((sale.transactionType || sale.transaction_type) === 'rental' ? (sale.monthlyRent ?? sale.monthly_rent ?? sale.salePrice ?? sale.sale_price) : (sale.salePrice ?? sale.sale_price)).toLocaleString('tr-TR')} TL
                        </td>
                        <td className="p-3 text-sm text-right font-medium text-blue-600 dark:text-blue-400">
                          {amount(sale.commissionAmount ?? sale.commission_amount).toLocaleString('tr-TR')} TL
                        </td>
                        <td className="p-3 text-sm text-right text-slate-600 dark:text-slate-300">
                          {amount(sale.kdvAmount ?? sale.kdv_amount).toLocaleString('tr-TR')} TL
                        </td>
                        <td className="p-3 text-sm text-right font-semibold text-sky-700 dark:text-sky-300">
                          {(amount(sale.commissionAmount ?? sale.commission_amount) + amount(sale.kdvAmount ?? sale.kdv_amount)).toLocaleString('tr-TR')} TL
                        </td>
                        <td className="p-3 text-sm text-right text-slate-600 dark:text-slate-300">
                          {(sale.officeShareAmount || sale.office_share_amount || 0).toLocaleString('tr-TR')} TL
                        </td>
                        <td className="p-3 text-sm text-right font-medium text-green-600 dark:text-green-400">
                          {(sale.consultantShareAmount || sale.consultant_share_amount || 0).toLocaleString('tr-TR')} TL
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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
    </div>
  );
};

export default Reports;
