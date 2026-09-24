import { useCrmRecord } from '../utils/useCrmRecord';
import SitePicker from '../components/SitePicker';
import EntityTags from '../components/EntityTags';

import React, { useState } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useData } from '../context/DataContext';
import { Activity, Customer } from '../types';
import { UserPlus, ArrowLeft, X, Mic, StopCircle } from 'lucide-react';
import { useEffect } from 'react';

type CustomerType = NonNullable<Customer['customerType']>;

const ActivityForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { customers, properties, activities, addActivity, updateActivity, addCustomer } = useData();

    const [formData, setFormData] = useState<Partial<Activity>>({
        type: 'Yer Gösterimi',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        status: 'Düşünüyor',
        description: ''
    });

    // Modal State
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [newCustomer, setNewCustomer] = useState<{ name: string; phone: string; customerType: CustomerType | '' }>({ name: '', phone: '', customerType: '' });
    const [savingCustomer, setSavingCustomer] = useState(false);

    // Voice State
    const [isRecording, setIsRecording] = useState(false);

    const startListening = () => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            const recognition = new SpeechRecognition();

            recognition.lang = 'tr-TR';
            recognition.continuous = false;

            recognition.onstart = () => setIsRecording(true);

            recognition.onend = () => {
                setIsRecording(false);
            };

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setFormData(prev => ({
                    ...prev,
                    description: (prev.description ? prev.description + ' ' : '') + transcript
                }));
            };

            recognition.start();
        } else {
            toast.error('Tarayıcınız sesli girişi desteklemiyor. Lütfen Chrome kullanın.');
        }
    };

    const {record: editRecord, loading: editLoading, error: editError} = useCrmRecord('activities',id,activities);
    useEffect(() => {
        if (id) {
            const activityToEdit = editRecord;
            if (activityToEdit) {
                setFormData({
                    type: activityToEdit.type,
                    date: activityToEdit.date,
                    time: activityToEdit.time,
                    status: activityToEdit.status,
                    description: activityToEdit.description,
                    customerId: activityToEdit.customerId,
                    customerName: activityToEdit.customerName, propertyTitle: activityToEdit.propertyTitle,
                    propertyId: activityToEdit.propertyId,
                    site_id: activityToEdit.site_id, rooms: activityToEdit.rooms
                });
            }
        }
    }, [id, editRecord]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.customerId || !formData.type) return;

        const selectedCustomer = customers.find(c => c.id === formData.customerId);
        const selectedProperty = properties.find(p => p.id === formData.propertyId);

        const activityData: Activity = {
            id: id || Date.now().toString(),
            type: formData.type as any,
            customerId: formData.customerId,
            customerName: selectedCustomer?.name || formData.customerName || 'Bilinmeyen Müşteri',
            propertyId: formData.propertyId,
            site_id: formData.propertyId ? null : formData.site_id || null,
            rooms: formData.propertyId ? null : formData.rooms || null,
            propertyTitle: selectedProperty?.title || formData.propertyTitle,
            date: formData.date || '',
            time: formData.time,
            description: formData.description || '',
            status: formData.status as any
        };

        try {
            if (id) {
                await updateActivity(activityData);
                toast.success('Aktivite güncellendi!');
            } else {
                await addActivity(activityData);
                toast.success('Aktivite eklendi!');
            }
            navigate('/activities');
        } catch (error) {
            console.error(error);
            toast.error('İşlem başarısız oldu.');
        }
    };

    const handleQuickAddCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCustomer.name.trim() || !newCustomer.phone.trim() || savingCustomer) return;
        if (!newCustomer.customerType) {
            toast.error('Müşteri tipini seçiniz.');
            return;
        }

        const customer: Customer = {
            id: Date.now().toString(),
            name: newCustomer.name.trim(),
            phone: newCustomer.phone.trim(),
            email: '',
            status: 'Aktif',
            customerType: newCustomer.customerType,
            source: 'Hızlı Ekleme',
            createdAt: new Date().toISOString().split('T')[0],
            interactions: [],
            avatar: `https://i.pravatar.cc/150?u=${Date.now()}`
        };

        setSavingCustomer(true);
        try {
            const created = await addCustomer(customer);
            setFormData(prev => ({ ...prev, customerId: created.id, customerName: created.name }));
            setNewCustomer({ name: '', phone: '', customerType: '' });
            setShowCustomerModal(false);
            toast.success('Müşteri eklendi ve seçildi.');
        } catch (error) {
            console.error('Hızlı müşteri ekleme hatası:', error);
            toast.error('Müşteri kaydedilemedi. Lütfen tekrar deneyin.');
        } finally {
            setSavingCustomer(false);
        }
    };

    const linkedCase = id ? activities.find(activity => activity.id === id)?.prospecting_case_id : undefined;
    if (linkedCase) return <div className="p-6 space-y-3"><h2 className="text-xl font-semibold">Portföy Takibi araması</h2><p>Bu arama görüşme geçmişine bağlıdır. Yeni görüşme, not ve sonraki adım için takip kartını açın.</p><Link className="text-sky-600 underline" to={`/prospecting?case=${encodeURIComponent(linkedCase)}`}>Takip kartını aç</Link></div>;

    if (id && (editLoading || editError || !editRecord)) return <p role="status" className="p-8">{editError || (editLoading ? 'Kayıt yükleniyor…' : 'Kayıt bulunamadı.')}</p>;

    return (
        <div className="max-w-3xl mx-auto relative">
            <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors text-sm mb-4">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Geri Dön
            </button>

            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 transition-colors">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">{id ? 'Aktivite Düzenle' : 'Yeni Aktivite Ekle'}</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Activity Type & Date */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Aktivite Tipi</label>
                            <select
                                className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:ring-[#1193d4] focus:border-[#1193d4]"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                            >
                                <option>Yer Gösterimi</option>
                                <option>Gelen Arama</option>
                                <option>Giden Arama</option>
                                <option>Ofis Toplantısı</option>
                                <option>Tapu İşlemi</option>
                                <option>Kapora Alındı</option>
                                <option>Diğer</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Tarih</label>
                                <input
                                    type="date"
                                    className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:ring-[#1193d4] focus:border-[#1193d4]"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Saat</label>
                                <input
                                    type="time"
                                    className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:ring-[#1193d4] focus:border-[#1193d4]"
                                    value={formData.time}
                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Customer Selection */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Müşteri</label>
                            <button
                                type="button"
                                onClick={() => setShowCustomerModal(true)}
                                className="text-xs text-[#1193d4] hover:underline flex items-center"
                            >
                                <UserPlus className="w-3 h-3 mr-1" />
                                Yeni Müşteri Ekle
                            </button>
                        </div>
                        <select
                            className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:ring-[#1193d4] focus:border-[#1193d4]"
                            value={formData.customerId || ''}
                            onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                            required
                        >
                            <option value="">Müşteri Seçiniz</option>
                            {formData.customerId && !customers.some(c=>c.id===formData.customerId) && <option value={formData.customerId}>{formData.customerName || 'Kayıtlı müşteri'}</option>}
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                            ))}
                        </select>
                    </div>

                    {/* Property Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">İlgili Emlak (Opsiyonel)</label>
                        <select
                            className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:ring-[#1193d4] focus:border-[#1193d4]"
                            value={formData.propertyId || ''}
                            onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                        >
                            <option value="">Emlak Seçiniz (Yok)</option>
                            {formData.propertyId && !properties.some(p=>p.id===formData.propertyId) && <option value={formData.propertyId}>{formData.propertyTitle || 'Kayıtlı portföy'}</option>}
                            {properties.map(p => (
                                <option key={p.id} value={p.id}>#{p.id.slice(-4)} - {p.title}</option>
                            ))}
                        </select>
                    </div>

                    {id && <EntityTags type="activity" id={id} editable/>}
                    {formData.propertyId ? <p className="text-xs text-slate-500 dark:text-slate-400">Seçilen ilanın site etiketi bu aktiviteye otomatik eklenir.</p> : <div className="space-y-3"><SitePicker value={formData.site_id} onChange={(site_id)=>setFormData({...formData,site_id})}/><label className="block text-sm">Gösterilen / görüşülen evin oda sayısı<input value={formData.rooms || ''} onChange={e=>setFormData({...formData,rooms:e.target.value.replace(/\s/g,'')})} placeholder="Örn. 3+1" className="w-full rounded-lg border p-2.5 dark:bg-slate-800 dark:border-slate-600"/></label></div>}
                    {/* Notes */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Notlar & Müşteri Görüşü</label>
                            <button
                                type="button"
                                onClick={startListening}
                                disabled={isRecording}
                                className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${isRecording
                                    ? 'bg-red-100 text-red-600 animate-pulse'
                                    : 'bg-sky-50 text-[#1193d4] hover:bg-sky-100'
                                    }`}
                            >
                                {isRecording ? (
                                    <>
                                        <StopCircle className="w-3.5 h-3.5" />
                                        Dinleniyor...
                                    </>
                                ) : (
                                    <>
                                        <Mic className="w-3.5 h-3.5" />
                                        Sesle Yaz
                                    </>
                                )}
                            </button>
                        </div>
                        <textarea
                            rows={4}
                            placeholder="Görüşmenin detaylarını ve müşterinin yorumlarını buraya yazın..."
                            className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:ring-[#1193d4] focus:border-[#1193d4]"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                        ></textarea>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Sonuç / Durum</label>
                        <div className="flex flex-wrap gap-4">
                            {['Planlandı', 'Olumlu', 'Düşünüyor', 'Olumsuz', 'Tamamlandı'].map((status) => (
                                <label key={status} className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        name="status"
                                        value={status}
                                        checked={formData.status === status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                        className="w-4 h-4 text-[#1193d4] focus:ring-[#1193d4] border-gray-300 dark:border-slate-600"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 dark:text-slate-300">{status}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="submit"
                            className="flex-1 bg-[#1193d4] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                        >
                            Aktiviteyi Kaydet
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/activities')}
                            className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-white py-3 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                        >
                            İptal
                        </button>
                    </div>
                </form>
            </div>

            {/* Quick Customer Add Modal */}
            {showCustomerModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-slate-700 animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Hızlı Müşteri Ekle</h3>
                            <button onClick={() => setShowCustomerModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleQuickAddCustomer} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Ad Soyad</label>
                                <input
                                    type="text"
                                    autoFocus
                                    className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:ring-[#1193d4] focus:border-[#1193d4]"
                                    value={newCustomer.name}
                                    onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Telefon</label>
                                <input
                                    type="tel"
                                    className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:ring-[#1193d4] focus:border-[#1193d4]"
                                    value={newCustomer.phone}
                                    onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="activity-customer-type" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Müşteri Tipi</label>
                                <select
                                    id="activity-customer-type"
                                    className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white"
                                    value={newCustomer.customerType}
                                    onChange={e => setNewCustomer(prev => ({ ...prev, customerType: e.target.value as CustomerType | '' }))}
                                    required
                                >
                                    <option value="">Seçiniz</option>
                                    <option value="Alıcı">Alıcı</option>
                                    <option value="Satıcı">Satıcı</option>
                                    <option value="Kiracı">Kiracı</option>
                                    <option value="Kiracı Adayı">Kiracı Adayı</option>
                                    <option value="Mal Sahibi">Mal Sahibi</option>
                                </select>
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCustomerModal(false)}
                                    className="flex-1 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-700"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingCustomer}
                                    className="flex-1 py-2.5 bg-[#1193d4] text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
                                >
                                    {savingCustomer ? 'Kaydediliyor...' : 'Kaydet ve Seç'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActivityForm;
