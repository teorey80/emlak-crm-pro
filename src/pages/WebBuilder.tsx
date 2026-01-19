
import React, { useState, useEffect } from 'react';
import { Globe, Layout, Image as ImageIcon, Save, Monitor, UploadCloud, RefreshCw, CheckCircle, Palette, Type, Search, Map, Grid, Users } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';

const WebBuilder: React.FC = () => {
    const navigate = useNavigate();
    const { webConfig, updateWebConfig, userProfile, office } = useData();
    const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'seo'>('general');
    const [targetSite, setTargetSite] = useState<'personal' | 'office'>('personal');

    // Local state for form handling before save
    const [formData, setFormData] = useState(webConfig);
    const [isSaved, setIsSaved] = useState(false);
    const [publishStatus, setPublishStatus] = useState<'idle' | 'publishing' | 'published'>('idle');
    const [dnsVerified, setDnsVerified] = useState(false);

    // Sync formData when switching between Personal/Office
    useEffect(() => {
        if (targetSite === 'personal') {
            setFormData(userProfile.siteConfig || webConfig);
        } else if (targetSite === 'office' && office?.siteConfig) {
            setFormData(office.siteConfig);
        }
    }, [targetSite, userProfile, office]);

    const handleSave = async () => {
        await updateWebConfig(formData, targetSite);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    const handlePublish = async () => {
        setPublishStatus('publishing');
        const updatedConfig = { ...formData, isActive: true };
        await updateWebConfig(updatedConfig, targetSite);
        setTimeout(() => {
            setPublishStatus('published');
            setFormData(updatedConfig);
        }, 1500);
    };

    const checkDns = () => {
        if (formData.domain) {
            setTimeout(() => setDnsVerified(true), 1500);
        }
    };

    const openPreview = () => {
        updateWebConfig(formData, targetSite);
        navigate('/web-preview', { state: { targetSite } });
    };

    const colors = [
        { name: 'Sky Blue', value: '#0ea5e9' },
        { name: 'Indigo', value: '#6366f1' },
        { name: 'Emerald', value: '#10b981' },
        { name: 'Amber', value: '#f59e0b' },
        { name: 'Rose', value: '#f43f5e' },
        { name: 'Slate', value: '#475569' },
    ];

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            {/* Target Selector Tabs - BURASI SCREENSHOT'TA GÖZÜKMEYEN YER */}
            <div className="flex gap-1 p-1 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl w-full max-w-md mx-auto border border-gray-200 dark:border-slate-700 shadow-sm">
                <button
                    onClick={() => setTargetSite('personal')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${targetSite === 'personal' ? 'bg-white dark:bg-slate-700 shadow-md text-[#1193d4]' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}
                >
                    <Users className="w-4 h-4" />
                    Kişisel Sitem
                </button>
                {(userProfile.role === 'broker' || office?.ownerId === userProfile.id) && (
                    <button
                        onClick={() => setTargetSite('office')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${targetSite === 'office' ? 'bg-white dark:bg-slate-700 shadow-md text-indigo-600' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}
                    >
                        <Monitor className="w-4 h-4" />
                        Ofis Sitem
                    </button>
                )}
            </div>

            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm transition-colors relative overflow-hidden">
                {/* Sürüm İbaresi (Debug ama şık) */}
                <div className="absolute top-0 right-0 bg-blue-600 text-[10px] text-white px-2 py-0.5 rounded-bl-lg font-bold">V2.1 - BULUT SENKRONİZASYONU AKTİF</div>

                <div>
                    <div className="flex items-center gap-2">
                        <Globe className={`w-6 h-6 ${targetSite === 'personal' ? 'text-[#1193d4]' : 'text-indigo-600'}`} />
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                            {targetSite === 'personal' ? 'Kişisel Site Yönetimi' : 'Ofis Sitesi Yönetimi'}
                        </h2>
                    </div>
                    <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
                        {formData.domain ? (
                            <span className="flex items-center gap-2">
                                Aktif Domain: <span className="font-semibold text-slate-700 dark:text-slate-200">{formData.domain}</span>
                                {publishStatus === 'published' && <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">Canlıda</span>}
                            </span>
                        ) : `${targetSite === 'personal' ? 'Kendi' : 'Ofis'} emlak web sitenizi yapılandırın.`}
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={openPreview}
                        className="flex items-center gap-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-all shadow-sm font-medium"
                    >
                        <Monitor className="w-4 h-4" />
                        Önizleme
                    </button>

                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 px-4 py-2.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-all shadow-sm font-medium"
                    >
                        <Save className="w-4 h-4" />
                        {isSaved ? 'Kaydedildi' : 'Taslağı Kaydet'}
                    </button>

                    <button
                        onClick={handlePublish}
                        disabled={publishStatus === 'publishing' || !formData.domain}
                        className={`flex items-center gap-2 text-white px-6 py-2.5 rounded-lg transition-all shadow-sm font-medium ${publishStatus === 'published' || formData.isActive
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-[#1193d4] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'
                            }`}
                    >
                        {publishStatus === 'publishing' ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Yayınlanıyor...
                            </>
                        ) : (formData.isActive || publishStatus === 'published') ? (
                            <>
                                <CheckCircle className="w-4 h-4" />
                                Yayında
                            </>
                        ) : (
                            <>
                                <UploadCloud className="w-4 h-4" />
                                Siteyi Yayına Al
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Settings Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-slate-700 overflow-x-auto bg-white dark:bg-slate-800 rounded-t-xl px-2 transition-colors">
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'general' ? 'border-[#1193d4] text-[#1193d4]' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'}`}
                        >
                            Domain & Bağlantı
                        </button>
                        <button
                            onClick={() => setActiveTab('appearance')}
                            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'appearance' ? 'border-[#1193d4] text-[#1193d4]' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'}`}
                        >
                            Görünüm & Tasarım
                        </button>
                        <button
                            onClick={() => setActiveTab('seo')}
                            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'seo' ? 'border-[#1193d4] text-[#1193d4]' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'}`}
                        >
                            SEO & Meta
                        </button>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-b-xl rounded-tr-xl border border-gray-200 dark:border-slate-700 shadow-sm border-t-0 mt-[-1px] transition-colors">

                        {/* DOMAIN TAB */}
                        {activeTab === 'general' && (
                            <div className="space-y-8 animate-fade-in">
                                {/* Domain Input */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                        <Globe className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                                        Alan Adı Yapılandırması
                                    </h3>
                                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30 mb-4">
                                        <p className="text-sm text-blue-800 dark:text-blue-300">
                                            Mevcut bir alan adınızı (örn: <strong>{targetSite === 'personal' ? 'ademaslan.com' : 'nestlife.com.tr'}</strong>) bağlamak için aşağıdaki alana yazın ve DNS ayarlarını doğrulayın.
                                        </p>
                                    </div>

                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Özel Domain Adresi</label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 flex shadow-sm rounded-md h-12">
                                            <span className="inline-flex items-center px-4 rounded-l-md border border-r-0 border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-slate-400 text-sm font-mono">
                                                https://
                                            </span>
                                            <input
                                                type="text"
                                                value={formData.domain}
                                                placeholder="ornekemlak.com"
                                                onChange={(e) => {
                                                    setFormData({ ...formData, domain: e.target.value });
                                                    setDnsVerified(false);
                                                }}
                                                className="flex-1 block w-full min-w-0 rounded-none rounded-r-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-[#1193d4] focus:border-[#1193d4] sm:text-sm px-3"
                                            />
                                        </div>
                                        <button
                                            onClick={checkDns}
                                            disabled={!formData.domain}
                                            className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-900 dark:hover:bg-slate-600 text-sm font-medium transition-colors"
                                        >
                                            DNS Doğrula
                                        </button>
                                    </div>
                                </div>

                                {/* DNS Records Table (Shown when domain is entered) */}
                                {formData.domain && (
                                    <div className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                        <div className="bg-gray-50 dark:bg-slate-700/50 px-4 py-3 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
                                            <h4 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Gerekli DNS Kayıtları</h4>
                                            {dnsVerified && (
                                                <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-medium">
                                                    <CheckCircle className="w-3 h-3" /> Doğrulandı
                                                </span>
                                            )}
                                        </div>
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-gray-500 dark:text-slate-400 uppercase bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
                                                <tr>
                                                    <th className="px-4 py-3">Tip</th>
                                                    <th className="px-4 py-3">Ad (Host)</th>
                                                    <th className="px-4 py-3">Değer</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                                <tr>
                                                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">A</td>
                                                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">@</td>
                                                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">76.76.21.21</td>
                                                </tr>
                                                <tr>
                                                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">CNAME</td>
                                                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">www</td>
                                                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">{formData.domain}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        <div className="bg-gray-50 dark:bg-slate-700/30 px-4 py-3 text-xs text-gray-500 dark:text-slate-400">
                                            * Bu kayıtları domain sağlayıcınızın (GoDaddy, İsimTescil vb.) panelinden ekleyin.
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* APPEARANCE TAB */}
                        {activeTab === 'appearance' && (
                            <div className="space-y-8 animate-fade-in">
                                {/* Layout Selection */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                        <Layout className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                                        Tasarım Şablonu
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Standard Layout */}
                                        <div
                                            onClick={() => setFormData({ ...formData, layout: 'standard' })}
                                            className={`cursor-pointer rounded-xl border-2 overflow-hidden transition-all ${formData.layout === 'standard' ? 'border-[#1193d4] ring-2 ring-[#1193d4]/20' : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'}`}
                                        >
                                            <div className="h-32 bg-gray-100 dark:bg-slate-900 flex flex-col">
                                                <div className="h-16 bg-gray-300 dark:bg-slate-800 w-full mb-2"></div>
                                                <div className="flex-1 px-4 flex gap-2">
                                                    <div className="w-1/3 bg-gray-200 dark:bg-slate-700 rounded"></div>
                                                    <div className="w-1/3 bg-gray-200 dark:bg-slate-700 rounded"></div>
                                                    <div className="w-1/3 bg-gray-200 dark:bg-slate-700 rounded"></div>
                                                </div>
                                                <div className="h-4 w-full mt-2"></div>
                                            </div>
                                            <div className="p-4 bg-white dark:bg-slate-800">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="font-bold text-slate-700 dark:text-white text-sm">Standart</h4>
                                                    {formData.layout === 'standard' && <CheckCircle className="w-4 h-4 text-[#1193d4]" />}
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                                    Klasik kurumsal emlak sitesi. Büyük manşet ve vitrin ilanları.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Map Layout */}
                                        <div
                                            onClick={() => setFormData({ ...formData, layout: 'map' })}
                                            className={`cursor-pointer rounded-xl border-2 overflow-hidden transition-all ${formData.layout === 'map' ? 'border-[#1193d4] ring-2 ring-[#1193d4]/20' : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'}`}
                                        >
                                            <div className="h-32 bg-gray-100 dark:bg-slate-900 flex">
                                                <div className="w-1/2 bg-gray-300 dark:bg-slate-800 h-full flex items-center justify-center">
                                                    <Map className="w-6 h-6 text-gray-400" />
                                                </div>
                                                <div className="w-1/2 p-2 flex flex-col gap-2">
                                                    <div className="h-2 bg-gray-200 dark:bg-slate-700 w-full rounded"></div>
                                                    <div className="h-8 bg-gray-200 dark:bg-slate-700 w-full rounded"></div>
                                                    <div className="h-8 bg-gray-200 dark:bg-slate-700 w-full rounded"></div>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-white dark:bg-slate-800">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="font-bold text-slate-700 dark:text-white text-sm">Harita Odaklı</h4>
                                                    {formData.layout === 'map' && <CheckCircle className="w-4 h-4 text-[#1193d4]" />}
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                                    Harita sol tarafta sabit, ilanlar sağda listelenir.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Grid Layout */}
                                        <div
                                            onClick={() => setFormData({ ...formData, layout: 'grid' })}
                                            className={`cursor-pointer rounded-xl border-2 overflow-hidden transition-all ${formData.layout === 'grid' ? 'border-[#1193d4] ring-2 ring-[#1193d4]/20' : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'}`}
                                        >
                                            <div className="h-32 bg-gray-100 dark:bg-slate-900 p-2">
                                                <div className="h-4 bg-gray-200 dark:bg-slate-800 w-full mb-2 rounded"></div>
                                                <div className="grid grid-cols-3 gap-2 h-20">
                                                    <div className="bg-gray-300 dark:bg-slate-700 rounded"></div>
                                                    <div className="bg-gray-300 dark:bg-slate-700 rounded"></div>
                                                    <div className="bg-gray-300 dark:bg-slate-700 rounded"></div>
                                                    <div className="bg-gray-300 dark:bg-slate-700 rounded"></div>
                                                    <div className="bg-gray-300 dark:bg-slate-700 rounded"></div>
                                                    <div className="bg-gray-300 dark:bg-slate-700 rounded"></div>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-white dark:bg-slate-800">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="font-bold text-slate-700 dark:text-white text-sm">Modern Grid</h4>
                                                    {formData.layout === 'grid' && <CheckCircle className="w-4 h-4 text-[#1193d4]" />}
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                                    Minimalist, çoklu ilan gösterimine odaklı yapı.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Color Picker */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                        <Palette className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                                        Ana Renk Teması
                                    </h3>
                                    <div className="flex gap-4 flex-wrap">
                                        {colors.map(color => (
                                            <button
                                                key={color.value}
                                                onClick={() => setFormData({ ...formData, primaryColor: color.value })}
                                                className={`w-12 h-12 rounded-full border-4 transition-all ${formData.primaryColor === color.value ? 'border-gray-300 dark:border-white scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
                                                style={{ backgroundColor: color.value }}
                                                title={color.name}
                                            >
                                                {formData.primaryColor === color.value && <CheckCircle className="w-6 h-6 text-white mx-auto drop-shadow-md" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Logo Upload */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                        <ImageIcon className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                                        Site Logosu
                                    </h3>
                                    <input
                                        type="file"
                                        id="logo-upload"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (event) => {
                                                    setFormData({ ...formData, logoUrl: event.target?.result as string });
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                    <label
                                        htmlFor="logo-upload"
                                        className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-6 text-center hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer block"
                                    >
                                        {formData.logoUrl ? (
                                            <div className="flex flex-col items-center gap-3">
                                                <img src={formData.logoUrl} alt="Logo Preview" className="h-16 w-auto object-contain" />
                                                <span className="text-sm text-gray-500 dark:text-slate-400">Değiştirmek için tıklayın</span>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-3 text-gray-400 dark:text-slate-400">
                                                    <UploadCloud className="w-6 h-6" />
                                                </div>
                                                <span className="text-sm text-gray-600 dark:text-slate-300 font-medium">Logo Yüklemek için Tıklayın</span>
                                                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">PNG, JPG (Max 2MB)</p>
                                            </>
                                        )}
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* SEO TAB */}
                        {activeTab === 'seo' && (
                            <div className="space-y-6 animate-fade-in">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                        <Type className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                                        Site Başlığı & İçerik
                                    </h3>
                                    <div className="grid grid-cols-1 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Site Başlığı (Title)</label>
                                            <input
                                                type="text"
                                                className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 border p-2.5 text-slate-800 dark:text-white focus:ring-[#1193d4] focus:border-[#1193d4]"
                                                value={formData.siteTitle}
                                                onChange={(e) => setFormData({ ...formData, siteTitle: e.target.value })}
                                                placeholder="Örn: Aslan Emlak - Güvenilir Gayrimenkul"
                                            />
                                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Google arama sonuçlarında görünecek ana başlık.</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Hakkımızda Yazısı</label>
                                            <textarea
                                                rows={4}
                                                className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 border p-2.5 text-slate-800 dark:text-white focus:ring-[#1193d4] focus:border-[#1193d4]"
                                                value={formData.aboutText}
                                                onChange={(e) => setFormData({ ...formData, aboutText: e.target.value })}
                                                placeholder="Firmanız hakkında kısa bir tanıtım yazısı..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">İletişim Bilgileri</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Telefon</label>
                                            <input
                                                type="text"
                                                className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 border p-2.5 text-slate-800 dark:text-white focus:ring-[#1193d4] focus:border-[#1193d4]"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">E-posta</label>
                                            <input
                                                type="text"
                                                className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 border p-2.5 text-slate-800 dark:text-white focus:ring-[#1193d4] focus:border-[#1193d4]"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* Info Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm transition-colors">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4">Yayın Durumu</h3>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-3 h-3 rounded-full ${formData.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {formData.isActive ? 'Web Sitesi Yayında' : 'Yayında Değil'}
                            </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-slate-400 space-y-2">
                            <p>Son Güncelleme: <strong>Az önce</strong></p>
                            <p>Hosting: <strong>Standart Paket</strong></p>
                            <p>SSL Sertifikası: <strong>Aktif</strong></p>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#1193d4] to-blue-600 p-6 rounded-xl shadow-lg text-white">
                        <h3 className="font-bold text-lg mb-2">Pro İpuçları</h3>
                        <ul className="text-sm space-y-3 opacity-90">
                            <li className="flex gap-2">
                                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>SEO başlığınızda şehir ve emlak tipi geçirmeye özen gösterin.</span>
                            </li>
                            <li className="flex gap-2">
                                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>Harita odaklı tasarım, bölgesel çalışan emlakçılar için daha etkilidir.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WebBuilder;

