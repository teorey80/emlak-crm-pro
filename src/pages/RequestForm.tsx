import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Request } from '../types';

// Moved ALL_CITIES_DISTRICTS to a shared location usually, but redefining here for simplicity as it was in PropertyForm
// In a real app, this should be in a constants file.
const ALL_CITIES_DISTRICTS: Record<string, string[]> = {
    "İstanbul": ["Adalar", "Arnavutköy", "Ataşehir", "Avcılar", "Bağcılar", "Bahçelievler", "Bakırköy", "Başakşehir", "Bayrampaşa", "Beşiktaş", "Beykoz", "Beylikdüzü", "Beyoğlu", "Büyükçekmece", "Çatalca", "Çekmeköy", "Esenler", "Esenyurt", "Eyüpsultan", "Fatih", "Gaziosmanpaşa", "Güngören", "Kadıköy", "Kağıthane", "Kartal", "Küçükçekmece", "Maltepe", "Pendik", "Sancaktepe", "Sarıyer", "Silivri", "Sultanbeyli", "Sultangazi", "Şile", "Şişli", "Tuzla", "Ümraniye", "Üsküdar", "Zeytinburnu"],
    "Ankara": ["Akyurt", "Altındağ", "Ayaş", "Bala", "Beypazarı", "Çamlıdere", "Çankaya", "Çubuk", "Elmadağ", "Etimesgut", "Evren", "Gölbaşı", "Güdül", "Haymana", "Kahramankazan", "Kalecik", "Keçiören", "Kızılcahamam", "Mamak", "Nallıhan", "Polatlı", "Pursaklar", "Sincan", "Şereflikoçhisar", "Yenimahalle"],
    "İzmir": ["Aliağa", "Balçova", "Bayındır", "Bayraklı", "Bergama", "Beydağ", "Bornova", "Buca", "Çeşme", "Çiğli", "Dikili", "Foça", "Gaziemir", "Güzelbahçe", "Karabağlar", "Karaburun", "Karşıyaka", "Kemalpaşa", "Kınık", "Kiraz", "Konak", "Menderes", "Menemen", "Narlıdere", "Ödemiş", "Seferihisar", "Selçuk", "Tire", "Torbalı", "Urla"],
    "Antalya": ["Akseki", "Aksu", "Alanya", "Demre", "Döşemealtı", "Elmalı", "Finike", "Gazipaşa", "Gündoğmuş", "İbradı", "Kaş", "Kemer", "Kepez", "Konyaaltı", "Korkuteli", "Kumluca", "Manavgat", "Muratpaşa", "Serik"],
    "Bursa": ["Büyükorhan", "Gemlik", "Gürsu", "Harmancık", "İnegöl", "İznik", "Karacabey", "Keles", "Kestel", "Mudanya", "Mustafakemalpaşa", "Nilüfer", "Orhaneli", "Orhangazi", "Osmangazi", "Yenişehir", "Yıldırım"]
};

const RequestForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { customers, addRequest, updateRequest, requests, sites } = useData();

    const [formData, setFormData] = useState<Partial<Request>>({
        type: 'Daire',
        requestType: 'Satılık', // Default
        status: 'Aktif',
        minPrice: 0,
        maxPrice: 0,
        currency: 'TL',
        city: '',
        district: '',
        date: (() => {
            const d = new Date();
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        })(),
        notes: '',
        minRooms: '',
        siteId: ''
    });

    // Load for Edit
    useEffect(() => {
        if (id && requests.length > 0) {
            const existing = requests.find(r => r.id === id);
            if (existing) {
                setFormData(existing);
            }
        }
    }, [id, requests]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Allow submitting even if maxPrice isn't set, or set logic as needed. Removed strict block for better UX if desired, or keep it.
        // User asked for formatting fix, assuming stricter validation is fine but let's just warn.
        if (!formData.customerId || !formData.maxPrice) {
            alert("Lütfen müşteri ve bütçe bilgilerini giriniz.");
            return;
        }

        const selectedCustomer = customers.find(c => c.id === formData.customerId);
        const selectedSite = sites.find(s => s.id === formData.siteId);

        const requestData: Request = {
            id: id || `req-${Date.now()}`,
            customerId: formData.customerId,
            customerName: selectedCustomer?.name || 'Bilinmeyen',
            type: formData.type as any,
            requestType: formData.requestType as any || 'Satılık',
            status: formData.status as any,
            minPrice: Number(formData.minPrice),
            maxPrice: Number(formData.maxPrice),
            currency: formData.currency || 'TL',
            city: formData.city || '',
            district: formData.district || 'Tümü',
            date: formData.date || new Date().toISOString().split('T')[0],
            notes: formData.notes,
            minRooms: formData.minRooms,
            siteId: formData.siteId,
            siteName: selectedSite?.name
        };

        try {
            if (id) {
                await updateRequest(requestData);
            } else {
                await addRequest(requestData);
            }
            navigate('/requests');
        } catch (error) {
            console.error(error);
            alert('Talep kaydedilirken bir hata oluştu.');
        }
    };

    const getDistricts = () => {
        if (!formData.city) return [];
        return ALL_CITIES_DISTRICTS[formData.city] || [];
    };

    const formatCurrency = (value: number) => {
        if (!value) return '';
        // Force Turkish locale for correct thousand separators
        return new Intl.NumberFormat('tr-TR').format(value);
    };

    const handlePriceChange = (field: 'minPrice' | 'maxPrice', value: string) => {
        // Remove all non-digit characters
        const cleanValue = value.replace(/\D/g, '');
        const numValue = cleanValue ? parseInt(cleanValue, 10) : 0;
        setFormData({ ...formData, [field]: numValue });
    };

    return (
        <div className="max-w-3xl mx-auto">
            <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors text-sm mb-4">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Geri Dön
            </button>

            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 transition-colors">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">
                    {id ? 'Talebi Düzenle' : 'Yeni Müşteri Talebi Oluştur'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Customer Selection */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Müşteri</label>
                            {!id && (
                                <Link to="/customers/new" className="text-xs text-[#1193d4] hover:underline flex items-center">
                                    <UserPlus className="w-3 h-3 mr-1" />
                                    Yeni Müşteri Ekle
                                </Link>
                            )}
                        </div>
                        <select
                            className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:ring-[#1193d4] focus:border-[#1193d4]"
                            value={formData.customerId || ''}
                            onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                            required
                            disabled={!!id}
                        >
                            <option value="">Müşteri Seçiniz</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                            ))}
                        </select>
                    </div>

                    <div className="border-t border-gray-100 dark:border-slate-700 pt-4"></div>

                    {/* Criteria */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">İşlem Türü</label>
                            <select
                                className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:ring-[#1193d4] focus:border-[#1193d4]"
                                value={formData.requestType || 'Satılık'}
                                onChange={(e) => setFormData({ ...formData, requestType: e.target.value as any })}
                            >
                                <option value="Satılık">Satılık</option>
                                <option value="Kiralık">Kiralık</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Aranan Emlak Tipi</label>
                            <select
                                className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:ring-[#1193d4] focus:border-[#1193d4]"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                            >
                                <option>Daire</option>
                                <option>Villa</option>
                                <option>Müstakil Ev</option>
                                <option>Ofis</option>
                                <option>İşyeri</option>
                                <option>Arsa</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Min. Oda Sayısı</label>
                            <select
                                className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:ring-[#1193d4] focus:border-[#1193d4]"
                                value={formData.minRooms || ''}
                                onChange={(e) => setFormData({ ...formData, minRooms: e.target.value })}
                            >
                                <option value="">Farketmez</option>
                                <option value="1+1">1+1</option>
                                <option value="2+1">2+1</option>
                                <option value="3+1">3+1</option>
                                <option value="4+1">4+1</option>
                                <option value="5+1">5+1</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Tercih Edilen Şehir</label>
                            <select
                                className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:ring-[#1193d4] focus:border-[#1193d4]"
                                value={formData.city || ''}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value, district: '' })}
                            >
                                <option value="">İl Seçiniz</option>
                                {Object.keys(ALL_CITIES_DISTRICTS).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">İlçe / Bölge</label>
                            <select
                                className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:ring-[#1193d4] focus:border-[#1193d4]"
                                value={formData.district || ''}
                                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                disabled={!formData.city}
                            >
                                <option value="">İlçe Seçiniz (Opsiyonel)</option>
                                <option value="Tümü">Tümü</option>
                                {getDistricts().map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Özel Site Tercihi (Varsa)</label>
                            <select
                                className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:ring-[#1193d4] focus:border-[#1193d4]"
                                value={formData.siteId || ''}
                                onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                            >
                                <option value="">Site Farketmez</option>
                                {sites.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.region})</option>
                                ))}
                            </select>
                            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                                Eğer müşteri sadece belirli bir siteden daire istiyorsa seçiniz.
                            </p>
                        </div>
                    </div>

                    {/* Price Range */}
                    <div className="bg-gray-50 dark:bg-slate-700/50 p-6 rounded-xl border border-gray-200 dark:border-slate-600">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 uppercase">Bütçe Aralığı</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Minimum (TL)</label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:ring-[#1193d4] focus:border-[#1193d4]"
                                    value={formatCurrency(formData.minPrice || 0)}
                                    onChange={(e) => handlePriceChange('minPrice', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Maksimum (TL)</label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:ring-[#1193d4] focus:border-[#1193d4]"
                                    value={formatCurrency(formData.maxPrice || 0)}
                                    onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Notlar</label>
                        <textarea
                            rows={3}
                            placeholder="Örn: Deniz manzarası önemli, zemin kat istemiyor..."
                            className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:ring-[#1193d4] focus:border-[#1193d4]"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        ></textarea>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="submit"
                            className="flex-1 bg-[#1193d4] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                        >
                            {id ? 'Değişiklikleri Kaydet' : 'Talebi Oluştur'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/requests')}
                            className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-white py-3 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                        >
                            İptal
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RequestForm;