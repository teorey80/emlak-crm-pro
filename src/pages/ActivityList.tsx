import EntityTags from '../components/EntityTags';
import ActivityListingLink from '../components/ActivityListingLink';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, MapPin, PhoneIncoming, PhoneOutgoing, Briefcase, CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useData } from '../context/DataContext';
import type { Activity } from '../types';
import { listActivityPage } from '../services/activityService';
import { CALL_OUTCOME_LABELS, istanbulDate } from '../utils/prospecting';

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
        case 'Planlandı': return <span className="text-xs rounded-full px-2.5 py-0.5 bg-sky-100 text-sky-800">Planlandı</span>;
        case 'Olumlu': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"><CheckCircle className="w-3 h-3" /> Olumlu</span>;
        case 'Olumsuz': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"><XCircle className="w-3 h-3" /> Olumsuz</span>;
        case 'Düşünüyor': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400"><Clock className="w-3 h-3" /> Düşünüyor</span>;
        default: return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">Tamamlandı</span>;
    }
};

const ActivityList: React.FC = () => {
    const [params,setParams] = useSearchParams();
    const record = params.get('record') || '';
    const { deleteActivity, session } = useData();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');
    const [date, setDate] = useState('');
    const [source, setSource] = useState('all');
    const [refresh, setRefresh] = useState(0);
    const generation = useRef(0);
    const moreBusy = useRef(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentFilterType, setCurrentFilterType] = useState('all');

    const filters = useMemo(() => ({ search: searchTerm, type: currentFilterType, date, source, record }), [searchTerm, currentFilterType, date, source, record]);
    useEffect(() => {
        const request = ++generation.current;
        setLoading(true); setError(''); setActivities([]); setCount(0);
        const timer = window.setTimeout(() => {
            listActivityPage(filters).then(result => {
                if (generation.current === request) { setActivities(result.rows); setCount(result.count); }
            }).catch(() => { if (generation.current === request) setError('Aktiviteler yüklenemedi. Yeniden deneyin.'); })
              .finally(() => { if (generation.current === request) setLoading(false); });
        }, searchTerm ? 250 : 0);
        return () => { generation.current++; window.clearTimeout(timer); };
    }, [filters, refresh, session?.user.id]);
    const loadMoreActivities = async () => {
        if (moreBusy.current || loading) return;
        moreBusy.current = true; setLoadingMore(true);
        const request = generation.current;
        try {
            const result = await listActivityPage(filters, activities.length);
            if (request === generation.current) {
                setActivities(previous => [...previous, ...result.rows.filter(row => !previous.some(old => old.id === row.id))]);
                setCount(result.count);
            }
        } catch { if (request === generation.current) toast.error('Sonraki aktiviteler yüklenemedi. Tekrar deneyin.'); }
        finally { moreBusy.current = false; setLoadingMore(false); }
    };
    const handleDelete = async (id: string) => {
        if (!window.confirm('Bu aktiviteyi silmek istediğinize emin misiniz?')) return;
        try { await deleteActivity(id); setRefresh(value => value + 1); toast.success('Aktivite silindi.'); }
        catch { toast.error('Aktivite silinemedi.'); }
    };
    const hasMoreActivities = activities.length < count;
    const filteredActivities = activities;

    return (
        <div className="space-y-6">
            {record && <div className="rounded-lg bg-sky-50 dark:bg-sky-900/20 p-3 text-sm">Etiketten seçtiğiniz görüşme gösteriliyor. <button type="button" onClick={()=>{setParams({});setSearchTerm('');setCurrentFilterType('all');setDate('');setSource('all');}} className="underline">Tüm aktiviteleri göster</button></div>}
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
                        <option value="all">Tüm aktivite türleri</option>
                        <option>Yer Gösterimi</option>
                        <option>Gelen Arama</option>
                        <option>Giden Arama</option>
                        <option>Ofis Toplantısı</option><option>Tapu İşlemi</option><option>Kapora Alındı</option><option>Diğer</option>
                    </select>
                </div>
            </div>

            <div className="flex flex-wrap items-end gap-3">
                <label className="text-sm text-slate-600 dark:text-slate-300">Tarih<input aria-label="Aktivite tarihi" type="date" value={date} onChange={e => setDate(e.target.value)} className="block mt-1 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-2" /></label>
                <button className="text-sm text-sky-700 dark:text-sky-300 underline" onClick={() => setDate(istanbulDate())}>Bugün</button>
                <button className="text-sm text-sky-700 dark:text-sky-300 underline" onClick={() => setDate('')}>Tüm tarihler</button>
                <label className="text-sm text-slate-600 dark:text-slate-300">Arama kaynağı<select aria-label="Arama kaynağı" value={source} onChange={e => setSource(e.target.value)} className="block mt-1 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-2"><option value="all">Tüm kaynaklar</option><option value="fsbo">FSBO</option><option value="follow_up">Takip aramaları</option><option value="list">Liste aramaları</option><option value="other">Diğer CRM aktiviteleri</option></select></label>
                <button className="text-sm text-sky-700 dark:text-sky-300 underline" onClick={() => setRefresh(value => value + 1)}>Yenile</button>
                {!loading && !error && <span className="text-sm text-slate-500">{count} aktivite</span>}
            </div>
            {loading && <p role="status" className="text-slate-500">Aktiviteler yükleniyor…</p>}
            {error && <p role="alert" className="text-red-600">{error}</p>}
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
                                <span className="text-xs text-gray-400 dark:text-slate-500 ml-auto md:ml-2 block md:inline">{activity.date}{activity.time ? ` · ${activity.time}` : ''}</span>
                            </div>

                            <EntityTags type="activity" id={activity.id} editable/>
                            {activity.prospecting_event_id && <p className="text-sm text-sky-700 dark:text-sky-300 mb-2">{activity.prospecting_source_kind === 'fsbo' ? 'FSBO' : activity.prospecting_source_kind === 'list' ? 'Liste araması' : 'Manuel takip'} · {activity.prospecting_is_follow_up ? 'Takip araması' : 'İlk arama'}</p>}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mb-3 text-sm">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-gray-500 dark:text-slate-400">Müşteri:</span>
                                    {activity.customerId ? <Link to={`/customers/${activity.customerId}`} className="font-medium text-[#1193d4] hover:underline">{activity.customerName}</Link> : <span className="font-medium text-slate-800 dark:text-white">{activity.customerName}</span>}
                                </div>
                                {activity.propertyTitle && (
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-gray-500 dark:text-slate-400">Emlak:</span>
                                        {activity.propertyId ? <Link to={`/properties/${activity.propertyId}`} className="font-medium text-sky-700 dark:text-sky-300">{activity.propertyTitle}</Link> : <span>{activity.propertyTitle}</span>}
                                    </div>
                                )}
                            </div>

                            <p className="text-gray-600 dark:text-slate-300 text-sm bg-gray-50 dark:bg-slate-700 p-3 rounded-lg border border-gray-100 dark:border-slate-600">
                                {activity.description}
                            </p>
                            <div className="mt-2"><ActivityListingLink url={activity.external_listing_url} /></div>
                        </div>

                        <div className="self-start md:self-center min-w-[100px] flex flex-col items-end gap-2">
                            {activity.prospecting_outcome ? <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700">{CALL_OUTCOME_LABELS[activity.prospecting_outcome]}</span> : getStatusBadge(activity.status)}
                            {!activity.prospecting_case_id && ['Giden Arama', 'Gelen Arama'].includes(activity.type) && <Link to={`/prospecting?activity=${encodeURIComponent(activity.id)}`} className="text-sm font-medium text-sky-700 dark:text-sky-300 hover:underline">Portföy takibine al</Link>}
                            {activity.prospecting_case_id ? <Link to={`/prospecting?case=${encodeURIComponent(activity.prospecting_case_id)}`} className="text-sm font-medium text-sky-700 dark:text-sky-300 hover:underline">Takip kartını aç</Link> : <div className="flex items-center gap-3">
                                <Link to={`/activities/edit/${activity.id}`} className="text-sm font-medium text-[#1193d4] hover:underline">
                                    Düzenle
                                </Link>
                                <button
                                    onClick={() => handleDelete(activity.id)}
                                    className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline"
                                >
                                    Sil
                                </button>
                            </div>}
                        </div>
                    </div>
                ))}

                {!loading && !error && filteredActivities.length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-slate-400">
                        <p>Aradığınız kriterlere uygun aktivite bulunamadı.</p>
                    </div>
                )}

                {/* Load More Button */}
                {!loading && !error && filteredActivities.length > 0 && (
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
