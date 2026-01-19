import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Mail, Lock, User, ArrowRight, Building2, AlertCircle } from 'lucide-react';

const Register: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const officeId = searchParams.get('officeId');

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
    const [officeName, setOfficeName] = useState<string>('');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: ''
    });

    useEffect(() => {
        if (!officeId) {
            setMessage({ type: 'error', text: 'Geçersiz davet linki. Ofis ID bulunamadı.' });
            return;
        }
        fetchOfficeDetails();
    }, [officeId]);

    const fetchOfficeDetails = async () => {
        if (!officeId) return;
        try {
            const { data, error } = await supabase
                .from('offices')
                .select('name')
                .eq('id', officeId)
                .single();

            if (data) setOfficeName(data.name);
            if (error) console.error(error);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            if (!officeId) throw new Error('Ofis bilgisi eksik.');

            // 1. Sign Up
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName)}&background=random`
                        // Note: We can't set office_id in metadata easily to trigger DB triggers without extra setup.
                        // We will update the profile manually after signup.
                    }
                }
            });

            if (authError) throw authError;

            if (authData.user) {
                // 2. Update Profile with Office ID
                // We attempt to update first (in case trigger created it), then upsert if needed.
                // We'll also verify the update succeeded.

                const updateProfile = async (retries = 5) => {
                    console.log(`Starting profile update for user: ${authData.user!.id}, Office: ${officeId}`);
                    for (let i = 0; i < retries; i++) {
                        try {
                            // First try to update existing profile (triggered by auth.users insert)
                            const { error: updateError, data: updateData } = await supabase
                                .from('profiles')
                                .update({
                                    office_id: officeId,
                                    role: 'consultant',
                                    full_name: formData.fullName,
                                    email: formData.email, // Explicitly syncing email
                                    updated_at: new Date()
                                })
                                .eq('id', authData.user!.id)
                                .select()
                                .single();

                            if (!updateError && updateData) {
                                console.log("Profile successfully updated via UPDATE");
                                return true;
                            }

                            console.warn(`Update attempt ${i + 1} failed, trying UPSERT...`, updateError);

                            // If update failed (maybe profile doesn't exist yet), try upsert
                            const { error: upsertError } = await supabase
                                .from('profiles')
                                .upsert({
                                    id: authData.user!.id,
                                    office_id: officeId,
                                    role: 'consultant',
                                    full_name: formData.fullName,
                                    avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName)}`,
                                    email: formData.email,
                                    updated_at: new Date()
                                });

                            if (!upsertError) {
                                console.log("Profile successfully created/updated via UPSERT");
                                return true;
                            }

                            console.error(`Upsert attempt ${i + 1} failed:`, upsertError);
                        } catch (err) {
                            console.error(`Attempt ${i + 1} exception:`, err);
                        }

                        // Wait before retry with exponential backoff
                        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
                    }
                    return false;
                };

                const success = await updateProfile();

                if (!success) {
                    console.error("CRITICAL: Profile update failed after all retries.");
                    setMessage({ type: 'error', text: 'Kayıt oldu ancak ofis bağlantısı kurulamadı. Lütfen yönetici ile iletişime geçin.' });
                    return;
                }

                setMessage({ type: 'success', text: 'Kayıt başarılı! Yönlendiriliyorsunuz...' });
                setTimeout(() => navigate('/login'), 2000);
            }

        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Kayıt sırasında bir hata oluştu.' });
        } finally {
            setLoading(false);
        }
    };

    if (!officeId) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
                <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-800">Geçersiz Davet</h2>
                    <p className="text-slate-600 mt-2">Bu sayfaya erişmek için geçerli bir ofis davet linkine ihtiyacınız var.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-slate-700">

                <div className="p-8 bg-indigo-600 text-center">
                    <div className="bg-white/20 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Ekibe Katıl</h1>
                    {officeName ? (
                        <p className="text-indigo-100 text-sm">Ofis: <strong>{officeName}</strong></p>
                    ) : (
                        <p className="text-indigo-100 text-sm">Ofis bilgisi yükleniyor...</p>
                    )}
                </div>

                <div className="p-8">
                    {message && (
                        <div className={`mb-6 p-3 rounded-lg flex items-start gap-3 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSignup} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-700 dark:text-slate-300">Ad Soyad</label>
                            <div className="relative">
                                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                                    placeholder="Adınız Soyadınız"
                                    value={formData.fullName}
                                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-700 dark:text-slate-300">E-posta Adresi</label>
                            <div className="relative">
                                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="email"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                                    placeholder="ornek@email.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-700 dark:text-slate-300">Şifre Oluştur</label>
                            <div className="relative">
                                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="password"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all mt-6 disabled:opacity-50"
                        >
                            {loading ? 'Kayıt Yapılıyor...' : 'Ekibe Katıl & Kayıt Ol'}
                            {!loading && <ArrowRight className="w-4 h-4" />}
                        </button>
                    </form>

                    <div className="mt-4 text-center">
                        <p className="text-xs text-slate-500">Zaten hesabınız var mı? <a href="/#/login" className="text-indigo-600 hover:underline">Giriş Yap</a></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
