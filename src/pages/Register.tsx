import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Mail, Lock, User, ArrowRight, Building2, AlertCircle, UserPlus, Users } from 'lucide-react';

type RegisterMode = 'individual' | 'office';

const Register: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const officeId = searchParams.get('officeId');

    // Determine mode: if officeId exists, it's office join mode; otherwise individual
    const [mode, setMode] = useState<RegisterMode>(officeId ? 'office' : 'individual');

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
    const [officeName, setOfficeName] = useState<string>('');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        phone: '',
        // For individual users who want to create an office
        createOffice: false,
        newOfficeName: ''
    });

    useEffect(() => {
        if (officeId) {
            setMode('office');
            fetchOfficeDetails();
        }
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
            // 1. Sign Up with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName)}&background=random`
                    }
                }
            });

            if (authError) throw authError;

            if (authData.user) {
                let targetOfficeId = officeId;

                // For individual users who want to create their own office
                if (mode === 'individual' && formData.createOffice && formData.newOfficeName) {
                    const { data: newOffice, error: officeError } = await supabase
                        .from('offices')
                        .insert({
                            name: formData.newOfficeName,
                            owner_id: authData.user.id
                        })
                        .select()
                        .single();

                    if (officeError) {
                        console.error('Office creation error:', officeError);
                    } else if (newOffice) {
                        targetOfficeId = newOffice.id;
                    }
                }

                // 2. Update/Create Profile
                const updateProfile = async (retries = 5) => {
                    console.log(`Starting profile update for user: ${authData.user!.id}`);

                    for (let i = 0; i < retries; i++) {
                        try {
                            const profileData: any = {
                                id: authData.user!.id,
                                full_name: formData.fullName,
                                email: formData.email,
                                phone: formData.phone || null,
                                avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName)}`,
                                updated_at: new Date(),
                                subscription_plan: 'free'
                            };

                            if (mode === 'office' && targetOfficeId) {
                                // Joining an existing office
                                profileData.office_id = targetOfficeId;
                                profileData.role = 'consultant';
                                profileData.is_individual = false;
                            } else if (mode === 'individual') {
                                // Individual user
                                profileData.is_individual = true;
                                profileData.role = 'broker'; // Individual users are their own broker

                                if (targetOfficeId) {
                                    // Created their own office
                                    profileData.office_id = targetOfficeId;
                                }
                            }

                            // Try update first
                            const { error: updateError, data: updateData } = await supabase
                                .from('profiles')
                                .update(profileData)
                                .eq('id', authData.user!.id)
                                .select()
                                .single();

                            if (!updateError && updateData) {
                                console.log("Profile successfully updated via UPDATE");
                                return true;
                            }

                            // If update failed, try upsert
                            const { error: upsertError } = await supabase
                                .from('profiles')
                                .upsert(profileData);

                            if (!upsertError) {
                                console.log("Profile successfully created/updated via UPSERT");
                                return true;
                            }

                            console.error(`Attempt ${i + 1} failed:`, upsertError);
                        } catch (err) {
                            console.error(`Attempt ${i + 1} exception:`, err);
                        }

                        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
                    }
                    return false;
                };

                const success = await updateProfile();

                if (!success) {
                    console.error("CRITICAL: Profile update failed after all retries.");
                    setMessage({ type: 'error', text: 'Kayıt oldu ancak profil oluşturulamadı. Lütfen tekrar deneyin.' });
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-white flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100">

                {/* Header */}
                <div className={`p-8 text-center ${mode === 'office' ? 'bg-indigo-600' : 'bg-gradient-to-r from-blue-600 to-blue-700'}`}>
                    <div className="bg-white/20 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        {mode === 'office' ? (
                            <Users className="w-8 h-8 text-white" />
                        ) : (
                            <UserPlus className="w-8 h-8 text-white" />
                        )}
                    </div>

                    {mode === 'office' ? (
                        <>
                            <h1 className="text-2xl font-bold text-white mb-2">Ekibe Katıl</h1>
                            {officeName ? (
                                <p className="text-indigo-100 text-sm">Ofis: <strong>{officeName}</strong></p>
                            ) : (
                                <p className="text-indigo-100 text-sm">Ofis bilgisi yükleniyor...</p>
                            )}
                        </>
                    ) : (
                        <>
                            <h1 className="text-2xl font-bold text-white mb-2">Ücretsiz Hesap Oluştur</h1>
                            <p className="text-blue-100 text-sm">Emlak CRM'i hemen kullanmaya başlayın</p>
                        </>
                    )}
                </div>

                {/* Mode Selector (only show if no officeId) */}
                {!officeId && (
                    <div className="flex border-b border-gray-100">
                        <button
                            type="button"
                            onClick={() => setMode('individual')}
                            className={`flex-1 py-3 text-sm font-medium transition ${
                                mode === 'individual'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <UserPlus className="w-4 h-4 inline mr-2" />
                            Bireysel Kayıt
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('office')}
                            className={`flex-1 py-3 text-sm font-medium transition ${
                                mode === 'office'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Users className="w-4 h-4 inline mr-2" />
                            Ofise Katıl
                        </button>
                    </div>
                )}

                <div className="p-8">
                    {message && (
                        <div className={`mb-6 p-3 rounded-lg flex items-start gap-3 text-sm ${
                            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            {message.text}
                        </div>
                    )}

                    {/* Office join mode without link */}
                    {mode === 'office' && !officeId && (
                        <div className="mb-6 p-4 bg-amber-50 rounded-lg">
                            <p className="text-amber-800 text-sm">
                                <AlertCircle className="w-4 h-4 inline mr-1" />
                                Bir ofise katılmak için yöneticinizden davet linki almanız gerekiyor.
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSignup} className="space-y-4">
                        {/* Full Name */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-700">Ad Soyad</label>
                            <div className="relative">
                                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                                    placeholder="Adınız Soyadınız"
                                    value={formData.fullName}
                                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-700">E-posta Adresi</label>
                            <div className="relative">
                                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="email"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                                    placeholder="ornek@email.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {/* Phone (optional) */}
                        {mode === 'individual' && (
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-700">Telefon (Opsiyonel)</label>
                                <input
                                    type="tel"
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                                    placeholder="0555 123 4567"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        )}

                        {/* Password */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-700">Şifre Oluştur</label>
                            <div className="relative">
                                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="password"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    minLength={6}
                                />
                            </div>
                            <p className="text-xs text-gray-500">En az 6 karakter</p>
                        </div>

                        {/* Create Office Option (for individual mode) */}
                        {mode === 'individual' && (
                            <div className="space-y-3 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.createOffice}
                                        onChange={e => setFormData({ ...formData, createOffice: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Kendi ofisimi oluşturmak istiyorum</span>
                                </label>

                                {formData.createOffice && (
                                    <div className="relative">
                                        <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                                            placeholder="Ofis Adı"
                                            value={formData.newOfficeName}
                                            onChange={e => setFormData({ ...formData, newOfficeName: e.target.value })}
                                            required={formData.createOffice}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Free Plan Info */}
                        {mode === 'individual' && (
                            <div className="bg-blue-50 rounded-lg p-4 mt-4">
                                <p className="text-sm text-blue-800 font-medium mb-2">Ücretsiz Plan Dahil:</p>
                                <ul className="text-xs text-blue-700 space-y-1">
                                    <li>✓ 20 Portföy</li>
                                    <li>✓ 50 Müşteri</li>
                                    <li>✓ Kişisel Web Sitesi</li>
                                    <li>✓ Sınırsız Aktivite Kaydı</li>
                                </ul>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || (mode === 'office' && !officeId)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Kayıt Yapılıyor...' : mode === 'office' ? 'Ekibe Katıl' : 'Ücretsiz Hesap Oluştur'}
                            {!loading && <ArrowRight className="w-4 h-4" />}
                        </button>
                    </form>

                    <div className="mt-6 text-center space-y-2">
                        <p className="text-sm text-slate-500">
                            Zaten hesabınız var mı?{' '}
                            <Link to="/login" className="text-blue-600 hover:underline font-medium">Giriş Yap</Link>
                        </p>
                        <Link to="/home" className="text-xs text-gray-400 hover:text-gray-600">
                            ← Ana Sayfaya Dön
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
