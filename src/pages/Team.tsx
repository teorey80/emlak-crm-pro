import React, { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useData } from '../context/DataContext';
import { supabase } from '../services/supabaseClient';
import { UserProfile } from '../types';
import { User, Shield, Briefcase, Mail, Phone, Search, Plus, TrendingUp, Home, DollarSign, Activity } from 'lucide-react';

interface TeamMemberWithStats extends UserProfile {
    propertyCount: number;
    activityCount: number;
    saleCount: number;
    totalSalesValue: number;
}

const Team: React.FC = () => {
    const { userProfile, session, properties, activities, sales } = useData();
    const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'performance'>('grid');

    useEffect(() => {
        fetchTeam();
    }, [userProfile.officeId]);

    const fetchTeam = async () => {
        if (!userProfile.officeId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('office_id', userProfile.officeId);

            if (error) throw error;

            if (data) {
                const members: UserProfile[] = data.map((p: any) => ({
                    id: p.id,
                    name: p.full_name,
                    title: p.title || 'Danışman',
                    avatar: p.avatar_url || `https://ui-avatars.com/api/?name=${p.full_name}`,
                    email: p.email, // Assuming email is in profile or we fetch from auth? usually profile copies it.
                    phone: p.phone,
                    role: p.role,
                    officeId: p.office_id
                }));
                setTeamMembers(members);
            }
        } catch (error) {
            console.error('Error fetching team:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate performance stats for each team member
    const teamWithStats: TeamMemberWithStats[] = useMemo(() => {
        return teamMembers.map(member => {
            const memberProperties = properties.filter(p => p.user_id === member.id);
            const memberActivities = activities.filter(a => {
                // Try to match by activity's assigned user if available
                return memberProperties.some(p => p.id === a.propertyId);
            });
            const memberSales = sales?.filter(s => s.consultantId === member.id) || [];
            const totalSalesValue = memberSales.reduce((sum, s) => sum + (s.salePrice || 0), 0);

            return {
                ...member,
                propertyCount: memberProperties.length,
                activityCount: memberActivities.length,
                saleCount: memberSales.length,
                totalSalesValue
            };
        });
    }, [teamMembers, properties, activities, sales]);

    const filteredTeam = teamWithStats.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort by performance for ranking
    const rankedTeam = [...filteredTeam].sort((a, b) => {
        // Score based on sales value, then property count, then activity count
        const scoreA = a.totalSalesValue * 1 + a.propertyCount * 10000 + a.activityCount * 1000;
        const scoreB = b.totalSalesValue * 1 + b.propertyCount * 10000 + b.activityCount * 1000;
        return scoreB - scoreA;
    });

    const handleInvite = async () => {
        if (!userProfile.officeId) {
            toast.error("Ofis kimliği bulunamadı.");
            return;
        }

        // Detect if using HashRouter or BrowserRouter based on current URL
        const isHashRouter = window.location.hash.length > 0;
        const baseUrl = window.location.origin;
        // Construct link dynamically. If currently on /#/team, register is at /#/register
        // If on /team, register is at /register
        const registerPath = isHashRouter ? '/#/register' : '/register';
        const inviteLink = `${baseUrl}${registerPath}?officeId=${userProfile.officeId}`;

        try {
            await navigator.clipboard.writeText(inviteLink);
            toast.success("Davet linki kopyalandı!");
        } catch (err) {
            console.error('Clipboard failed', err);
            // Fallback for browsers blocking clipboard or non-secure contexts
            prompt("Otomatik kopyalama yapılamadı. Lütfen linki aşağıdan kopyalayın:", inviteLink);
        }
    };

    if (!userProfile.officeId) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
                <div className="bg-orange-100 p-4 rounded-full mb-4">
                    <Shield className="w-8 h-8 text-orange-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Ofis Kaydı Bulunamadı</h2>
                <p className="text-slate-500 mt-2">Bu sayfayı görüntülemek için bir ofise bağlı olmanız gerekmektedir.</p>
            </div>
        );
    }

    // Only Broker can manage, but all can view? Let's assume view for now.

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Ekibim</h1>
                    <p className="text-slate-500 text-sm mt-1">Ofis çalışanları ve performans takibi</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* View Mode Toggle */}
                    <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-1 flex">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                viewMode === 'grid'
                                    ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                            }`}
                        >
                            Ekip
                        </button>
                        <button
                            onClick={() => setViewMode('performance')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                viewMode === 'performance'
                                    ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                            }`}
                        >
                            Performans
                        </button>
                    </div>
                    {userProfile.role === 'broker' && (
                        <button
                            onClick={() => {
                                const isHashRouter = window.location.hash.length > 0;
                                const baseUrl = window.location.origin;
                                const registerPath = isHashRouter ? '/#/register' : '/register';
                                const link = `${baseUrl}${registerPath}?officeId=${userProfile.officeId}`;
                                prompt("Davet Linkiniz (Kopyala):", link);
                            }}
                            className="bg-[#1193d4] hover:bg-[#0e7db5] text-white px-4 py-2.5 rounded-lg flex items-center shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                        >
                            <Plus className="w-5 h-5 mr-1.5" />
                            <span className="font-medium">Davet Linki Al</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4">
                <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="İsim veya ünvan ile ara..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 focus:ring-2 focus:ring-[#1193d4] focus:border-transparent outline-none transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Performance View */}
            {viewMode === 'performance' && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800">
                        <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                            Performans Sıralaması
                        </h2>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-slate-700">
                        {rankedTeam.map((member, index) => (
                            <div key={member.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                {/* Rank */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                    index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                    index === 1 ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' :
                                    index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                    'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                }`}>
                                    {index + 1}
                                </div>

                                {/* Avatar & Name */}
                                <div className="flex items-center gap-3 flex-1">
                                    <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
                                    <div>
                                        <h3 className="font-semibold text-slate-800 dark:text-white">{member.name}</h3>
                                        <p className="text-xs text-slate-500">{member.title}</p>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center gap-6 text-center">
                                    <div>
                                        <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                                            <Home className="w-4 h-4" />
                                            <span className="font-bold">{member.propertyCount}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 uppercase">İlan</p>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                            <DollarSign className="w-4 h-4" />
                                            <span className="font-bold">{member.saleCount}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 uppercase">Satış</p>
                                    </div>
                                    <div className="hidden sm:block">
                                        <div className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
                                            <Activity className="w-4 h-4" />
                                            <span className="font-bold">{member.activityCount}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 uppercase">Aktivite</p>
                                    </div>
                                    <div className="min-w-[80px] text-right">
                                        <p className="font-bold text-slate-800 dark:text-white">
                                            {member.totalSalesValue > 0
                                                ? `${(member.totalSalesValue / 1000000).toFixed(1)}M`
                                                : '0'}
                                        </p>
                                        <p className="text-[10px] text-slate-400 uppercase">Ciro (TL)</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {rankedTeam.length === 0 && (
                            <div className="p-8 text-center text-slate-400">
                                Henüz ekip üyesi bulunmuyor.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Grid View */}
            {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTeam.map((member) => (
                    <div key={member.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-6 flex flex-col items-center border-b border-gray-100 dark:border-slate-700">
                            <div className="relative mb-4">
                                <img src={member.avatar} alt={member.name} className="w-20 h-20 rounded-full object-cover border-4 border-gray-50 dark:border-slate-700" />
                                <span className={`absolute bottom-0 right-0 p-1.5 rounded-full border-2 border-white dark:border-slate-800 ${member.role === 'broker' ? 'bg-amber-500' : 'bg-blue-500'}`}>
                                    {member.role === 'broker' ? <Shield className="w-3 h-3 text-white" /> : <Briefcase className="w-3 h-3 text-white" />}
                                </span>
                            </div>
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">{member.name}</h3>
                            <p className="text-slate-500 text-sm">{member.title}</p>
                            {member.role === 'broker' && (
                                <span className="mt-2 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                                    Ofis Yöneticisi
                                </span>
                            )}
                        </div>
                        {/* Performance Stats */}
                        <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-slate-700 text-center py-3 bg-slate-50 dark:bg-slate-700/30">
                            <div>
                                <p className="font-bold text-indigo-600 dark:text-indigo-400">{member.propertyCount}</p>
                                <p className="text-[10px] text-slate-400 uppercase">İlan</p>
                            </div>
                            <div>
                                <p className="font-bold text-green-600 dark:text-green-400">{member.saleCount}</p>
                                <p className="text-[10px] text-slate-400 uppercase">Satış</p>
                            </div>
                            <div>
                                <p className="font-bold text-sky-600 dark:text-sky-400">{member.activityCount}</p>
                                <p className="text-[10px] text-slate-400 uppercase">Aktivite</p>
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-slate-700/30 p-4 flex justify-between text-sm">
                            <button className="flex items-center text-slate-600 dark:text-slate-300 hover:text-[#1193d4] transition-colors">
                                <Mail className="w-4 h-4 mr-2" />
                                E-posta
                            </button>
                            <div className="w-px bg-gray-200 dark:bg-slate-600 h-5 self-center"></div>
                            <button className="flex items-center text-slate-600 dark:text-slate-300 hover:text-[#1193d4] transition-colors">
                                <Phone className="w-4 h-4 mr-2" />
                                Ara
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            )}
        </div>
    );
};

export default Team;
