import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, UserPlus, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useData } from '../context/DataContext';
import { Request, Customer } from '../types';
import { isValidPhoneNumber, isValidEmail } from '../utils/validation';

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
    const { customers, addRequest, updateRequest, requests, sites, addCustomer, userProfile } = useData();

    // Check if user can edit this request
    const canEdit = (request: Request | undefined): boolean => {
        if (!request) return true; // New request, anyone can create
        const isOwner = request.user_id === userProfile?.id;
        const isBroker = ['broker', 'ofis_broker', 'admin', 'owner'].includes(userProfile?.role || '');
        return isOwner || isBroker;
    };

    // New customer modal state
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [newCustomerData, setNewCustomerData] = useState({
        name: '',
        phone: '',
        email: ''
    });
    const [customerModalLoading, setCustomerModalLoading] = useState(false);
    const [customerModalErrors, setCustomerModalErrors] = useState<{ phone?: string; email?: string }>({});

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

    // Load for Edit with permission check
    useEffect(() => {
        if (id && requests.length > 0) {
            const existing = requests.find(r => r.id === id);
            if (existing) {
                // Check if user has permission to edit
                if (!canEdit(existing)) {
                    toast.error('Bu talebi düzenleme yetkiniz yok.');
                    navigate('/requests');
                    return;
                }
                setFormData(existing);
            }
        }
    }, [id, requests, userProfile]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Allow submitting even if maxPrice isn't set, or set logic as needed. Removed strict block for better UX if desired, or keep it.
        // User asked for formatting fix, assuming stricter validation is fine but let's just warn.
        if (!formData.customerId || !formData.maxPrice) {
            toast.error("Lütfen müşteri ve bütçe bilgilerini giriniz.");
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
                toast.success('Talep güncellendi!');
            } else {
                await addRequest(requestData);
                toast.success('Yeni talep eklendi!');
            }
            navigate('/requests');
        } catch (error) {
            console.error(error);
            toast.error('Talep kaydedilirken bir hata oluştu.');
        }
    };

    const getDistricts = () => {
        if (!formData.city) return [];
        return ALL_CITIES_DISTRICTS[formData.city] || [];
    };

    // Quick add customer handler
    const handleQuickAddCustomer = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate
        const errors: { phone?: string; email?: string } = {};
        if (newCustomerData.phone && !isValidPhoneNumber(newCustomerData.phone)) {
            errors.phone = 'Geçerli bir telefon numarası giriniz';
        }
        if (newCustomerData.email && !isValidEmail(newCustomerData.email)) {
            errors.email = 'Geçerli bir e-posta adresi giriniz';
        }
        setCustomerModalErrors(errors);
        if (Object.keys(errors).length > 0) return;

        if (!newCustomerData.name.trim()) {
            toast.error('Müşteri adı zorunludur');
            return;
        }

        setCustomerModalLoading(true);
        try {
            const newCustomer: Customer = {
                id: `cust-${Date.now()}`,
                name: newCustomerData.name.trim(),
                phone: newCustomerData.phone.trim(),
                email: newCustomerData.email.trim(),
                status: 'Aktif',
                source: 'Talep Formu',
                createdAt: new Date().toISOString().split('T')[0],
                avatar: `https://i.pravatar.cc/150?u=${Date.now()}`,
                interactions: []
            };

            await addCustomer(newCustomer);

            // Auto-select the new customer
            setFormData(prev => ({ ...prev, customerId: newCustomer.id }));

            // Close modal and reset
            setShowCustomerModal(false);
            setNewCustomerData({ name: '', phone: '', email: '' });
            setCustomerModalErrors({});

            toast.success(`"${newCustomer.name}" müşteri olarak eklendi ve seçildi`);
        } catch (error: any) {
            console.error('Error adding customer:', error);
            toast.error('Müşteri eklenirken hata: ' + (error.message || 'Bilinmeyen hata'));
        } finally {
            setCustomerModalLoading(false);
        }
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
                                <button
                                    type="button"
                                    onClick={() => setShowCustomerModal(true)}
                                    className="text-xs text-[#1193d4] hover:underline flex items-center"
                                >
                                    <UserPlus className="w-3 h-3 mr-1" />
                                    Yeni Müşteri Ekle
                                </button>
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

            {/* Quick Add Customer Modal */}
            {showCustomerModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-[#1193d4]" />
                                Hızlı Müşteri Ekle
                            </h3>
                            <button
                                onClick={() => {
                                    setShowCustomerModal(false);
                                    setNewCustomerData({ name: '', phone: '', email: '' });
                                    setCustomerModalErrors({});
                                }}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <form onSubmit={handleQuickAddCustomer} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    Ad Soyad <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Örn: Ahmet Yılmaz"
                                    className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:ring-[#1193d4] focus:border-[#1193d4]"
                                    value={newCustomerData.name}
                                    onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    Telefon
                                </label>
                                <input
                                    type="tel"
                                    placeholder="Örn: 555 123 4567"
                                    className={`w-full rounded-lg bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:ring-[#1193d4] focus:border-[#1193d4] ${customerModalErrors.phone ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}`}
                                    value={newCustomerData.phone}
                                    onChange={(e) => {
                                        setNewCustomerData({ ...newCustomerData, phone: e.target.value });
                                        if (customerModalErrors.phone) setCustomerModalErrors({ ...customerModalErrors, phone: undefined });
                                    }}
                                />
                                {customerModalErrors.phone && <p className="mt-1 text-sm text-red-500">{customerModalErrors.phone}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    E-posta
                                </label>
                                <input
                                    type="email"
                                    placeholder="Örn: ahmet@email.com"
                                    className={`w-full rounded-lg bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:ring-[#1193d4] focus:border-[#1193d4] ${customerModalErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}`}
                                    value={newCustomerData.email}
                                    onChange={(e) => {
                                        setNewCustomerData({ ...newCustomerData, email: e.target.value });
                                        if (customerModalErrors.email) setCustomerModalErrors({ ...customerModalErrors, email: undefined });
                                    }}
                                />
                                {customerModalErrors.email && <p className="mt-1 text-sm text-red-500">{customerModalErrors.email}</p>}
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={customerModalLoading}
                                    className="flex-1 bg-[#1193d4] text-white py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {customerModalLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Ekleniyor...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="w-4 h-4" />
                                            Ekle ve Seç
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCustomerModal(false);
                                        setNewCustomerData({ name: '', phone: '', email: '' });
                                        setCustomerModalErrors({});
                                    }}
                                    className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-white py-2.5 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                                >
                                    İptal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RequestForm;