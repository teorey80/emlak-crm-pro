import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, ArrowUpDown, X } from 'lucide-react';
import { useData } from '../context/DataContext';

const PropertyList: React.FC = () => {
    const { properties, session, userProfile, teamMembers, hasMoreProperties, loadMoreProperties, loadingMore } = useData();

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Tümü'); // Satılık/Kiralık
    const [listingStatusFilter, setListingStatusFilter] = useState('Aktif'); // NEW: Aktif/Pasif/Satıldı/Kiralandı
    const [typeFilter, setTypeFilter] = useState('Tümü');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [sortOrder, setSortOrder] = useState('dateDesc');
    const [viewScope, setViewScope] = useState<'all' | 'mine'>('all');

    // Derived state for filtered and sorted properties
    const filteredAndSortedProperties = useMemo(() => {
        return properties
            .filter(property => {
                // Scope Filter
                if (viewScope === 'mine' && property.user_id !== session?.user.id) {
                    return false;
                }

                // Text Search (Title or Location)
                const searchLower = searchTerm.toLowerCase();
                const matchesSearch =
                    property.title.toLowerCase().includes(searchLower) ||
                    property.location.toLowerCase().includes(searchLower);

                // Status Filter
                const matchesStatus = statusFilter === 'Tümü' || property.status === statusFilter;

                // Type Filter
                const matchesType = typeFilter === 'Tümü' || property.type === typeFilter;

                // Listing Status Filter (NEW)
                const propListingStatus = property.listing_status || property.listingStatus || 'Aktif';
                const matchesListingStatus = listingStatusFilter === 'Tümü' || propListingStatus === listingStatusFilter;

                // Price Range Filter
                const price = property.price;
                const min = minPrice ? parseFloat(minPrice) : 0;
                const max = maxPrice ? parseFloat(maxPrice) : Infinity;
                const matchesPrice = price >= min && price <= max;

                return matchesSearch && matchesStatus && matchesType && matchesListingStatus && matchesPrice;
            })
            .sort((a, b) => {
                switch (sortOrder) {
                    case 'priceAsc':
                        return a.price - b.price;
                    case 'priceDesc':
                        return b.price - a.price;
                    case 'dateAsc':
                        return (a.listingDate || '').localeCompare(b.listingDate || '');
                    case 'dateDesc':
                    default:
                        // If listingDate is missing, fallback to ID or stay neutral, usually ID implies recency in mock data
                        return (b.listingDate || '').localeCompare(a.listingDate || '');
                }
            });
    }, [properties, searchTerm, statusFilter, listingStatusFilter, typeFilter, minPrice, maxPrice, sortOrder, viewScope, session?.user.id]);

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('Tümü');
        setListingStatusFilter('Aktif'); // Reset to Aktif
        setTypeFilter('Tümü');
        setMinPrice('');
        setMaxPrice('');
        setSortOrder('dateDesc');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Mevcut Emlaklar</h2>
                    <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Toplam {filteredAndSortedProperties.length} ilan listeleniyor</p>
                </div>
                <Link
                    to="/properties/new"
                    className="flex items-center gap-2 bg-[#1193d4] text-white px-4 py-2.5 rounded-lg hover:opacity-90 transition-all shadow-sm font-medium">
                    <Plus className="w-4 h-4" />
                    Yeni Emlak Ekle
                </Link>
            </div>

            {/* Advanced Filters Bar */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm space-y-4 transition-colors">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold mb-2">
                    <Filter className="w-4 h-4" />
                    <span>Filtreleme Seçenekleri</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    {/* Search & Scope */}
                    <div className="lg:col-span-1 space-y-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="İlan başlığı veya konum..."
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900 focus:border-[#1193d4]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border-2 border-indigo-100 dark:border-slate-600 rounded-lg text-sm font-medium text-indigo-700 dark:text-indigo-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                            value={viewScope}
                            onChange={(e) => setViewScope(e.target.value as 'all' | 'mine')}
                        >
                            <option value="all">🏢 Tüm Ofis İlanları</option>
                            <option value="mine">👤 Sadece Benim İlanlarım</option>
                        </select>
                    </div>

                    {/* Status & Type & Listing Status */}
                    <div className="grid grid-cols-3 gap-4">
                        {/* Listing Status - NEW */}
                        <select
                            className="w-full px-3 py-2.5 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-lg text-sm font-medium text-amber-700 dark:text-amber-300 focus:outline-none hover:bg-amber-100 dark:hover:bg-amber-900/40 cursor-pointer"
                            value={listingStatusFilter}
                            onChange={(e) => setListingStatusFilter(e.target.value)}
                        >
                            <option value="Aktif">✅ Aktif İlanlar</option>
                            <option value="Pasif">⏸️ Pasif İlanlar</option>
                            <option value="Satıldı">✅ Satılanlar</option>
                            <option value="Kiralandı">🏠 Kiralananlar</option>
                            <option value="Tümü">📊 Tüm Durumlar</option>
                        </select>
                        {/* Sale/Rent Type */}
                        <select
                            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none hover:bg-gray-100 dark:hover:bg-slate-600 cursor-pointer"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="Tümü">Tüm Tipler</option>
                            <option value="Satılık">Satılık</option>
                            <option value="Kiralık">Kiralık</option>
                        </select>
                        {/* Property Type */}
                        <select
                            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none hover:bg-gray-100 dark:hover:bg-slate-600 cursor-pointer"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            <option value="Tümü">Tüm Kategoriler</option>
                            <option value="Daire">Daire</option>
                            <option value="Villa">Villa</option>
                            <option value="Ofis">Ofis</option>
                            <option value="İşyeri">İşyeri</option>
                            <option value="Arsa">Arsa</option>
                        </select>
                    </div>

                    {/* Price Range */}
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            placeholder="Min TL"
                            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900 focus:border-[#1193d4]"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                        />
                        <span className="text-gray-400">-</span>
                        <input
                            type="number"
                            placeholder="Max TL"
                            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900 focus:border-[#1193d4]"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                        />
                    </div>

                    {/* Sort & Clear */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 w-3 h-3" />
                            <select
                                className="w-full pl-8 pr-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none hover:bg-gray-100 dark:hover:bg-slate-600 cursor-pointer appearance-none"
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                            >
                                <option value="dateDesc">En Yeni</option>
                                <option value="dateAsc">En Eski</option>
                                <option value="priceAsc">Fiyat (Artan)</option>
                                <option value="priceDesc">Fiyat (Azalan)</option>
                            </select>
                        </div>
                        {(searchTerm || statusFilter !== 'Tümü' || listingStatusFilter !== 'Aktif' || typeFilter !== 'Tümü' || minPrice || maxPrice) && (
                            <button
                                onClick={clearFilters}
                                className="px-3 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                title="Filtreleri Temizle"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table/List */}
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden transition-colors">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700 text-gray-500 dark:text-slate-400 uppercase text-xs font-semibold">
                            <tr>
                                <th className="p-4">Resim</th>
                                <th className="p-4">Adres / Başlık</th>
                                <th className="p-4">Tip</th>
                                <th className="p-4">Fiyat</th>
                                <th className="p-4">Durum</th>
                                <th className="p-4">İlan Sahibi</th>
                                <th className="p-4 text-right">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                            {filteredAndSortedProperties.length > 0 ? (
                                filteredAndSortedProperties.map((property) => {
                                    // Find Owner Profile
                                    const owner = teamMembers.find(m => m.id === property.user_id) || (property.user_id === session?.user.id ? userProfile : null);

                                    return (
                                        <tr key={property.id} className="hover:bg-sky-50/50 dark:hover:bg-slate-700/50 transition-colors group">
                                            <td className="p-4">
                                                <Link to={`/properties/${property.id}`}>
                                                    <img src={property.images[0]} alt={property.title} className="w-16 h-16 object-cover rounded-lg border border-gray-100 dark:border-slate-600 hover:opacity-80 transition-opacity" />
                                                </Link>
                                            </td>
                                            <td className="p-4">
                                                <Link to={`/properties/${property.id}`} className="font-semibold text-slate-800 dark:text-slate-200 hover:text-[#1193d4] block mb-1">
                                                    {property.title}
                                                </Link>
                                                <span className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
                                                    {property.location}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-600 dark:text-slate-400">{property.type}</td>
                                            <td className="p-4 font-medium text-slate-700 dark:text-slate-300">
                                                {property.price.toLocaleString('tr-TR')} {property.currency}
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${property.status === 'Satılık'
                                                    ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300'
                                                    : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                                    }`}>
                                                    {property.status}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <img
                                                        src={owner?.avatar || `https://ui-avatars.com/api/?name=${owner?.name || 'Danışman'}`}
                                                        className="w-8 h-8 rounded-full border border-gray-200"
                                                        title={owner?.name || 'Danışman'}
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{owner?.name || 'Danışman'}</span>
                                                        <span className="text-[10px] text-gray-400">{owner?.title || 'Emlakçı'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <Link to={`/properties/${property.id}`} className="text-gray-600 hover:text-[#1193d4] dark:text-slate-400 dark:hover:text-white font-medium text-sm">Detay</Link>
                                                    {(property.user_id === session?.user.id || userProfile?.role === 'broker') && (
                                                        <>
                                                            <span className="text-gray-300 dark:text-slate-600">|</span>
                                                            <Link to={`/properties/edit/${property.id}`} className="text-[#1193d4] hover:text-sky-800 dark:hover:text-sky-300 font-medium text-sm">Düzenle</Link>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="p-10 text-center text-gray-500 dark:text-slate-400">
                                        Aradığınız kriterlere uygun emlak bulunamadı.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {filteredAndSortedProperties.length > 0 && (
                    <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex justify-center items-center">
                        {hasMoreProperties ? (
                            <button
                                onClick={loadMoreProperties}
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
                                Tüm ilanlar yüklendi ({properties.length} ilan)
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PropertyList;