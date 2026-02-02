
import React, { useState } from 'react';
import { Download, Database, Shield, FileSpreadsheet, CheckCircle, AlertCircle, User, Save, Upload, Building, Palette, Sun, Moon, Check, CreditCard, Crown, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../services/supabaseClient';

const Settings: React.FC = () => {
    const { properties, customers, activities, requests, userProfile, updateUserProfile, session, subscription, planLimits, getUsageStats } = useData();
    const { currentTheme, setTheme, allThemes, isDark, toggleDark } = useTheme();
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    // Get usage stats
    const usageStats = getUsageStats();
    const [exportStatus, setExportStatus] = useState<string | null>(null);
    const [profileForm, setProfileForm] = useState(userProfile);
    const [savedStatus, setSavedStatus] = useState(false);

    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        updateUserProfile(profileForm);
        setSavedStatus(true);
        setTimeout(() => setSavedStatus(false), 3000);
    };

    // Helper function to convert JSON data to CSV
    const convertToCSV = (data: any[]) => {
        if (data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const rows = data.map(obj =>
            headers.map(header => {
                let val = obj[header];
                // Handle arrays or objects (stringify them)
                if (typeof val === 'object') val = JSON.stringify(val);
                // Escape quotes and wrap in quotes to handle commas in data
                const stringVal = String(val === null || val === undefined ? '' : val);
                return `"${stringVal.replace(/"/g, '""')}"`;
            }).join(',')
        );

        return [headers.join(','), ...rows].join('\n');
    };

    const downloadCSV = (data: any[], filename: string) => {
        try {
            if (data.length === 0) {
                toast.error("Dışa aktarılacak veri bulunamadı.");
                return;
            }
            const csvData = convertToCSV(data);
            const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel compatibility
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setExportStatus(`${filename} başarıyla indirildi.`);
            setTimeout(() => setExportStatus(null), 3000);
        } catch (error) {
            console.error("Export error:", error);
            setExportStatus("Hata oluştu.");
        }
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-12">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-slate-900 dark:bg-slate-700 p-2 rounded-lg text-white">
                    <Database className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Ayarlar ve Veri Yönetimi</h2>
                    <p className="text-gray-500 dark:text-slate-400 text-sm">Uygulama verilerini yönetin ve profilinizi düzenleyin.</p>
                </div>
            </div>

            {/* Profile Settings */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden transition-colors">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-600" />
                        Profil Ayarları
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                        Admin panelinde görünen adınız, ünvanınız ve profil fotoğrafınız.
                    </p>
                </div>

                <div className="p-6">
                    <form onSubmit={handleSaveProfile} className="flex flex-col md:flex-row gap-8">
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative group">
                                <img
                                    src={profileForm.avatar}
                                    alt="Admin Avatar"
                                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-100 dark:border-slate-700 shadow-sm"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=Admin&background=random';
                                    }}
                                />
                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <span className="text-white text-xs font-medium">Önizleme</span>
                                </div>
                            </div>
                            <div className="text-xs text-gray-400 text-center max-w-[150px]">
                                Profil fotoğrafı için bir URL giriniz.
                            </div>
                        </div>

                        <div className="flex-1 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Ad Soyad</label>
                                    <input
                                        type="text"
                                        className="w-full text-sm rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 p-2.5 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                        value={profileForm.name}
                                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Ünvan</label>
                                    <input
                                        type="text"
                                        className="w-full text-sm rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 p-2.5 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                        value={profileForm.title}
                                        onChange={(e) => setProfileForm({ ...profileForm, title: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Profil Fotoğrafı</label>
                                <div className="flex gap-2 items-center">
                                    <div className="relative flex-1">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            id="avatar-upload"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;

                                                try {
                                                    setExportStatus('Fotoğraf yükleniyor...'); // Reusing status state for UI feedback

                                                    const fileExt = file.name.split('.').pop();
                                                    const fileName = `${session?.user?.id}-${Date.now()}.${fileExt}`;
                                                    const filePath = `${fileName}`;

                                                    // 1. Upload to Supabase Storage
                                                    const { error: uploadError } = await supabase.storage
                                                        .from('avatars')
                                                        .upload(filePath, file);

                                                    if (uploadError) throw uploadError;

                                                    // 2. Get Public URL
                                                    const { data: { publicUrl } } = supabase.storage
                                                        .from('avatars')
                                                        .getPublicUrl(filePath);

                                                    // 3. Update State
                                                    setProfileForm({ ...profileForm, avatar: publicUrl });
                                                    setExportStatus(null);
                                                } catch (error: any) {
                                                    console.error('Upload Error:', error);
                                                    toast.error('Yükleme başarısız: ' + error.message);
                                                    setExportStatus(null);
                                                }
                                            }}
                                        />
                                        <label
                                            htmlFor="avatar-upload"
                                            className="flex items-center gap-2 w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors text-sm text-gray-600 dark:text-slate-300"
                                        >
                                            <Upload className="w-4 h-4" />
                                            {exportStatus === 'Fotoğraf yükleniyor...' ? 'Yükleniyor...' : 'Fotoğraf Seç veya Yükle'}
                                        </label>
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <input
                                        type="text"
                                        placeholder="veya görsel linki yapıştırın..."
                                        className="w-full text-xs rounded-lg border-gray-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-2 dark:text-slate-400 focus:ring-blue-500 focus:border-blue-500"
                                        value={profileForm.avatar}
                                        onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Supabase 'avatars' deposuna yüklenir.</p>
                            </div>

                            <div className="pt-2 flex items-center gap-3">
                                <button
                                    type="submit"
                                    className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    Bilgileri Güncelle
                                </button>
                                {savedStatus && (
                                    <span className="text-green-600 text-sm font-medium flex items-center gap-1 animate-fade-in">
                                        <CheckCircle className="w-4 h-4" /> Kaydedildi
                                    </span>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* Subscription & Plan Section */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden transition-colors">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-purple-600" />
                        Abonelik ve Plan
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                        Mevcut planınızı ve kullanım durumunuzu görüntüleyin.
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Current Plan */}
                    <div className={`p-6 rounded-xl border-2 ${
                        subscription?.plan === 'pro'
                            ? 'bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800'
                            : 'bg-gradient-to-br from-gray-50 to-slate-50 dark:from-slate-700/50 dark:to-slate-700/30 border-gray-200 dark:border-slate-600'
                    }`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                {subscription?.plan === 'pro' ? (
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                                        <Crown className="w-6 h-6 text-white" />
                                    </div>
                                ) : (
                                    <div className="w-12 h-12 bg-gray-200 dark:bg-slate-600 rounded-xl flex items-center justify-center">
                                        <Zap className="w-6 h-6 text-gray-500 dark:text-slate-400" />
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-slate-400">Mevcut Plan</p>
                                    <p className="text-2xl font-bold text-slate-800 dark:text-white">
                                        {subscription?.plan === 'pro' ? 'Pro' : 'Ücretsiz'}
                                    </p>
                                </div>
                            </div>
                            {subscription?.plan === 'pro' && (
                                <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-sm font-medium">
                                    Aktif
                                </span>
                            )}
                        </div>

                        {/* Usage Stats */}
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-100 dark:border-slate-700">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600 dark:text-slate-400">Portföy</span>
                                    <span className="text-sm font-medium text-slate-800 dark:text-white">
                                        {usageStats.propertyCount} / {usageStats.propertyLimit === Infinity ? '∞' : usageStats.propertyLimit}
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${
                                            usageStats.propertyLimit !== Infinity && usageStats.propertyCount / usageStats.propertyLimit >= 0.9
                                                ? 'bg-red-500'
                                                : usageStats.propertyLimit !== Infinity && usageStats.propertyCount / usageStats.propertyLimit >= 0.7
                                                    ? 'bg-amber-500'
                                                    : 'bg-blue-500'
                                        }`}
                                        style={{
                                            width: usageStats.propertyLimit === Infinity
                                                ? '10%'
                                                : `${Math.min((usageStats.propertyCount / usageStats.propertyLimit) * 100, 100)}%`
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-100 dark:border-slate-700">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600 dark:text-slate-400">Müşteri</span>
                                    <span className="text-sm font-medium text-slate-800 dark:text-white">
                                        {usageStats.customerCount} / {usageStats.customerLimit === Infinity ? '∞' : usageStats.customerLimit}
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${
                                            usageStats.customerLimit !== Infinity && usageStats.customerCount / usageStats.customerLimit >= 0.9
                                                ? 'bg-red-500'
                                                : usageStats.customerLimit !== Infinity && usageStats.customerCount / usageStats.customerLimit >= 0.7
                                                    ? 'bg-amber-500'
                                                    : 'bg-emerald-500'
                                        }`}
                                        style={{
                                            width: usageStats.customerLimit === Infinity
                                                ? '10%'
                                                : `${Math.min((usageStats.customerCount / usageStats.customerLimit) * 100, 100)}%`
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Upgrade CTA (for Free users) */}
                    {subscription?.plan !== 'pro' && (
                        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-xl text-white">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h4 className="text-lg font-bold mb-2">Pro'ya Yükselt</h4>
                                    <p className="text-purple-100 text-sm mb-4">
                                        Sınırsız portföy ve müşteri, özel domain desteği, öncelikli destek ve daha fazlası.
                                    </p>
                                    <ul className="text-sm text-purple-100 space-y-1 mb-4">
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4" /> Sınırsız Portföy
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4" /> Sınırsız Müşteri
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4" /> Öncelikli Destek
                                        </li>
                                    </ul>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold">199₺</p>
                                    <p className="text-purple-200 text-sm">/ay</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowUpgradeModal(true)}
                                className="w-full mt-4 bg-white text-purple-600 py-3 rounded-lg font-semibold hover:bg-purple-50 transition"
                            >
                                Pro'ya Yükselt
                            </button>
                        </div>
                    )}

                    {/* Pro user info */}
                    {subscription?.plan === 'pro' && (
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-900/30">
                            <p className="text-green-800 dark:text-green-200 text-sm flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Pro planınız aktif. Tüm özelliklere sınırsız erişiminiz var.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Upgrade Modal */}
            {showUpgradeModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Crown className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Pro'ya Yükselt</h3>
                            <p className="text-gray-500 dark:text-slate-400 mt-2">
                                Aylık 199₺ ile sınırsız kullanım
                            </p>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
                            <p className="text-blue-800 dark:text-blue-200 text-sm">
                                <strong>Ödeme Yöntemi:</strong> Şu an için ödeme sistemi entegre değil.
                                Pro plana geçmek için bizimle iletişime geçin:
                            </p>
                            <p className="text-blue-600 dark:text-blue-300 font-medium mt-2">
                                destek@emlakcrm.com
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowUpgradeModal(false)}
                                className="flex-1 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                            >
                                Kapat
                            </button>
                            <a
                                href="mailto:destek@emlakcrm.com?subject=Pro%20Plan%20Talebi"
                                className="flex-1 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition text-center"
                            >
                                E-posta Gönder
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Theme Settings Section */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden transition-colors">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                        <Palette className="w-5 h-5 text-purple-600" />
                        Tema Ayarları
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                        Panelin görsel temasını ve renk şemasını özelleştirin.
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Dark Mode Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-600">
                        <div className="flex items-center gap-3">
                            {isDark ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
                            <div>
                                <div className="font-medium text-slate-800 dark:text-white">Karanlık Mod</div>
                                <div className="text-sm text-gray-500 dark:text-slate-400">
                                    {isDark ? 'Karanlık tema aktif' : 'Aydınlık tema aktif'}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={toggleDark}
                            className={`relative w-14 h-7 rounded-full transition-colors ${
                                isDark ? 'bg-indigo-600' : 'bg-gray-300'
                            }`}
                        >
                            <div
                                className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                    isDark ? 'translate-x-8' : 'translate-x-1'
                                }`}
                            />
                        </button>
                    </div>

                    {/* Theme Selection */}
                    <div>
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Renk Teması Seçin</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {allThemes.map((theme) => (
                                <button
                                    key={theme.id}
                                    onClick={() => {
                                        setTheme(theme.id);
                                        toast.success(`${theme.name} teması uygulandı`);
                                    }}
                                    className={`relative p-4 rounded-xl border-2 transition-all text-left hover:shadow-md ${
                                        currentTheme.id === theme.id
                                            ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                                            : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                                    }`}
                                >
                                    {currentTheme.id === theme.id && (
                                        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                            <Check className="w-4 h-4 text-white" />
                                        </div>
                                    )}

                                    {/* Color Preview */}
                                    <div className="flex gap-1.5 mb-3">
                                        <div
                                            className="w-8 h-8 rounded-lg shadow-inner"
                                            style={{ backgroundColor: theme.colors.primary }}
                                            title="Ana renk"
                                        />
                                        <div
                                            className="w-8 h-8 rounded-lg shadow-inner"
                                            style={{ backgroundColor: theme.colors.accent }}
                                            title="Vurgu rengi"
                                        />
                                        <div
                                            className="w-8 h-8 rounded-lg shadow-inner border border-gray-200 dark:border-slate-600"
                                            style={{ backgroundColor: isDark ? theme.colors.sidebarBgDark : theme.colors.sidebarBg }}
                                            title="Kenar çubuğu"
                                        />
                                        <div
                                            className="w-8 h-8 rounded-lg shadow-inner"
                                            style={{ backgroundColor: theme.colors.fabBg }}
                                            title="FAB rengi"
                                        />
                                    </div>

                                    <div className="font-semibold text-slate-800 dark:text-white text-sm">
                                        {theme.name}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                                        {theme.description}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Current Theme Info */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-700/50 dark:to-slate-700/30 p-4 rounded-xl border border-gray-100 dark:border-slate-600">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs text-gray-400 uppercase font-semibold mb-1">Aktif Tema</div>
                                <div className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: currentTheme.colors.primary }}
                                    />
                                    {currentTheme.name}
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-slate-400">
                                {isDark ? 'Karanlık' : 'Aydınlık'} mod
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Office Settings Section */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden transition-colors">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                        <Building className="w-5 h-5 text-indigo-600" />
                        Ofis Yönetimi
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                        {userProfile.officeId ? 'Ofis bilgilerinizi güncelleyin.' : 'Kendi emlak ofisinizi oluşturun ve yönetmeye başlayın.'}
                    </p>
                </div>

                <div className="p-6">
                    {!userProfile.officeId ? (
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-xl border border-indigo-100 dark:border-indigo-900/30 text-center">
                            <h4 className="text-indigo-800 dark:text-indigo-200 font-bold text-lg mb-2">Henüz Bir Ofise Bağlı Değilsiniz</h4>
                            <p className="text-indigo-600 dark:text-indigo-300 mb-6 max-w-lg mx-auto">
                                Kendi ofisinizi oluşturarak yönetici (Broker) olabilir ve ekibinizi kurabilirsiniz.
                            </p>
                            <button
                                onClick={async () => {
                                    const officeName = prompt("Ofisinizin Adı Nedir?");
                                    if (!officeName) return;

                                    try {
                                        // 1. Create Office
                                        const { data: office, error: officeError } = await supabase
                                            .from('offices')
                                            .insert([{
                                                name: officeName,
                                                owner_id: session?.user?.id
                                            }])
                                            .select()
                                            .single();

                                        if (officeError) throw officeError;

                                        // 2. Update Profile to link to this office and set role to broker
                                        const { error: profileError } = await supabase
                                            .from('profiles')
                                            .update({
                                                office_id: office.id,
                                                role: 'broker'
                                            })
                                            .eq('id', session?.user?.id);

                                        if (profileError) throw profileError;

                                        // 3. Update Local State
                                        updateUserProfile({
                                            ...userProfile,
                                            officeId: office.id,
                                            role: 'broker'
                                        });

                                        toast.success("Ofisiniz başarıyla oluşturuldu!");
                                        window.location.reload(); // Refresh to ensure all contexts reload
                                    } catch (err: any) {
                                        console.error(err);
                                        toast.error("Hata: " + err.message);
                                    }
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/30"
                            >
                                Yeni Ofis Oluştur
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-100 dark:border-slate-600">
                                <div>
                                    <div className="text-xs text-gray-400 uppercase font-semibold mb-1">Bağlı Olduğunuz Ofis</div>
                                    <div className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        {userProfile.role === 'broker' && <Shield className="w-4 h-4 text-amber-500" />}
                                        {/* Fetch office name later, for now showing ID or generic text until we fetch specific office details */}
                                        Ofis ID: <code className="text-sm font-mono bg-white dark:bg-slate-800 px-2 py-1 rounded border border-gray-200 dark:border-slate-600">{userProfile.officeId}</code>
                                    </div>
                                    <div className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                        {userProfile.role === 'broker' ? 'Yönetici (Broker)' : 'Danışman'}
                                    </div>
                                </div>
                                {userProfile.role === 'broker' && (
                                    <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                                        Düzenle
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Data Export Section */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden transition-colors">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-green-600" />
                        Veri Dışa Aktarma (Excel / CSV)
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                        Sistemdeki verilerinizi Excel'de açabileceğiniz CSV formatında bilgisayarınıza indirin.
                    </p>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 border border-gray-200 dark:border-slate-700 rounded-xl hover:border-sky-300 dark:hover:border-sky-700 transition-colors bg-white dark:bg-slate-800">
                        <div className="mb-2 font-semibold text-slate-700 dark:text-slate-200">Emlak Portföyü</div>
                        <div className="text-sm text-gray-500 dark:text-slate-400 mb-4">{properties.length} Kayıt</div>
                        <button
                            onClick={() => downloadCSV(properties, 'emlaklar')}
                            className="w-full py-2 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 rounded-lg text-sm font-medium hover:bg-sky-100 dark:hover:bg-sky-900/40 flex items-center justify-center gap-2 transition-colors"
                        >
                            <Download className="w-4 h-4" /> İndir
                        </button>
                    </div>

                    <div className="p-4 border border-gray-200 dark:border-slate-700 rounded-xl hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors bg-white dark:bg-slate-800">
                        <div className="mb-2 font-semibold text-slate-700 dark:text-slate-200">Müşteri Listesi</div>
                        <div className="text-sm text-gray-500 dark:text-slate-400 mb-4">{customers.length} Kayıt</div>
                        <button
                            onClick={() => downloadCSV(customers, 'musteriler')}
                            className="w-full py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/40 flex items-center justify-center gap-2 transition-colors"
                        >
                            <Download className="w-4 h-4" /> İndir
                        </button>
                    </div>

                    <div className="p-4 border border-gray-200 dark:border-slate-700 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors bg-white dark:bg-slate-800">
                        <div className="mb-2 font-semibold text-slate-700 dark:text-slate-200">Aktiviteler</div>
                        <div className="text-sm text-gray-500 dark:text-slate-400 mb-4">{activities.length} Kayıt</div>
                        <button
                            onClick={() => downloadCSV(activities, 'aktiviteler')}
                            className="w-full py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/40 flex items-center justify-center gap-2 transition-colors"
                        >
                            <Download className="w-4 h-4" /> İndir
                        </button>
                    </div>

                    <div className="p-4 border border-gray-200 dark:border-slate-700 rounded-xl hover:border-amber-300 dark:hover:border-amber-700 transition-colors bg-white dark:bg-slate-800">
                        <div className="mb-2 font-semibold text-slate-700 dark:text-slate-200">Talepler</div>
                        <div className="text-sm text-gray-500 dark:text-slate-400 mb-4">{requests.length} Kayıt</div>
                        <button
                            onClick={() => downloadCSV(requests, 'talepler')}
                            className="w-full py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-lg text-sm font-medium hover:bg-amber-100 dark:hover:bg-amber-900/40 flex items-center justify-center gap-2 transition-colors"
                        >
                            <Download className="w-4 h-4" /> İndir
                        </button>
                    </div>
                </div>

                {exportStatus && (
                    <div className="px-6 pb-4 animate-fade-in">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-sm font-medium">
                            <CheckCircle className="w-4 h-4" />
                            {exportStatus}
                        </div>
                    </div>
                )}
            </div>

            {/* Security & Info */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 transition-colors">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                    Kullanıcı ve Sistem Bilgileri
                </h3>
                <div className="prose prose-sm text-gray-600 dark:text-slate-300 max-w-none space-y-4">
                    {session?.user && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30 text-blue-800 dark:text-blue-200">
                            <h4 className="font-bold mb-1">Hesap Bilgileri</h4>
                            <p className="mb-2">Giriş yapmış hesabınızın sistemlik kimliği (ID):</p>
                            <code className="bg-white dark:bg-slate-800 px-2 py-1 rounded border border-blue-200 dark:border-blue-800 select-all font-mono text-xs">
                                {session.user.id}
                            </code>
                            <p className="mt-2 text-xs opacity-80">
                                *Eski verileri bu hesaba aktarmak için bu ID'ye ihtiyacınız olabilir.
                            </p>
                        </div>
                    )}

                    <p>
                        <strong>Kullanıcı Testi:</strong> Uygulamayı başka bir kullanıcının test etmesini istiyorsanız, <code>{window.location.origin}</code> adresini paylaşabilirsiniz.
                    </p>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-100 dark:border-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs">
                        Uygulama verileri tarayıcı önbelleğinde saklanır. Önbelleği temizlemek verileri silebilir. Düzenli olarak "İndir" butonları ile yedek alınız.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
