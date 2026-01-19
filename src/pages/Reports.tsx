import React from 'react';
import { useData } from '../context/DataContext';
import { BarChart3, PieChart, TrendingUp, Wallet } from 'lucide-react';

const Reports: React.FC = () => {
  const { properties, customers, activities } = useData();

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
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Performans Raporları</h2>

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
    </div>
  );
};

export default Reports;