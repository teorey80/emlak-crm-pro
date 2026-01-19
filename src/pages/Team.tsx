import React, { useEffect, useState } from 'react';
import { useData } from '../context/DataContext';
import { supabase } from '../services/supabaseClient';
import { UserProfile } from '../types';
import { User, Shield, Briefcase, Mail, Phone, Search, Plus } from 'lucide-react';

const Team: React.FC = () => {
    const { userProfile, session } = useData();
    const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

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

    const filteredTeam = teamMembers.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleInvite = async () => {
        if (!userProfile.officeId) {
            alert("Ofis kimliği bulunamadı.");
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
            alert("Davet linki kopyalandı! Ekip arkadaşınıza gönderebilirsiniz:\n\n" + inviteLink);
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
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Ekibim</h1>
                    <p className="text-slate-500 text-sm mt-1">Ofis çalışanları ve yetki yönetimi</p>
                </div>
                {userProfile.role === 'broker' && (
                    <div className="flex items-center gap-2">
                        {/* Toggle visibility of the link */}
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
                    </div>
                )}
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
        </div>
    );
};

export default Team;
