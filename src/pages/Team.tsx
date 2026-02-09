import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useData } from '../context/DataContext';
import { supabase } from '../services/supabaseClient';
import { changeUserRole, createInviteLink, getOfficeInvitations, OfficeInvitation } from '../services/officeService';
import { UserProfile } from '../types';
import { User, Shield, Briefcase, Mail, Phone, Search, Plus, TrendingUp, Home, DollarSign, Activity, Target, Award, Calendar, MoreVertical, UserCog, ChevronDown, Copy, Link as LinkIcon, X, Clock, Users } from 'lucide-react';

interface TeamMemberWithStats extends UserProfile {
    propertyCount: number;
    activityCount: number;
    saleCount: number;
    rentalCount: number;
    totalSalesValue: number;
    // Monthly stats
    monthlySaleCount: number;
    monthlyCommission: number;
    monthlyRevenue: number;
}

const Team: React.FC = () => {
    const { userProfile, session, properties, activities, sales, office, teamMembers: contextTeamMembers } = useData();
    const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'performance' | 'targets'>('grid');
    const [editingTarget, setEditingTarget] = useState<string | null>(null);
    const [targetValues, setTargetValues] = useState<{ salesTarget: number; revenueTarget: number; commissionTarget: number }>({
        salesTarget: 3,
        revenueTarget: 5000000,
        commissionTarget: 150000
    });
    const [roleMenuOpen, setRoleMenuOpen] = useState<string | null>(null);
    const [changingRole, setChangingRole] = useState<string | null>(null);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [inviteRole, setInviteRole] = useState<'consultant' | 'broker'>('consultant');
    const [creatingInvite, setCreatingInvite] = useState(false);
    const [existingInvites, setExistingInvites] = useState<OfficeInvitation[]>([]);

    // Visibility Settings (Default: Show All)
    const showSettings = useMemo(() => {
        // Broker always sees everything
        if (userProfile.role === 'broker') {
            return {
                showListingCount: true,
                showSalesCount: true,
                showRentalCount: true,
                showRevenue: true,
                showCommission: true
            };
        }
        // Consultants see what's allowed in office settings
        return office?.performance_settings || {
            showListingCount: true,
            showSalesCount: true,
            showRentalCount: true,
            showRevenue: false, // Default hidden for consultants
            showCommission: false // Default hidden for consultants
        };
    }, [userProfile.role, office]);

    // Get current month range

    // Get current month range
    const currentMonthRange = useMemo(() => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { firstDay, lastDay, monthName: now.toLocaleString('tr-TR', { month: 'long', year: 'numeric' }) };
    }, []);

    useEffect(() => {
        fetchTeam();
    }, [userProfile.officeId, userProfile.name, userProfile.title, userProfile.avatar, userProfile.email, userProfile.role, session?.user?.id, contextTeamMembers]);

    const fetchTeam = async () => {
        if (!userProfile.officeId) {
            if (contextTeamMembers.length > 0) {
                setTeamMembers(contextTeamMembers);
            } else if (session?.user?.id) {
                setTeamMembers([{
                    id: session.user.id,
                    name: userProfile.name || session.user.email || 'Danışman',
                    title: userProfile.title || 'Danışman',
                    avatar: userProfile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.name || session.user.email || 'Danışman')}`,
                    email: userProfile.email || session.user.email,
                    role: userProfile.role || 'consultant',
                    officeId: userProfile.officeId
                }]);
            }
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('office_id', userProfile.officeId);

            if (error) throw error;

            if (data && data.length > 0) {
                const members: UserProfile[] = data.map((p: any) => ({
                    id: p.id,
                    name: p.full_name,
                    title: p.title || (p.role === 'broker' ? 'Ofis Yöneticisi' : 'Danışman'),
                    avatar: p.avatar_url || `https://ui-avatars.com/api/?name=${p.full_name}`,
                    email: p.email,
                    phone: p.phone,
                    role: p.role,
                    officeId: p.office_id
                }));
                setTeamMembers(members);
            } else if (contextTeamMembers.length > 0) {
                setTeamMembers(contextTeamMembers);
            } else if (session?.user?.id) {
                setTeamMembers([{
                    id: session.user.id,
                    name: userProfile.name || session.user.email || 'Danışman',
                    title: userProfile.title || 'Danışman',
                    avatar: userProfile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.name || session.user.email || 'Danışman')}`,
                    email: userProfile.email || session.user.email,
                    role: userProfile.role || 'consultant',
                    officeId: userProfile.officeId
                }]);
            }
        } catch (error) {
            console.error('Error fetching team:', error);
            if (contextTeamMembers.length > 0) {
                setTeamMembers(contextTeamMembers);
            }
        } finally {
            setLoading(false);
        }
    };

    // Calculate performance stats for each team member
    const teamWithStats: TeamMemberWithStats[] = useMemo(() => {
        const { firstDay, lastDay } = currentMonthRange;

        return teamMembers.map(member => {
            const memberProperties = properties.filter(p => p.user_id === member.id);
            const memberActivities = activities.filter(a => a.user_id === member.id);

            const memberSales = sales?.filter(s => s.consultantId === member.id || s.consultant_id === member.id || s.user_id === member.id) || [];
            const totalSalesValue = memberSales.reduce((sum, s) => sum + (s.salePrice || s.sale_price || 0), 0);

            const saleCount = memberSales.filter(s => s.transactionType !== 'rental').length;
            const rentalCount = memberSales.filter(s => s.transactionType === 'rental').length;

            // Monthly calculations
            const monthlySales = memberSales.filter(s => {
                const saleDate = new Date(s.saleDate || s.sale_date || '');
                return saleDate >= firstDay && saleDate <= lastDay;
            });
            const monthlySaleCount = monthlySales.length;
            const monthlyRevenue = monthlySales.reduce((sum, s) => sum + (s.salePrice || s.sale_price || 0), 0);
            const monthlyCommission = monthlySales.reduce((sum, s) => sum + (s.consultantShareAmount || s.consultant_share_amount || 0), 0);

            return {
                ...member,
                propertyCount: memberProperties.length,
                activityCount: memberActivities.length,
                saleCount,
                rentalCount,
                totalSalesValue,
                monthlySaleCount,
                monthlyCommission,
                monthlyRevenue
            };
        });
    }, [teamMembers, properties, activities, sales, currentMonthRange]);

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

        const isHashRouter = window.location.hash.length > 0;
        const baseUrl = window.location.origin;
        const registerPath = isHashRouter ? '/#/register' : '/register';
        const inviteLink = `${baseUrl}${registerPath}?officeId=${userProfile.officeId}`;

        try {
            await navigator.clipboard.writeText(inviteLink);
            toast.success("Davet linki kopyalandı!");
        } catch (err) {
            console.error('Clipboard failed', err);
            prompt("Otomatik kopyalama yapılamadı. Lütfen linki aşağıdan kopyalayın:", inviteLink);
        }
    };

    const handleRoleChange = async (memberId: string, newRole: 'consultant' | 'broker') => {
        if (userProfile.role !== 'broker') {
            toast.error('Bu işlem için broker yetkisi gerekli');
            return;
        }

        setChangingRole(memberId);
        try {
            const result = await changeUserRole(memberId, newRole);
            if (result.success) {
                toast.success(`Rol başarıyla ${newRole === 'broker' ? 'Broker' : 'Danışman'} olarak güncellendi`);
                // Update local state
                setTeamMembers(prev => prev.map(m =>
                    m.id === memberId ? { ...m, role: newRole } : m
                ));
            } else {
                toast.error(result.error || 'Rol değiştirilemedi');
            }
        } catch (error) {
            console.error('Role change error:', error);
            toast.error('Bir hata oluştu');
        } finally {
            setChangingRole(null);
            setRoleMenuOpen(null);
        }
    };

    // Invite Modal Functions
    const handleOpenInviteModal = async () => {
        setShowInviteModal(true);
        setInviteLink(null);
        if (userProfile.officeId) {
            const invites = await getOfficeInvitations(userProfile.officeId);
            setExistingInvites(invites.slice(0, 5)); // Show last 5
        }
    };

    const handleCreateInvite = async () => {
        if (!userProfile.officeId) return;
        setCreatingInvite(true);
        try {
            const result = await createInviteLink(userProfile.officeId, inviteRole, 10, 7);
            if (result) {
                setInviteLink(result.link);
                toast.success('Davet linki oluşturuldu!');
                // Refresh existing invites
                const invites = await getOfficeInvitations(userProfile.officeId);
                setExistingInvites(invites.slice(0, 5));
            } else {
                toast.error('Link oluşturulamadı');
            }
        } catch (error) {
            console.error('Error creating invite:', error);
            toast.error('Bir hata oluştu');
        } finally {
            setCreatingInvite(false);
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success('Link kopyalandı!');
        } catch (err) {
            prompt('Linki kopyalayın:', text);
        }
    };

    if (!userProfile.officeId && teamMembers.length === 0 && contextTeamMembers.length === 0) {
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
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'grid'
                                ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                                }`}
                        >
                            Ekip
                        </button>
                        <button
                            onClick={() => setViewMode('performance')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'performance'
                                ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                                }`}
                        >
                            Performans
                        </button>
                        <button
                            onClick={() => setViewMode('targets')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'targets'
                                ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                                }`}
                        >
                            Hedefler
                        </button>
                    </div>
                    {userProfile.role === 'broker' && (
                        <button
                            onClick={handleOpenInviteModal}
                            className="bg-[#1193d4] hover:bg-[#0e7db5] text-white px-4 py-2.5 rounded-lg flex items-center shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                        >
                            <Plus className="w-5 h-5 mr-1.5" />
                            <span className="font-medium">Davet Linki</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-600 p-4">
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
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
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
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-slate-800 dark:text-white">{member.name}</h3>
                                            {member.role === 'broker' && (
                                                <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] px-1.5 py-0.5 rounded font-bold border border-amber-200 dark:border-amber-800">
                                                    Yönetici
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <span>{member.title}</span>
                                            <span className="text-gray-300">•</span>
                                            <span className="text-[#1193d4] font-medium">
                                                {showSettings.showSalesCount ? `${member.saleCount} Satış` : ''}
                                                {(showSettings.showSalesCount && showSettings.showRentalCount) ? ', ' : ''}
                                                {showSettings.showRentalCount ? `${member.rentalCount} Kiralama` : ''}
                                                {!showSettings.showSalesCount && !showSettings.showRentalCount ? 'Performans Gizli' : ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center gap-6 text-center">
                                    <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                                        <Home className="w-4 h-4" />
                                        <span className="font-bold">{showSettings.showListingCount ? member.propertyCount : '-'}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 uppercase">İlan</p>
                                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                        <DollarSign className="w-4 h-4" />
                                        <span className="font-bold">
                                            {((showSettings.showSalesCount ? member.saleCount : 0) + (showSettings.showRentalCount ? member.rentalCount : 0))}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 uppercase">İşlem</p>
                                    <div className="hidden sm:block">
                                        <div className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
                                            <Activity className="w-4 h-4" />
                                            <span className="font-bold">{member.activityCount}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 uppercase">Aktivite</p>
                                    </div>
                                    <div className="min-w-[80px] text-right">
                                        <p className="font-bold text-slate-800 dark:text-white">
                                            {showSettings.showRevenue && member.totalSalesValue > 0
                                                ? `${(member.totalSalesValue / 1000000).toFixed(1)}M`
                                                : showSettings.showRevenue ? '0' : '-'}
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

            {/* Targets View */}
            {viewMode === 'targets' && (
                <div className="space-y-6">
                    {/* Month Header */}
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
                        <div className="flex items-center gap-3 mb-2">
                            <Calendar className="w-6 h-6" />
                            <h2 className="text-xl font-bold">{currentMonthRange.monthName}</h2>
                        </div>
                        <p className="text-emerald-100 text-sm">Aylik hedef takibi ve ilerleme durumu</p>
                    </div>

                    {/* Team Targets */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {rankedTeam.map((member) => {
                            const salesTarget = (member as any).monthlyTargets?.salesTarget || targetValues.salesTarget;
                            const revenueTarget = (member as any).monthlyTargets?.revenueTarget || targetValues.revenueTarget;
                            const commissionTarget = (member as any).monthlyTargets?.commissionTarget || targetValues.commissionTarget;

                            const salesProgress = Math.min((member.monthlySaleCount / salesTarget) * 100, 100);
                            const revenueProgress = Math.min((member.monthlyRevenue / revenueTarget) * 100, 100);
                            const commissionProgress = Math.min((member.monthlyCommission / commissionTarget) * 100, 100);

                            return (
                                <div key={member.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                                    {/* Member Header */}
                                    <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full object-cover" />
                                            <div>
                                                <h3 className="font-bold text-slate-800 dark:text-white">{member.name}</h3>
                                                <p className="text-xs text-slate-500">{member.title}</p>
                                            </div>
                                        </div>
                                        {salesProgress >= 100 && revenueProgress >= 50 && (
                                            <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 rounded-full">
                                                <Award className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                                <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400">Hedef Asildi!</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Progress Bars */}
                                    <div className="p-4 space-y-4">
                                        {/* Sales Target */}
                                        {showSettings.showSalesCount && (
                                            <div>
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Satış Hedefi</span>
                                                    <span className="text-sm font-bold text-slate-800 dark:text-white">
                                                        {member.monthlySaleCount} / {salesTarget}
                                                    </span>
                                                </div>
                                                <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${salesProgress >= 100 ? 'bg-green-500' : salesProgress >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                                        style={{ width: `${salesProgress}%` }}
                                                    />
                                                </div>
                                                <p className="text-xs text-slate-400 mt-1">%{salesProgress.toFixed(0)} tamamlandı</p>
                                            </div>
                                        )}

                                        {/* Revenue Target */}
                                        {showSettings.showRevenue && (
                                            <div>
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Ciro Hedefi</span>
                                                    <span className="text-sm font-bold text-slate-800 dark:text-white">
                                                        {(member.monthlyRevenue / 1000000).toFixed(1)}M / {(revenueTarget / 1000000).toFixed(1)}M TL
                                                    </span>
                                                </div>
                                                <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${revenueProgress >= 100 ? 'bg-green-500' : revenueProgress >= 50 ? 'bg-indigo-500' : 'bg-orange-500'}`}
                                                        style={{ width: `${revenueProgress}%` }}
                                                    />
                                                </div>
                                                <p className="text-xs text-slate-400 mt-1">%{revenueProgress.toFixed(0)} tamamlandı</p>
                                            </div>
                                        )}

                                        {/* Commission Target */}
                                        {showSettings.showCommission && (
                                            <div>
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Komisyon Hedefi</span>
                                                    <span className="text-sm font-bold text-slate-800 dark:text-white">
                                                        {member.monthlyCommission.toLocaleString('tr-TR')} / {commissionTarget.toLocaleString('tr-TR')} TL
                                                    </span>
                                                </div>
                                                <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${commissionProgress >= 100 ? 'bg-green-500' : commissionProgress >= 50 ? 'bg-purple-500' : 'bg-red-400'}`}
                                                        style={{ width: `${commissionProgress}%` }}
                                                    />
                                                </div>
                                                <p className="text-xs text-slate-400 mt-1">%{commissionProgress.toFixed(0)} tamamlandı</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {rankedTeam.length === 0 && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-gray-200 dark:border-slate-700">
                            <Target className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-500">Henuz ekip uyesi bulunmuyor.</p>
                        </div>
                    )}
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
                                <Link
                                    to={`/properties?user=${member.id}`}
                                    className="hover:bg-slate-100 dark:hover:bg-slate-600 py-2 rounded transition-colors cursor-pointer block"
                                    title={`${member.name} ilanlarını görüntüle`}
                                >
                                    <p className="font-bold text-indigo-600 dark:text-indigo-400">{showSettings.showListingCount ? member.propertyCount : '-'}</p>
                                    <p className="text-[10px] text-slate-400 uppercase">İlan</p>
                                </Link>
                                <Link
                                    to={`/sales?user=${member.id}`}
                                    className="hover:bg-slate-100 dark:hover:bg-slate-600 py-2 rounded transition-colors cursor-pointer block relative group"
                                    title={`${member.name} satışlarını görüntüle`}
                                >
                                    <p className="font-bold text-green-600 dark:text-green-400">
                                        {((showSettings.showSalesCount ? member.saleCount : 0) + (showSettings.showRentalCount ? member.rentalCount : 0))}
                                    </p>
                                    <p className="text-[10px] text-slate-400 uppercase">İşlem</p>

                                    {/* Hover Details */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-slate-800 text-white text-xs rounded-lg py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                        {showSettings.showSalesCount && (
                                            <div className="flex justify-between">
                                                <span>Satış:</span>
                                                <span>{member.saleCount}</span>
                                            </div>
                                        )}
                                        {showSettings.showRentalCount && (
                                            <div className="flex justify-between">
                                                <span>Kiralama:</span>
                                                <span>{member.rentalCount}</span>
                                            </div>
                                        )}
                                        {!showSettings.showSalesCount && !showSettings.showRentalCount && (
                                            <div className="text-center text-gray-400">Gizli</div>
                                        )}
                                    </div>
                                </Link>
                                <Link
                                    to={`/activities?user=${member.id}`}
                                    className="hover:bg-slate-100 dark:hover:bg-slate-600 py-2 rounded transition-colors cursor-pointer block"
                                    title={`${member.name} aktivitelerini görüntüle`}
                                >
                                    <p className="font-bold text-sky-600 dark:text-sky-400">{member.activityCount}</p>
                                    <p className="text-[10px] text-slate-400 uppercase">Aktivite</p>
                                </Link>
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
                                {/* Role Management - Only for Broker */}
                                {userProfile.role === 'broker' && member.id !== userProfile.id && (
                                    <>
                                        <div className="w-px bg-gray-200 dark:bg-slate-600 h-5 self-center"></div>
                                        <div className="relative">
                                            <button
                                                onClick={() => setRoleMenuOpen(roleMenuOpen === member.id ? null : member.id)}
                                                className="flex items-center text-slate-600 dark:text-slate-300 hover:text-amber-600 transition-colors"
                                            >
                                                <UserCog className="w-4 h-4 mr-1" />
                                                Rol
                                                <ChevronDown className="w-3 h-3 ml-1" />
                                            </button>
                                            {roleMenuOpen === member.id && (
                                                <div className="absolute right-0 bottom-full mb-2 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden z-50">
                                                    <button
                                                        onClick={() => handleRoleChange(member.id, 'consultant')}
                                                        disabled={changingRole === member.id || member.role === 'consultant'}
                                                        className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 ${member.role === 'consultant' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'text-slate-700 dark:text-slate-300'
                                                            }`}
                                                    >
                                                        <Briefcase className="w-4 h-4" />
                                                        Danışman
                                                        {member.role === 'consultant' && <span className="ml-auto text-xs">✓</span>}
                                                    </button>
                                                    <button
                                                        onClick={() => handleRoleChange(member.id, 'broker')}
                                                        disabled={changingRole === member.id || member.role === 'broker'}
                                                        className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 ${member.role === 'broker' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600' : 'text-slate-700 dark:text-slate-300'
                                                            }`}
                                                    >
                                                        <Shield className="w-4 h-4" />
                                                        Broker
                                                        {member.role === 'broker' && <span className="ml-auto text-xs">✓</span>}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Invite Modal */}
            {
                showInviteModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl">
                            <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <LinkIcon className="w-5 h-5 text-[#1193d4]" />
                                    Davet Linki Oluştur
                                </h3>
                                <button
                                    onClick={() => setShowInviteModal(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* Role Selector */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Davet Rolü
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setInviteRole('consultant')}
                                            className={`flex-1 py-2.5 px-4 rounded-lg border-2 font-medium transition-all flex items-center justify-center gap-2 ${inviteRole === 'consultant'
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600'
                                                : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
                                                }`}
                                        >
                                            <Briefcase className="w-4 h-4" />
                                            Danışman
                                        </button>
                                        <button
                                            onClick={() => setInviteRole('broker')}
                                            className={`flex-1 py-2.5 px-4 rounded-lg border-2 font-medium transition-all flex items-center justify-center gap-2 ${inviteRole === 'broker'
                                                ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-600'
                                                : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
                                                }`}
                                        >
                                            <Shield className="w-4 h-4" />
                                            Broker
                                        </button>
                                    </div>
                                </div>

                                {/* Generated Link */}
                                {inviteLink ? (
                                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-green-600 font-medium text-sm">Link Hazır!</span>
                                            <span className="text-xs text-green-500">7 gün geçerli</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={inviteLink}
                                                readOnly
                                                className="flex-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm"
                                            />
                                            <button
                                                onClick={() => copyToClipboard(inviteLink)}
                                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-1"
                                            >
                                                <Copy className="w-4 h-4" />
                                                Kopyala
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleCreateInvite}
                                        disabled={creatingInvite}
                                        className="w-full bg-[#1193d4] hover:bg-[#0e7db5] text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {creatingInvite ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Oluşturuluyor...
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="w-5 h-5" />
                                                Link Oluştur
                                            </>
                                        )}
                                    </button>
                                )}

                                {/* Existing Invites */}
                                {existingInvites.length > 0 && (
                                    <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                                        <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            Aktif Davetler
                                        </h4>
                                        <div className="space-y-2 max-h-32 overflow-y-auto">
                                            {existingInvites.map(inv => (
                                                <div key={inv.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 rounded-lg px-3 py-2 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${inv.role === 'broker' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                                            {inv.role === 'broker' ? 'Broker' : 'Danışman'}
                                                        </span>
                                                        <span className="text-slate-500">
                                                            {inv.current_uses}/{inv.max_uses} kullanım
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const link = `${window.location.origin}${window.location.hash ? '/#' : ''}/join/${inv.token}`;
                                                            copyToClipboard(link);
                                                        }}
                                                        className="text-[#1193d4] hover:text-[#0e7db5]"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
};

export default Team;
