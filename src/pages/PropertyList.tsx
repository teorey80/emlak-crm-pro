import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter, ArrowUpDown, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useData } from '../context/DataContext';

// Sortable column type
type SortColumn = 'title' | 'type' | 'price' | 'status' | 'owner' | null;
type SortDirection = 'asc' | 'desc';

const PropertyList: React.FC = () => {
    const { properties, session, userProfile, teamMembers, hasMoreProperties, loadMoreProperties, loadingMore } = useData();
    const [searchParams, setSearchParams] = useSearchParams();

    // Filter States - Initialize from URL params
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'Tümü'); // Satılık/Kiralık
    const [listingStatusFilter, setListingStatusFilter] = useState(searchParams.get('listing_status') || 'Tümü'); // Aktif/Pasif/Satıldı/Kiralandı
    const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'Tümü');
    const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
    const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');
    const [sortOrder, setSortOrder] = useState('dateDesc');
    const [viewScope, setViewScope] = useState<'all' | 'mine'>((searchParams.get('scope') as 'all' | 'mine') || 'all');
    const [cityFilter, setCityFilter] = useState(searchParams.get('city') || '');

    // Update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams();
        if (searchTerm) params.set('search', searchTerm);
        if (statusFilter !== 'Tümü') params.set('status', statusFilter);
        if (listingStatusFilter !== 'Tümü') params.set('listing_status', listingStatusFilter);
        if (typeFilter !== 'Tümü') params.set('type', typeFilter);
        if (minPrice) params.set('min_price', minPrice);
        if (maxPrice) params.set('max_price', maxPrice);
        if (viewScope !== 'all') params.set('scope', viewScope);
        if (cityFilter) params.set('city', cityFilter);

        setSearchParams(params, { replace: true });
    }, [searchTerm, statusFilter, listingStatusFilter, typeFilter, minPrice, maxPrice, viewScope, cityFilter]);

    // Column sorting state
    const [sortColumn, setSortColumn] = useState<SortColumn>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    // Handle column header click
    const handleSort = (column: SortColumn) => {
        if (sortColumn === column) {
            // Toggle direction if same column
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            // Set new column and reset to ascending
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    // Sortable header component
    const SortableHeader: React.FC<{ column: SortColumn; label: string; className?: string }> = ({ column, label, className = '' }) => (
        <th
            className={`p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors select-none ${className}`}
            onClick={() => handleSort(column)}
        >
            <div className="flex items-center gap-1">
                <span>{label}</span>
                <span className="flex flex-col">
                    <ChevronUp className={`w-3 h-3 -mb-1 ${sortColumn === column && sortDirection === 'asc' ? 'text-[#1193d4]' : 'text-gray-300 dark:text-slate-500'}`} />
                    <ChevronDown className={`w-3 h-3 ${sortColumn === column && sortDirection === 'desc' ? 'text-[#1193d4]' : 'text-gray-300 dark:text-slate-500'}`} />
                </span>
            </div>
        </th>
    );

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

                // City Filter
                const matchesCity = !cityFilter ||
                    property.city?.toLowerCase().includes(cityFilter.toLowerCase()) ||
                    property.location?.toLowerCase().includes(cityFilter.toLowerCase());

                return matchesSearch && matchesStatus && matchesType && matchesListingStatus && matchesPrice && matchesCity;
            })
            .sort((a, b) => {
                // Column-based sorting takes priority
                if (sortColumn) {
                    const multiplier = sortDirection === 'asc' ? 1 : -1;
                    switch (sortColumn) {
                        case 'title':
                            return multiplier * a.title.localeCompare(b.title, 'tr');
                        case 'type':
                            return multiplier * (a.type || '').localeCompare(b.type || '', 'tr');
                        case 'price':
                            return multiplier * (a.price - b.price);
                        case 'status':
                            return multiplier * (a.status || '').localeCompare(b.status || '', 'tr');
                        case 'owner':
                            const ownerA = teamMembers.find(m => m.id === a.user_id)?.name || '';
                            const ownerB = teamMembers.find(m => m.id === b.user_id)?.name || '';
                            return multiplier * ownerA.localeCompare(ownerB, 'tr');
                    }
                }

                // Fallback to dropdown sort order
                switch (sortOrder) {
                    case 'priceAsc':
                        return a.price - b.price;
                    case 'priceDesc':
                        return b.price - a.price;
                    case 'dateAsc':
                        return (a.listingDate || '').localeCompare(b.listingDate || '');
                    case 'dateDesc':
                    default:
                        return (b.listingDate || '').localeCompare(a.listingDate || '');
                }
            });
    }, [properties, searchTerm, statusFilter, listingStatusFilter, typeFilter, minPrice, maxPrice, sortOrder, viewScope, session?.user.id, sortColumn, sortDirection, teamMembers, cityFilter]);

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('Tümü');
        setListingStatusFilter('Tümü'); // Reset to Tümü
        setTypeFilter('Tümü');
        setMinPrice('');
        setMaxPrice('');
        setCityFilter('');
        setSortOrder('dateDesc');
        setSortColumn(null);
        setSortDirection('asc');
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
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm transition-colors">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
                        <Filter className="w-4 h-4" />
                        <span>Filtreleme Seçenekleri</span>
                    </div>
                    {(searchTerm || statusFilter !== 'Tümü' || listingStatusFilter !== 'Tümü' || typeFilter !== 'Tümü' || minPrice || maxPrice || cityFilter) && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-sm font-medium"
                        >
                            <X className="w-3.5 h-3.5" />
                            Temizle
                        </button>
                    )}
                </div>

                {/* Row 1: Search + View Scope */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                    <div className="md:col-span-3 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="İlan başlığı veya konum ara..."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900 focus:border-[#1193d4]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="w-full px-3 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg text-sm font-medium text-indigo-700 dark:text-indigo-300 focus:outline-none cursor-pointer"
                        value={viewScope}
                        onChange={(e) => setViewScope(e.target.value as 'all' | 'mine')}
                    >
                        <option value="all">Tüm Ofis İlanları</option>
                        <option value="mine">Sadece Benim İlanlarım</option>
                    </select>
                </div>

                {/* Row 2: Filters */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {/* Listing Status */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">İlan Durumu</label>
                        <select
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none cursor-pointer"
                            value={listingStatusFilter}
                            onChange={(e) => setListingStatusFilter(e.target.value)}
                        >
                            <option value="Aktif">Aktif</option>
                            <option value="Pasif">Pasif</option>
                            <option value="Kapora Alındı">Kapora Alındı</option>
                            <option value="Satıldı">Satıldı</option>
                            <option value="Kiralandı">Kiralandı</option>
                            <option value="Tümü">Tümü</option>
                        </select>
                    </div>

                    {/* Sale/Rent Type */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Satılık/Kiralık</label>
                        <select
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none cursor-pointer"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="Tümü">Tümü</option>
                            <option value="Satılık">Satılık</option>
                            <option value="Kiralık">Kiralık</option>
                        </select>
                    </div>

                    {/* Property Type */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Emlak Tipi</label>
                        <select
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none cursor-pointer"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            <option value="Tümü">Tümü</option>
                            <option value="Daire">Daire</option>
                            <option value="Villa">Villa</option>
                            <option value="Ofis">Ofis</option>
                            <option value="İşyeri">İşyeri</option>
                            <option value="Arsa">Arsa</option>
                        </select>
                    </div>

                    {/* Min Price */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Min Fiyat</label>
                        <input
                            type="number"
                            placeholder="0 TL"
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:border-[#1193d4]"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                        />
                    </div>

                    {/* Max Price */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Max Fiyat</label>
                        <input
                            type="number"
                            placeholder="∞ TL"
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:border-[#1193d4]"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                        />
                    </div>

                    {/* City Filter */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Şehir</label>
                        <input
                            type="text"
                            placeholder="İstanbul, Ankara..."
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:border-[#1193d4]"
                            value={cityFilter}
                            onChange={(e) => setCityFilter(e.target.value)}
                        />
                    </div>

                    {/* Sort Order */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Sıralama</label>
                        <select
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none cursor-pointer"
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                        >
                            <option value="dateDesc">En Yeni</option>
                            <option value="dateAsc">En Eski</option>
                            <option value="priceAsc">Fiyat (Artan)</option>
                            <option value="priceDesc">Fiyat (Azalan)</option>
                        </select>
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
                                <SortableHeader column="title" label="Adres / Başlık" />
                                <SortableHeader column="type" label="Tip" />
                                <SortableHeader column="price" label="Fiyat" />
                                <SortableHeader column="status" label="Durum" />
                                <SortableHeader column="owner" label="İlan Sahibi" />
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
                                                    <img src={property.images?.[0] || 'https://via.placeholder.com/120x120?text=No+Image'} alt={property.title} className="w-16 h-16 object-cover rounded-lg border border-gray-100 dark:border-slate-600 hover:opacity-80 transition-opacity" />
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
                                                {(() => {
                                                    const finalStatus = property.listingStatus || property.listing_status || property.status || 'Aktif';
                                                    let badgeClass = 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300';

                                                    if (finalStatus === 'Satıldı') {
                                                        badgeClass = 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
                                                    } else if (finalStatus === 'Kiralandı') {
                                                        badgeClass = 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
                                                    } else if (finalStatus === 'Kapora Alındı') {
                                                        badgeClass = 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';
                                                    } else if (finalStatus === 'Pasif') {
                                                        badgeClass = 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
                                                    } else if (property.status === 'Kiralık') {
                                                        badgeClass = 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300';
                                                    }

                                                    return (
                                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${badgeClass}`}>
                                                            {finalStatus === 'Aktif' ? property.status : finalStatus}
                                                        </span>
                                                    );
                                                })()}
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
