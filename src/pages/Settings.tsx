
import React, { useState } from 'react';
import { Download, Database, Shield, FileSpreadsheet, CheckCircle, AlertCircle, User, Save, Upload, Building } from 'lucide-react';
import { useData } from '../context/DataContext';
import { supabase } from '../services/supabaseClient';

const Settings: React.FC = () => {
    const { properties, customers, activities, requests, userProfile, updateUserProfile, session } = useData();
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
                alert("Dışa aktarılacak veri bulunamadı.");
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
                                                    alert('Yükleme başarısız: ' + error.message);
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

                                        alert("Ofisiniz başarıyla oluşturuldu! Artık yönetici panelindesiniz.");
                                        window.location.reload(); // Refresh to ensure all contexts reload
                                    } catch (err: any) {
                                        console.error(err);
                                        alert("Hata: " + err.message);
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
