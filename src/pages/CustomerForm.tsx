import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Customer } from '../types';

const CustomerForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { addCustomer, updateCustomer, customers } = useData();

    const [formData, setFormData] = useState<Partial<Customer>>({
        name: '',
        phone: '',
        email: '',
        status: 'Aktif',
        source: 'Web Sitesi',
        notes: '',
        hasPets: false,
        petDetails: '',
        currentHousingStatus: 'Kiracı',
        currentRegion: '',
        occupation: '',
        company: '',
        birthDate: '',
        maritalStatus: undefined,
    });

    useEffect(() => {
        if (id) {
            const customer = customers.find(c => c.id === id);
            if (customer) {
                setFormData(customer);
            }
        }
    }, [id, customers]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const customer: Customer = {
            id: id || Date.now().toString(),
            createdAt: formData.createdAt || new Date().toISOString().split('T')[0],
            avatar: formData.avatar || `https://i.pravatar.cc/150?u=${Date.now()}`,
            interactions: formData.interactions || [],
            name: formData.name || '',
            email: formData.email || '',
            phone: formData.phone || '',
            status: formData.status || 'Aktif',
            customerType: formData.customerType,
            source: formData.source || 'Web Sitesi',
            notes: formData.notes,
            hasPets: formData.hasPets,
            petDetails: formData.petDetails,
            currentHousingStatus: formData.currentHousingStatus,
            currentRegion: formData.currentRegion,
            occupation: formData.occupation,
            company: formData.company,
            birthDate: formData.birthDate,
            maritalStatus: formData.maritalStatus
        };

        try {
            if (id) {
                await updateCustomer(customer);
            } else {
                await addCustomer(customer);
            }
            navigate('/customers');
        } catch (error: any) {
            console.error('Error saving customer:', error);
            alert('Müşteri kaydedilirken bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
        }
    };

    return (
        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 transition-colors">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white">{id ? 'Müşteri Düzenle' : 'Yeni Müşteri Ekle'}</h2>
                <p className="mt-2 text-gray-600 dark:text-slate-400">Müşteri bilgilerini girerek {id ? 'kaydı güncelleyin' : 'yeni bir kayıt oluşturun'}.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-6">
                    <fieldset>
                        <legend className="text-lg font-semibold text-slate-800 dark:text-white mb-4 border-b border-gray-200 dark:border-slate-700 pb-2 w-full">Müşteri Bilgileri</legend>
                        <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Ad Soyad</label>
                                <input
                                    type="text"
                                    placeholder="Örn: Ahmet Yılmaz"
                                    className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:ring-[#1193d4] focus:border-[#1193d4]"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Telefon Numarası</label>
                                <input
                                    type="tel"
                                    placeholder="Örn: 555 123 4567"
                                    className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:ring-[#1193d4] focus:border-[#1193d4]"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">E-posta Adresi (İsteğe Bağlı)</label>
                                <input
                                    type="email"
                                    placeholder="Örn: ahmet.yilmaz@ornek.com"
                                    className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:ring-[#1193d4] focus:border-[#1193d4]"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>
                    </fieldset>

                    <fieldset>
                        <legend className="text-lg font-semibold text-slate-800 dark:text-white mb-4 border-b border-gray-200 dark:border-slate-700 pb-2 w-full">Detaylar</legend>
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Durum</label>
                                <select
                                    className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:ring-[#1193d4] focus:border-[#1193d4]"
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                >
                                    <option value="Aktif">Aktif</option>
                                    <option value="Potansiyel">Potansiyel</option>
                                    <option value="Pasif">Pasif</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Kaynak</label>
                                <select
                                    className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:ring-[#1193d4] focus:border-[#1193d4]"
                                    value={formData.source}
                                    onChange={e => setFormData({ ...formData, source: e.target.value })}
                                >
                                    <option value="Web Sitesi">Web Sitesi</option>
                                    <option value="Tavsiye">Tavsiye</option>
                                    <option value="Sosyal Medya">Sosyal Medya</option>
                                    <option value="Diğer">Diğer</option>
                                </select>
                            </div>

                            <fieldset className="border-t border-gray-200 dark:border-slate-700 pt-6">
                                <legend className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Mesleki ve Kişisel Bilgiler</legend>
                                <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Meslek / Ünvan</label>
                                        <input
                                            type="text"
                                            placeholder="Örn: Mimar, Doktor"
                                            className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:ring-[#1193d4] focus:border-[#1193d4]"
                                            value={formData.occupation || ''}
                                            onChange={e => setFormData({ ...formData, occupation: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Çalıştığı Kurum / Firma</label>
                                        <input
                                            type="text"
                                            placeholder="Örn: ABC İnşaat"
                                            className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:ring-[#1193d4] focus:border-[#1193d4]"
                                            value={formData.company || ''}
                                            onChange={e => setFormData({ ...formData, company: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Doğum Tarihi</label>
                                        <input
                                            type="date"
                                            className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:ring-[#1193d4] focus:border-[#1193d4]"
                                            value={formData.birthDate || ''}
                                            onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Medeni Durum</label>
                                        <select
                                            className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:ring-[#1193d4] focus:border-[#1193d4]"
                                            value={formData.maritalStatus || ''}
                                            onChange={e => setFormData({ ...formData, maritalStatus: e.target.value as any })}
                                        >
                                            <option value="">Seçiniz</option>
                                            <option value="Evli">Evli</option>
                                            <option value="Bekar">Bekar</option>
                                        </select>
                                    </div>
                                </div>
                            </fieldset>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Müşteri Tipi</label>
                                <select
                                    className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:ring-[#1193d4] focus:border-[#1193d4]"
                                    value={formData.customerType || ''}
                                    onChange={e => setFormData({ ...formData, customerType: e.target.value as any })}
                                >
                                    <option value="">Seçiniz</option>
                                    <option value="Alıcı">Alıcı</option>
                                    <option value="Satıcı">Satıcı</option>
                                    <option value="Kiracı">Kiracı</option>
                                    <option value="Kiracı Adayı">Kiracı Adayı</option>
                                    <option value="Mal Sahibi">Mal Sahibi</option>
                                </select>
                            </div>
                        </div>
                    </fieldset>

                    <fieldset>
                        <legend className="text-lg font-semibold text-slate-800 dark:text-white mb-4 border-b border-gray-200 dark:border-slate-700 pb-2 w-full">Yaşam ve Tercihler</legend>
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Şu Anki Oturduğu Yer (Semt/İlçe)</label>
                                <input
                                    type="text"
                                    placeholder="Örn: Kadıköy / Moda"
                                    className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:ring-[#1193d4] focus:border-[#1193d4]"
                                    value={formData.currentRegion || ''}
                                    onChange={e => setFormData({ ...formData, currentRegion: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Konut Durumu</label>
                                <select
                                    className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:ring-[#1193d4] focus:border-[#1193d4]"
                                    value={formData.currentHousingStatus || ''}
                                    onChange={e => setFormData({ ...formData, currentHousingStatus: e.target.value as any })}
                                >
                                    <option value="">Seçiniz</option>
                                    <option value="Kiracı">Kiracı</option>
                                    <option value="Ev Sahibi">Ev Sahibi</option>
                                    <option value="Ailesiyle">Ailesiyle Yaşıyor</option>
                                </select>
                            </div>
                            <div className="flex items-start sm:col-span-2 space-x-4">
                                <div className="flex items-center h-5">
                                    <input
                                        id="hasPets"
                                        type="checkbox"
                                        className="w-4 h-4 text-[#1193d4] border-gray-300 rounded focus:ring-[#1193d4] bg-gray-50 dark:bg-slate-700 dark:border-slate-600"
                                        checked={formData.hasPets || false}
                                        onChange={e => setFormData({ ...formData, hasPets: e.target.checked })}
                                    />
                                </div>
                                <div className="ml-2 text-sm">
                                    <label htmlFor="hasPets" className="font-medium text-gray-700 dark:text-slate-300">Evcil Hayvanı Var mı?</label>
                                    <p className="text-gray-500 dark:text-slate-400">Kedi, köpek veya diğer evcil hayvanları varsa işaretleyin.</p>
                                </div>
                            </div>
                            {formData.hasPets && (
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Evcil Hayvan Detayı</label>
                                    <input
                                        type="text"
                                        placeholder="Örn: 2 Kedi, 1 Köpek"
                                        className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:ring-[#1193d4] focus:border-[#1193d4]"
                                        value={formData.petDetails || ''}
                                        onChange={e => setFormData({ ...formData, petDetails: e.target.value })}
                                    />
                                </div>
                            )}

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Ek Notlar</label>
                                <textarea
                                    rows={4}
                                    placeholder="Müşteri hakkında özel notlar..."
                                    className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:ring-[#1193d4] focus:border-[#1193d4]"
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                ></textarea>
                            </div>
                        </div>
                    </fieldset>
                </div>

                <div className="pt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/customers')}
                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        İptal
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 rounded-lg bg-[#1193d4] text-white font-semibold hover:opacity-90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1193d4]"
                    >
                        {id ? 'Kaydet' : 'Müşteri Oluştur'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CustomerForm;