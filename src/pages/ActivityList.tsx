import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, MapPin, PhoneIncoming, PhoneOutgoing, Briefcase, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useData } from '../context/DataContext';

// Helper functions moved outside to prevent ReferenceError/TDZ issues
const getActivityIcon = (type: string) => {
    switch (type) {
        case 'Yer Gösterimi': return <MapPin className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
        case 'Gelen Arama': return <PhoneIncoming className="w-4 h-4 text-green-600 dark:text-green-400" />;
        case 'Giden Arama': return <PhoneOutgoing className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
        case 'Ofis Toplantısı': return <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
        default: return <Clock className="w-4 h-4 text-gray-600 dark:text-slate-400" />;
    }
};

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'Olumlu': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"><CheckCircle className="w-3 h-3" /> Olumlu</span>;
        case 'Olumsuz': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"><XCircle className="w-3 h-3" /> Olumsuz</span>;
        case 'Düşünüyor': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400"><Clock className="w-3 h-3" /> Düşünüyor</span>;
        default: return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">Tamamlandı</span>;
    }
};

const ActivityList: React.FC = () => {
    const { activities, deleteActivity, hasMoreActivities, loadMoreActivities, loadingMore } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentFilterType, setCurrentFilterType] = useState('Tümü');

    const handleDelete = async (id: string) => {
        if (window.confirm('Bu aktiviteyi silmek istediğinize emin misiniz?')) {
            try {
                await deleteActivity(id);
            } catch (error) {
                console.error("Silme hatası:", error);
                alert("Silinemedi.");
            }
        }
    };

    const filteredActivities = activities.filter(a => {
        const matchesSearch =
            a.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (a.propertyTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
        const matchesType = currentFilterType === 'Tümü' || a.type === currentFilterType;

        return matchesSearch && matchesType;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Aktiviteler & Ajanda</h2>
                <Link
                    to="/activities/new"
                    className="flex items-center gap-2 bg-[#1193d4] text-white px-4 py-2.5 rounded-lg hover:opacity-90 transition-all shadow-sm font-medium">
                    <Plus className="w-4 h-4" />
                    Yeni Aktivite Ekle
                </Link>
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 transition-colors">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Müşteri veya Emlak Ara..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900 focus:border-[#1193d4]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-48">
                    <select
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none cursor-pointer"
                        value={currentFilterType}
                        onChange={(e) => setCurrentFilterType(e.target.value)}
                    >
                        <option>Tümü</option>
                        <option>Yer Gösterimi</option>
                        <option>Gelen Arama</option>
                        <option>Giden Arama</option>
                        <option>Ofis Toplantısı</option>
                    </select>
                </div>
            </div>

            {/* Activity List */}
            <div className="space-y-4">
                {filteredActivities.map((activity) => (
                    <div key={activity.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-4 items-start">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="bg-gray-100 dark:bg-slate-700 p-1.5 rounded-lg">
                                    {getActivityIcon(activity.type)}
                                </div>
                                <h3 className="font-bold text-slate-800 dark:text-white text-lg">{activity.type}</h3>
                                <span className="text-xs text-gray-400 dark:text-slate-500 ml-auto md:ml-2 block md:inline">{activity.date}</span>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mb-3 text-sm">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-gray-500 dark:text-slate-400">Müşteri:</span>
                                    <Link to={`/customers/${activity.customerId}`} className="font-medium text-[#1193d4] hover:underline">
                                        {activity.customerName}
                                    </Link>
                                </div>
                                {activity.propertyId && (
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-gray-500 dark:text-slate-400">Emlak:</span>
                                        <Link to={`/properties/${activity.propertyId}`} className="font-medium text-slate-700 dark:text-slate-300 hover:text-[#1193d4] truncate max-w-[200px]">
                                            {activity.propertyTitle}
                                        </Link>
                                    </div>
                                )}
                            </div>

                            <p className="text-gray-600 dark:text-slate-300 text-sm bg-gray-50 dark:bg-slate-700 p-3 rounded-lg border border-gray-100 dark:border-slate-600">
                                {activity.description}
                            </p>
                        </div>

                        <div className="self-start md:self-center min-w-[100px] flex flex-col items-end gap-2">
                            {getStatusBadge(activity.status)}
                            <div className="flex items-center gap-3">
                                <Link to={`/activities/edit/${activity.id}`} className="text-sm font-medium text-[#1193d4] hover:underline">
                                    Düzenle
                                </Link>
                                <button
                                    onClick={() => handleDelete(activity.id)}
                                    className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline"
                                >
                                    Sil
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredActivities.length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-slate-400">
                        <p>Aradığınız kriterlere uygun aktivite bulunamadı.</p>
                    </div>
                )}

                {/* Load More Button */}
                {filteredActivities.length > 0 && (
                    <div className="flex justify-center pt-4">
                        {hasMoreActivities ? (
                            <button
                                onClick={loadMoreActivities}
                                disabled={loadingMore}
                                className="px-6 py-2.5 bg-[#1193d4] text-white rounded-lg font-medium hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loadingMore ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Yükleniyor...
                                    </>
                                ) : (
                                    'Daha Fazla Yükle'
                                )}
                            </button>
                        ) : (
                            <span className="text-sm text-gray-500 dark:text-slate-400">
                                Tüm aktiviteler yüklendi ({activities.length} aktivite)
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityList;