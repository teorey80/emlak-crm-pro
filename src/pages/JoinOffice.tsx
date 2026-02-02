import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, Users, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { validateInvitation, joinOffice, OfficeInvitation } from '../services/officeService';
import { useData } from '../context/DataContext';
import toast from 'react-hot-toast';

export const JoinOffice: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const { user } = useData();

    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [invitation, setInvitation] = useState<OfficeInvitation | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (token) {
            validateToken(token);
        }
    }, [token]);

    const validateToken = async (token: string) => {
        setLoading(true);
        setError(null);

        const result = await validateInvitation(token);

        if (result) {
            setInvitation(result);
        } else {
            setError('Bu davet linki geçersiz veya süresi dolmuş.');
        }

        setLoading(false);
    };

    const handleJoin = async () => {
        if (!token || !user) {
            toast.error('Önce giriş yapmalısınız');
            navigate('/login');
            return;
        }

        setJoining(true);

        const result = await joinOffice(token);

        if (result.success) {
            toast.success(`${result.office?.name || 'Ofis'}'e başarıyla katıldınız!`);
            navigate('/');
            window.location.reload(); // Refresh to get new office context
        } else {
            toast.error(result.error || 'Katılım sırasında bir hata oluştu');
        }

        setJoining(false);
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto mb-4" />
                    <p className="text-white/70">Davet linki doğrulanıyor...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900/20 to-slate-900 flex items-center justify-center p-4">
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full text-center border border-red-500/30">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <XCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Geçersiz Davet</h1>
                    <p className="text-white/70 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                    >
                        Ana Sayfaya Dön
                    </button>
                </div>
            </div>
        );
    }

    // Not logged in
    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-4">
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full border border-white/20">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Building2 className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">
                            {invitation?.offices?.name || 'Ofis'}'e Davet Edildiniz!
                        </h1>
                        <p className="text-white/70">
                            Ekibe katılmak için önce giriş yapmalısınız.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={() => navigate(`/login?redirect=/join/${token}`)}
                            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                        >
                            Giriş Yap
                        </button>
                        <button
                            onClick={() => navigate(`/register?redirect=/join/${token}`)}
                            className="w-full py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors border border-white/20"
                        >
                            Hesap Oluştur
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Main invitation view
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-4">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full border border-white/20">
                {/* Office Logo/Name */}
                <div className="text-center mb-8">
                    {invitation?.offices?.logo ? (
                        <img
                            src={invitation.offices.logo}
                            alt={invitation.offices.name}
                            className="w-20 h-20 rounded-2xl mx-auto mb-4 object-cover"
                        />
                    ) : (
                        <div className="w-20 h-20 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Building2 className="w-10 h-10 text-indigo-400" />
                        </div>
                    )}
                    <h1 className="text-2xl font-bold text-white mb-2">
                        {invitation?.offices?.name || 'Ofis'}'e Katıl
                    </h1>
                    <p className="text-white/70">
                        Bu ofise <span className="text-indigo-300 font-medium">
                            {invitation?.role === 'broker' ? 'Broker' : 'Danışman'}
                        </span> olarak davet edildiniz.
                    </p>
                </div>

                {/* Info Box */}
                <div className="bg-white/5 rounded-2xl p-4 mb-6 space-y-3">
                    <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-indigo-400" />
                        <span className="text-white/80 text-sm">
                            Ekibe katıldığınızda portföyleriniz ofis arkadaşlarınız tarafından görülebilir.
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="text-white/80 text-sm">
                            Mevcut verileriniz (müşteriler, portföyler) sizinle kalır ve taşınır.
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={handleJoin}
                        disabled={joining}
                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {joining ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Katılınıyor...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                Ekibe Katıl
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-3 text-white/70 hover:text-white transition-colors"
                    >
                        Vazgeç
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JoinOffice;
