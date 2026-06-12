import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Building, MapPin } from 'lucide-react';
import { useData } from '../context/DataContext';

const RequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { requests, properties } = useData();
  const request = requests.find(r => r.id === id);

  if (!request) return <div className="p-10 text-center text-gray-500 dark:text-slate-400">Talep bulunamadı.</div>;

  // Matching Logic
  const matchingProperties = properties.filter(p => {
      const matchType = p.type === request.type;
      const matchPrice = p.price >= request.minPrice && p.price <= request.maxPrice;
      const matchCity = p.location.includes(request.city);
      // Loose text match for district if specified
      const matchDistrict = request.district === 'Tümü' || p.location.includes(request.district); 
      
      return matchType && matchPrice && matchCity && matchDistrict;
  });

  return (
    <div className="space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors text-sm mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Taleplere Dön
        </button>

        {/* Request Info Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 transition-colors">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{request.customerName} - Emlak Talebi</h1>
                    <p className="text-gray-500 dark:text-slate-400 mt-1">{request.type} arıyor</p>
                </div>
                <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                    {request.status}
                </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-4 border-t border-gray-100 dark:border-slate-700">
                <div>
                    <span className="text-xs text-gray-400 dark:text-slate-500 block uppercase">Bütçe Aralığı</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {request.minPrice.toLocaleString()} - {request.maxPrice.toLocaleString()} {request.currency}
                    </span>
                </div>
                <div>
                    <span className="text-xs text-gray-400 dark:text-slate-500 block uppercase">Lokasyon</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{request.district}, {request.city}</span>
                </div>
                <div>
                    <span className="text-xs text-gray-400 dark:text-slate-500 block uppercase">Oda Tercihi</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{request.minRooms || "Farketmez"}</span>
                </div>
                 <div>
                    <span className="text-xs text-gray-400 dark:text-slate-500 block uppercase">Tarih</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{request.date}</span>
                </div>
            </div>
            {request.notes && (
                <div className="mt-2 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30 text-sm text-amber-800 dark:text-amber-200">
                    <strong>Notlar:</strong> {request.notes}
                </div>
            )}
        </div>

        {/* Matches Section */}
        <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <CheckCircle className="text-[#1193d4] w-5 h-5" />
                Eşleşen Portföyler ({matchingProperties.length})
            </h2>
            
            {matchingProperties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {matchingProperties.map(prop => (
                        <div key={prop.id} className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow group">
                            <div className="h-48 overflow-hidden relative">
                                <img src={prop.images[0]} alt={prop.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 px-2 py-1 rounded shadow text-xs font-bold text-slate-800 dark:text-white">
                                    {prop.price.toLocaleString()} {prop.currency}
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-slate-800 dark:text-white mb-1 truncate">{prop.title}</h3>
                                <div className="flex items-center text-gray-500 dark:text-slate-400 text-sm mb-3">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    {prop.location}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-slate-400 mb-4">
                                    <span>{prop.rooms}</span>
                                    <span>•</span>
                                    <span>{prop.area} m²</span>
                                    <span>•</span>
                                    <span>{prop.heating}</span>
                                </div>
                                <Link to={`/properties/${prop.id}`} className="block w-full text-center bg-gray-50 dark:bg-slate-700 hover:bg-[#1193d4] dark:hover:bg-[#1193d4] hover:text-white dark:hover:text-white text-gray-700 dark:text-slate-200 font-medium py-2 rounded-lg transition-colors border border-gray-200 dark:border-slate-600 hover:border-[#1193d4] dark:hover:border-[#1193d4]">
                                    Detayları Gör
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl p-10 text-center">
                    <Building className="w-12 h-12 mx-auto text-gray-300 dark:text-slate-600 mb-3" />
                    <p className="text-gray-500 dark:text-slate-400 font-medium">Şu anda bu kriterlere uygun emlak bulunmuyor.</p>
                    <Link to="/properties/new" className="text-[#1193d4] hover:underline mt-2 inline-block text-sm">
                        Bu talebe uygun yeni emlak ekle
                    </Link>
                </div>
            )}
        </div>
    </div>
  );
};

export default RequestDetail;