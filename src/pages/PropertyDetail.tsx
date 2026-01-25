import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, Maximize, Bed, Bath, Thermometer, ArrowLeft, Edit, Share2, Clock, DollarSign, FileCheck, Layout, User, Map, SearchCheck, TrendingUp, Eye, Phone, Calendar, Activity, Target, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useData } from '../context/DataContext';
import SaleForm from '../components/SaleForm';
import DocumentManager from '../components/DocumentManager';
import { Sale } from '../types';

const PropertyDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { properties, activities, requests, session, userProfile, teamMembers, customers, updateProperty, addSale } = useData();
    const property = properties.find(p => p.id === id);
    const [showSaleForm, setShowSaleForm] = useState(false);

    // Privacy Check
    const isOwner = session?.user?.id === property?.user_id || userProfile?.role === 'broker';

    if (!property) {
        return <div className="p-10 text-center text-gray-500 dark:text-slate-400">İlan bulunamadı.</div>;
    }

    // Filter activities related to this property
    const propertyActivities = activities.filter(a => a.propertyId === id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate Performance Metrics
    const calculatePerformanceMetrics = () => {
        const now = new Date();
        const listingDate = property?.listingDate ? new Date(property.listingDate) : now;
        const daysOnMarket = Math.floor((now.getTime() - listingDate.getTime()) / (1000 * 60 * 60 * 24));

        // Count activity types
        const showings = propertyActivities.filter(a => a.type === 'Yer Gösterimi').length;
        const calls = propertyActivities.filter(a => a.type === 'Gelen Arama' || a.type === 'Giden Arama').length;
        const totalActivities = propertyActivities.length;

        // Calculate positive/negative ratio
        const positiveActivities = propertyActivities.filter(a => a.status === 'Olumlu').length;
        const negativeActivities = propertyActivities.filter(a => a.status === 'Olumsuz').length;

        // Interest score (0-100)
        let interestScore = 0;
        if (totalActivities > 0) {
            const activityScore = Math.min(totalActivities * 10, 40); // Max 40 points
            const showingScore = Math.min(showings * 15, 30); // Max 30 points
            const positiveRatio = totalActivities > 0 ? (positiveActivities / totalActivities) * 30 : 0; // Max 30 points
            interestScore = Math.round(activityScore + showingScore + positiveRatio);
        }

        // Last activity date
        const lastActivity = propertyActivities[0]?.date || null;

        // Price per sqm
        const pricePerSqm = property?.area ? Math.round(property.price / property.area) : 0;

        return {
            daysOnMarket,
            showings,
            calls,
            totalActivities,
            positiveActivities,
            negativeActivities,
            interestScore,
            lastActivity,
            pricePerSqm
        };
    };

    const metrics = property ? calculatePerformanceMetrics() : null;

    // Find matching requests
    const matchingRequests = requests.filter(req => {
        // Basic matching logic
        const matchType = req.type === property.type;
        const matchPrice = property.price >= req.minPrice && property.price <= req.maxPrice;
        const matchCity = req.city === property.city;
        const matchDistrict = req.district === 'Tümü' || req.district === property.district;

        return matchType && matchPrice && matchCity && matchDistrict;
    });

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Breadcrumb & Back */}
            <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 transition-colors text-sm mb-2">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Listeye Dön
            </button>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Main Content Left Column */}
                <div className="flex-1 space-y-6">
                    {/* Header Info */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{property.title}</h1>
                                <div className="flex items-center text-gray-500 dark:text-slate-400 mt-1">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    {property.location}
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400 dark:text-slate-500">Emlak ID: {property.id}</p>
                                <p className="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-1">
                                    {property.price.toLocaleString('tr-TR')} ₺
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Images Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-96">
                        <div className="md:col-span-2 h-64 md:h-full relative group cursor-pointer overflow-hidden rounded-2xl">
                            <img src={property.images[0]} alt="Main" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs backdrop-blur-sm flex items-center">
                                <Maximize className="w-3 h-3 mr-1" />
                                Tüm Fotoğraflar ({property.images.length})
                            </div>
                        </div>
                        {property.images.slice(1).map((img, idx) => (
                            <div key={idx} className="hidden md:block h-full relative rounded-2xl overflow-hidden">
                                <img src={img} alt="Sub" className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>

                    {/* Matching Requests Section - NEW */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-indigo-100 dark:border-indigo-900/50 bg-gradient-to-r from-white to-indigo-50/30 dark:from-slate-800 dark:to-indigo-900/20 transition-colors">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="bg-indigo-600 p-1.5 rounded-lg">
                                <SearchCheck className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Eşleşen Müşteri Talepleri ({matchingRequests.length})</h3>
                        </div>

                        {matchingRequests.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {matchingRequests.map(req => (
                                    <div key={req.id} className="bg-white dark:bg-slate-700/50 border border-indigo-100 dark:border-slate-600 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm hover:shadow-md transition-all">
                                        <div>
                                            <h4 className="font-bold text-slate-800 dark:text-white">{req.customerName}</h4>
                                            <p className="text-sm text-gray-500 dark:text-slate-300">{req.type} • {req.minPrice.toLocaleString()} - {req.maxPrice.toLocaleString()} {req.currency}</p>
                                            <p className="text-xs text-gray-400 dark:text-slate-400 mt-1">Not: {req.notes}</p>
                                        </div>
                                        <Link to={`/requests/${req.id}`} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
                                            Talebi İncele
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 dark:text-slate-400 text-sm italic">Bu ilanla eşleşen bir müşteri talebi bulunamadı.</p>
                        )}
                    </div>

                    {/* General Info Grid */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-gray-100 dark:border-slate-700 pb-2">Genel Bilgiler</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            <div>
                                <span className="text-xs text-gray-400 dark:text-slate-500 block mb-1">Emlak Tipi</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-200">{property.type}</span>
                            </div>
                            <div>
                                <span className="text-xs text-gray-400 dark:text-slate-500 block mb-1">Konum</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-200">{property.location}</span>
                            </div>
                            <div>
                                <span className="text-xs text-gray-400 dark:text-slate-500 block mb-1">Oda Sayısı</span>
                                <div className="flex items-center gap-2">
                                    <Bed className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{property.rooms}</span>
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-gray-400 dark:text-slate-500 block mb-1">Metrekare</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-200">{property.area} m²</span>
                            </div>
                            <div>
                                <span className="text-xs text-gray-400 dark:text-slate-500 block mb-1">Isıtma Tipi</span>
                                <div className="flex items-center gap-2">
                                    <Thermometer className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{property.heating}</span>
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-gray-400 dark:text-slate-500 block mb-1">Banyo Sayısı</span>
                                <div className="flex items-center gap-2">
                                    <Bath className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{property.bathrooms}</span>
                                </div>
                            </div>
                        </div>

                        {property.site && (
                            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-700">
                                <span className="text-xs text-gray-400 dark:text-slate-500 block mb-2">Site</span>
                                <div className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 p-3 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 flex justify-between items-center">
                                    {property.site}
                                    <button className="text-sky-600 dark:text-sky-400 text-xs hover:underline">Site Detayları</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Map Placeholder */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Konum</h3>
                        <div className="w-full h-64 bg-blue-50 dark:bg-slate-700 rounded-xl flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 opacity-20 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/Istanbul_map.png')] bg-cover bg-center"></div>
                            <div className="z-10 flex flex-col items-center">
                                <MapPin className="w-10 h-10 text-red-500 drop-shadow-lg animate-bounce" />
                                <span className="text-xs font-bold text-slate-600 bg-white dark:bg-slate-800 dark:text-slate-200 px-2 py-1 rounded shadow mt-1">{property.location}</span>
                            </div>
                        </div>
                    </div>

                    {/* Property History (Activity & Timeline) */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">İlan Geçmişi ve Aktiviteler</h3>
                        <ol className="relative border-l border-gray-200 dark:border-slate-700 ml-3">
                            {/* Activities related to this property */}
                            {propertyActivities.map((activity) => (
                                <li key={activity.id} className="mb-8 ml-6">
                                    <span className="absolute flex items-center justify-center w-8 h-8 bg-sky-100 dark:bg-sky-900/50 rounded-full -left-4 ring-4 ring-white dark:ring-slate-800 text-sky-600 dark:text-sky-400">
                                        <User className="w-4 h-4" />
                                    </span>
                                    <div className="p-4 bg-white dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-lg shadow-sm hover:bg-sky-50/20 dark:hover:bg-sky-900/10 transition-colors">
                                        <div className="flex justify-between mb-1">
                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-200">{activity.type} - {activity.customerName}</h4>
                                            <time className="text-xs text-gray-400 dark:text-slate-500">{activity.date}</time>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-slate-400 italic">"{activity.description}"</p>
                                        <div className="mt-2">
                                            <span className={`text-xs px-2 py-0.5 rounded border ${activity.status === 'Olumlu' ? 'bg-green-50 dark:bg-green-900/30 border-green-100 dark:border-green-800 text-green-700 dark:text-green-400' :
                                                activity.status === 'Olumsuz' ? 'bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-800 text-red-700 dark:text-red-400' :
                                                    'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-100 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400'
                                                }`}>
                                                Müşteri Görüşü: {activity.status}
                                            </span>
                                        </div>
                                    </div>
                                </li>
                            ))}

                            {/* Standard System Events */}
                            <li className="mb-8 ml-6">
                                <span className="absolute flex items-center justify-center w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-full -left-4 ring-4 ring-white dark:ring-slate-800 text-indigo-600 dark:text-indigo-400">
                                    <Layout className="w-4 h-4" />
                                </span>
                                <div className="p-4 bg-white dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-lg shadow-sm">
                                    <div className="flex justify-between mb-1">
                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-200">İlan Yayına Alındı</h4>
                                        <time className="text-xs text-gray-400 dark:text-slate-500">2 Gün Önce</time>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-slate-400">Tüm platformlarda yayınlandı.</p>
                                </div>
                            </li>
                            <li className="ml-6">
                                <span className="absolute flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-slate-600 rounded-full -left-4 ring-4 ring-white dark:ring-slate-800 text-gray-600 dark:text-slate-300">
                                    <FileCheck className="w-4 h-4" />
                                </span>
                                <div className="p-4 bg-white dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-lg shadow-sm">
                                    <div className="flex justify-between mb-1">
                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-200">Portföy Oluşturuldu</h4>
                                        <time className="text-xs text-gray-400 dark:text-slate-500">{property.listingDate || "2024-01-01"}</time>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-slate-400">İlan taslağı sisteme kaydedildi.</p>
                                </div>
                            </li>
                        </ol>
                    </div>

                    {/* Documents Section */}
                    {isOwner && (
                        <DocumentManager
                            entityType="property"
                            entityId={property.id}
                            entityName={property.title}
                        />
                    )}
                </div>

                {/* Actions Sidebar Right Column */}
                <div className="w-full lg:w-80 space-y-4">
                    {/* Performance Panel */}
                    {metrics && (
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-indigo-900/20 p-5 rounded-2xl shadow-sm border border-indigo-100 dark:border-indigo-900/50">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="bg-indigo-600 p-1.5 rounded-lg">
                                    <BarChart3 className="w-4 h-4 text-white" />
                                </div>
                                <h3 className="font-bold text-slate-800 dark:text-white">Portfoy Performansi</h3>
                            </div>

                            {/* Interest Score */}
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-gray-500 dark:text-slate-400">Ilgi Skoru</span>
                                    <span className={`text-sm font-bold ${metrics.interestScore >= 70 ? 'text-green-600' : metrics.interestScore >= 40 ? 'text-yellow-600' : 'text-red-500'}`}>
                                        {metrics.interestScore}/100
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all ${metrics.interestScore >= 70 ? 'bg-green-500' : metrics.interestScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                        style={{ width: `${metrics.interestScore}%` }}
                                    />
                                </div>
                            </div>

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                        <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Piyasada</span>
                                    </div>
                                    <p className="text-lg font-bold text-slate-800 dark:text-white">{metrics.daysOnMarket} <span className="text-xs font-normal text-gray-400">gun</span></p>
                                </div>

                                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Eye className="w-3.5 h-3.5 text-purple-500" />
                                        <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Gosterim</span>
                                    </div>
                                    <p className="text-lg font-bold text-slate-800 dark:text-white">{metrics.showings}</p>
                                </div>

                                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Phone className="w-3.5 h-3.5 text-green-500" />
                                        <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Arama</span>
                                    </div>
                                    <p className="text-lg font-bold text-slate-800 dark:text-white">{metrics.calls}</p>
                                </div>

                                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Activity className="w-3.5 h-3.5 text-orange-500" />
                                        <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Aktivite</span>
                                    </div>
                                    <p className="text-lg font-bold text-slate-800 dark:text-white">{metrics.totalActivities}</p>
                                </div>
                            </div>

                            {/* Activity Summary */}
                            <div className="mt-3 pt-3 border-t border-indigo-100 dark:border-slate-700">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500 dark:text-slate-400">
                                        <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                                        Olumlu: {metrics.positiveActivities}
                                    </span>
                                    <span className="text-gray-500 dark:text-slate-400">
                                        <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"></span>
                                        Olumsuz: {metrics.negativeActivities}
                                    </span>
                                </div>
                            </div>

                            {/* Price per sqm */}
                            <div className="mt-3 pt-3 border-t border-indigo-100 dark:border-slate-700 flex justify-between items-center">
                                <span className="text-xs text-gray-500 dark:text-slate-400">m² Birim Fiyat</span>
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                    {metrics.pricePerSqm.toLocaleString('tr-TR')} TL/m²
                                </span>
                            </div>

                            {/* Last Activity */}
                            {metrics.lastActivity && (
                                <div className="mt-2 flex justify-between items-center text-xs">
                                    <span className="text-gray-500 dark:text-slate-400">Son Aktivite</span>
                                    <span className="text-gray-600 dark:text-slate-300">
                                        {new Date(metrics.lastActivity).toLocaleDateString('tr-TR')}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 sticky top-24 transition-colors">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4">Aksiyonlar</h3>
                        <div className="space-y-3">
                            <Link to="/activities/new" className="w-full bg-sky-600 text-white py-3 rounded-xl font-medium hover:bg-sky-700 transition-colors flex items-center justify-center gap-2 shadow-sm">
                                <Map className="w-4 h-4" />
                                Yer Gösterimi Ekle
                            </Link>
                            {isOwner ? (
                                <>
                                    <Link to={`/properties/edit/${id}`} className="w-full bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 py-3 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2">
                                        <Edit className="w-4 h-4" />
                                        Emlağı Düzenle
                                    </Link>
                                    <button
                                        onClick={() => setShowSaleForm(true)}
                                        className="w-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 py-3 rounded-xl font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors border border-emerald-100 dark:border-emerald-900/50"
                                    >
                                        <DollarSign className="w-4 h-4 inline-block mr-1" />
                                        Satış Yapıldı Olarak İşaretle
                                    </button>
                                </>
                            ) : (
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-xl text-sm border border-blue-100 dark:border-blue-900">
                                    <p className="font-bold mb-1">Ofis İlanı</p>
                                    <p>Bu ilan ofis portföyündedir. Detaylı bilgi için ilgili danışman ile görüşünüz.</p>
                                </div>
                            )}
                            <button className="w-full border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 py-3 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                                <Share2 className="w-4 h-4" />
                                Paylaş
                            </button>
                        </div>

                        <div className="mt-8 border-t border-gray-100 dark:border-slate-700 pt-4">
                            <h4 className="text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">İlgili Danışman</h4>
                            <div className="flex items-center gap-3">
                                <img
                                    src={
                                        property.user_id === session?.user.id
                                            ? (userProfile.avatar || `https://ui-avatars.com/api/?name=${userProfile.name}`)
                                            : (teamMembers.find(m => m.id === property.user_id)?.avatar || `https://ui-avatars.com/api/?name=${teamMembers.find(m => m.id === property.user_id)?.name || 'Danışman'}`)
                                    }
                                    className="w-10 h-10 rounded-full"
                                    alt="Agent"
                                />
                                <div>
                                    <p className="text-sm font-medium text-slate-800 dark:text-white">
                                        {property.user_id === session?.user.id
                                            ? 'Siz (İlan Sahibi)'
                                            : (teamMembers.find(m => m.id === property.user_id)?.name || 'Ofis Danışmanı')}
                                    </p>
                                    {property.user_id === session?.user.id ? (
                                        <p className="text-xs text-green-600 font-bold mt-1">Yönetici/Sahip Yetkisi</p>
                                    ) : (
                                        <p className="text-xs text-gray-400 italic mt-1">İletişim için ofis içi görüşünüz</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Property Owner Info - ONLY VISIBLE TO OWNER/BROKER */}
                        {isOwner && (
                            <div className="mt-6 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900/50">
                                <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400 mb-2 flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Mal Sahibi Bilgileri
                                </h4>
                                <div className="text-sm text-amber-900 dark:text-amber-200">
                                    <p><span className="font-semibold">İsim:</span> {property.ownerName || 'Belirtilmemiş'}</p>
                                    {/* Try to find phone from linked customer if available */}
                                    {property.ownerId && customers.find(c => c.id === property.ownerId) && (
                                        <p><span className="font-semibold">Telefon:</span> {customers.find(c => c.id === property.ownerId)?.phone}</p>
                                    )}
                                    {!property.ownerId && <p className="text-xs italic mt-1 opacity-70">Müşteri kaydı eşleşmedi.</p>}
                                    <Link to={`/customers/${property.ownerId}`} className="text-xs text-amber-600 underline mt-2 block">Müşteri Kartına Git</Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* SaleForm Modal */}
            {showSaleForm && property && (
                <SaleForm
                    property={property}
                    onClose={() => setShowSaleForm(false)}
                    onSave={async (sale: Sale) => {
                        try {
                            // Save sale to database
                            await addSale(sale);

                            // Update property status to Satıldı
                            await updateProperty({
                                ...property,
                                listingStatus: 'Satıldı',
                                soldDate: sale.saleDate
                            });

                            setShowSaleForm(false);
                            toast.success('Satış başarıyla kaydedildi!');
                            navigate('/properties');
                        } catch (error) {
                            console.error('Satış kaydetme hatası:', error);
                            toast.error('Satış kaydedilemedi. Lütfen tekrar deneyin.');
                        }
                    }}
                />
            )}
        </div>
    );
};

export default PropertyDetail;