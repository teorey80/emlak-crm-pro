import React, { useState } from 'react';
import { Building, MapPin, Plus } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Site } from '../types';

const SiteManagement: React.FC = () => {
  const { sites, addSite, deleteSite } = useData();
  const [newSite, setNewSite] = useState<Partial<Site>>({
    name: '',
    region: '',
    address: '',
    status: 'Aktif'
  });

  const handleAddSite = () => {
    if (!newSite.name || !newSite.region) return;

    const site: Site = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString().split('T')[0],
        ...newSite as Site
    };

    addSite(site);
    setNewSite({
        name: '',
        region: '',
        address: '',
        status: 'Aktif'
    });
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Site Yönetimi</h2>
        <button className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2.5 rounded-lg hover:bg-sky-700 shadow-sm font-medium">
          <Plus className="w-4 h-4" />
          Yeni Site Ekle
        </button>
      </div>
      <p className="text-gray-500 dark:text-slate-400">Mevcut siteleri yönetin veya yeni site ekleyin.</p>

      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden transition-colors">
         <div className="p-6 border-b border-gray-100 dark:border-slate-700">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Mevcut Siteler</h3>
         </div>
         <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700 text-gray-500 dark:text-slate-400 uppercase text-xs font-semibold">
                <tr>
                    <th className="p-4">Site Adı</th>
                    <th className="p-4">Bölge</th>
                    <th className="p-4">Adres</th>
                    <th className="p-4">Eklenme Tarihi</th>
                    <th className="p-4">Durum</th>
                    <th className="p-4 text-right">Eylemler</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                {sites.map((site) => (
                    <tr key={site.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                        <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{site.name}</td>
                        <td className="p-4 text-gray-600 dark:text-slate-400">{site.region}</td>
                        <td className="p-4 text-gray-500 dark:text-slate-500 text-xs">{site.address}</td>
                        <td className="p-4 text-gray-500 dark:text-slate-500 text-xs">{site.createdAt}</td>
                        <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${site.status === 'Aktif' ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300'}`}>
                                {site.status}
                            </span>
                        </td>
                        <td className="p-4 text-right">
                            <button className="text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 text-xs font-medium mr-3">Düzenle</button>
                            <button onClick={() => deleteSite(site.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Sil</button>
                        </td>
                    </tr>
                ))}
            </tbody>
         </table>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm p-6 transition-colors">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">Yeni Site Ekle</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Site Adı</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg p-2 text-slate-800 dark:text-white focus:ring-sky-500 focus:border-sky-500" 
                    placeholder="Örn: Gülbahçe Konakları"
                    value={newSite.name}
                    onChange={(e) => setNewSite({...newSite, name: e.target.value})} 
                  />
              </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Bölge</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg p-2 text-slate-800 dark:text-white focus:ring-sky-500 focus:border-sky-500" 
                    placeholder="Örn: Kadıköy"
                    value={newSite.region}
                    onChange={(e) => setNewSite({...newSite, region: e.target.value})} 
                  />
              </div>
              <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Adres</label>
                  <textarea 
                    className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg p-2 text-slate-800 dark:text-white focus:ring-sky-500 focus:border-sky-500" 
                    rows={3} 
                    placeholder="Sitenin tam adresini girin"
                    value={newSite.address}
                    onChange={(e) => setNewSite({...newSite, address: e.target.value})} 
                  ></textarea>
              </div>
               <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Durum</label>
                   <select 
                    className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg p-2 text-slate-800 dark:text-white focus:ring-sky-500 focus:border-sky-500"
                    value={newSite.status}
                    onChange={(e) => setNewSite({...newSite, status: e.target.value as any})} 
                   >
                       <option value="Aktif">Aktif</option>
                       <option value="Pasif">Pasif</option>
                   </select>
               </div>
          </div>
          <div className="mt-4 text-right">
               <button 
                onClick={handleAddSite}
                className="bg-sky-600 text-white px-6 py-2 rounded-lg hover:bg-sky-700 font-medium transition-colors"
               >
                   Site Ekle
               </button>
          </div>
      </div>
    </div>
  );
};

export default SiteManagement;