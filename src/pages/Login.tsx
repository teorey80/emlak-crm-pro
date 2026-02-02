import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Mail, Lock, User, ArrowRight, Building2, AlertCircle, KeyRound } from 'lucide-react';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: ''
    });

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
                redirectTo: `${window.location.origin}/#/reset-password`,
            });

            if (error) throw error;
            setMessage({
                type: 'success',
                text: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen e-postanızı kontrol edin.'
            });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Şifre sıfırlama isteği gönderilemedi.' });
        } finally {
            setLoading(false);
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();

        if (mode === 'forgot') {
            return handleForgotPassword(e);
        }

        setLoading(true);
        setMessage(null);

        try {
            if (mode === 'signup') {
                const { data, error } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            full_name: formData.fullName,
                            avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName)}&background=random`
                        }
                    }
                });

                if (error) throw error;
                setMessage({ type: 'success', text: 'Kayıt başarılı! Lütfen e-postanızı doğrulayın veya giriş yapın.' });
                setMode('login');
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: formData.email,
                    password: formData.password
                });

                if (error) throw error;
                navigate('/');
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Bir hata oluştu.' });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });
            if (error) throw error;
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Google ile giriş yapılamadı.' });
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-slate-700">

                <div className="p-8 bg-sky-600 text-center">
                    <div className="bg-white/20 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        {mode === 'forgot' ? (
                            <KeyRound className="w-8 h-8 text-white" />
                        ) : (
                            <Building2 className="w-8 h-8 text-white" />
                        )}
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                        {mode === 'forgot' ? 'Şifre Sıfırlama' : 'Emlak CRM'}
                    </h1>
                    <p className="text-sky-100 text-sm">
                        {mode === 'forgot' ? 'E-posta adresinizi girin' : 'Profesyonel Emlak Yönetim Platformu'}
                    </p>
                </div>

                <div className="p-8">
                    {mode !== 'forgot' && (
                        <div className="flex gap-4 mb-8 bg-slate-100 dark:bg-slate-700/50 p-1 rounded-lg">
                            <button
                                onClick={() => { setMode('login'); setMessage(null); }}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'login' ? 'bg-white dark:bg-slate-600 shadow-sm text-sky-600 dark:text-sky-400' : 'text-gray-500 dark:text-slate-400'}`}
                            >
                                Giriş Yap
                            </button>
                            <button
                                onClick={() => { setMode('signup'); setMessage(null); }}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'signup' ? 'bg-white dark:bg-slate-600 shadow-sm text-sky-600 dark:text-sky-400' : 'text-gray-500 dark:text-slate-400'}`}
                            >
                                Kayıt Ol
                            </button>
                        </div>
                    )}

                    {message && (
                        <div className={`mb-6 p-3 rounded-lg flex items-start gap-3 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'}`}>
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-4">
                        {mode === 'signup' && (
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-700 dark:text-slate-300">Ad Soyad</label>
                                <div className="relative">
                                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
                                        placeholder="Adınız Soyadınız"
                                        value={formData.fullName}
                                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                        required={mode === 'signup'}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-700 dark:text-slate-300">E-posta Adresi</label>
                            <div className="relative">
                                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="email"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
                                    placeholder="ornek@email.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {mode !== 'forgot' && (
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-700 dark:text-slate-300">Şifre</label>
                                <div className="relative">
                                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="password"
                                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'İşlem yapılıyor...' : (
                                mode === 'forgot' ? 'Şifre Sıfırlama Linki Gönder' :
                                    mode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'
                            )}
                            {!loading && <ArrowRight className="w-4 h-4" />}
                        </button>

                        {mode === 'login' && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => { setMode('forgot'); setMessage(null); }}
                                    className="w-full text-sm text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 mt-3"
                                >
                                    Şifremi Unuttum
                                </button>

                                <div className="relative my-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-200 dark:border-slate-600"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-2 bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400">veya</span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleGoogleLogin}
                                    className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 text-gray-700 dark:text-white font-medium py-3 rounded-lg flex items-center justify-center gap-3 transition-all"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Google ile Giriş Yap
                                </button>
                            </>
                        )}

                        {mode === 'forgot' && (
                            <button
                                type="button"
                                onClick={() => { setMode('login'); setMessage(null); }}
                                className="w-full text-sm text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300 mt-3"
                            >
                                ← Giriş Ekranına Dön
                            </button>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;

