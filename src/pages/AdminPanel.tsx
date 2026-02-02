import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import {
  Users, CreditCard, BarChart3, Settings, LogOut, Building2,
  Search, ChevronDown, Check, X, Clock, AlertCircle, Crown
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import {
  isAdmin,
  getAllUsers,
  changeUserPlan,
  updateSubscription,
  getAllSubscriptions
} from '../services/subscriptionService';
import { PlanType } from '../types';
import toast, { Toaster } from 'react-hot-toast';

// Admin Dashboard
const AdminDashboard: React.FC<{ users: any[]; subscriptions: any[] }> = ({ users, subscriptions }) => {
  const totalUsers = users.length;
  const proUsers = subscriptions.filter(s => s.plan === 'pro').length;
  const freeUsers = totalUsers - proUsers;
  const monthlyRevenue = proUsers * 199;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Toplam Kullanıcı</p>
              <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Crown className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pro Kullanıcı</p>
              <p className="text-2xl font-bold text-gray-900">{proUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Free Kullanıcı</p>
              <p className="text-2xl font-bold text-gray-900">{freeUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Aylık Gelir</p>
              <p className="text-2xl font-bold text-gray-900">{monthlyRevenue}₺</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Son Kayıtlar</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {users.slice(0, 5).map((user: any) => (
            <div key={user.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name}`}
                  alt={user.full_name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium text-gray-900">{user.full_name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                user.subscriptions?.[0]?.plan === 'pro'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {user.subscriptions?.[0]?.plan === 'pro' ? 'Pro' : 'Free'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// User Management
const AdminUsers: React.FC<{ users: any[]; onPlanChange: (userId: string, plan: PlanType) => void }> = ({
  users,
  onPlanChange
}) => {
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState<'all' | 'free' | 'pro'>('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase());

    const userPlan = user.subscriptions?.[0]?.plan || 'free';
    const matchesPlan = filterPlan === 'all' || userPlan === filterPlan;

    return matchesSearch && matchesPlan;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Kullanıcı Yönetimi</h1>
        <span className="text-sm text-gray-500">{users.length} kullanıcı</span>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Kullanıcı ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <select
          value={filterPlan}
          onChange={e => setFilterPlan(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        >
          <option value="all">Tüm Planlar</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Kullanıcı</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">E-posta</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Plan</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Kayıt</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.map((user: any) => {
              const userPlan = user.subscriptions?.[0]?.plan || 'free';
              return (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name}`}
                        alt={user.full_name}
                        className="w-8 h-8 rounded-full"
                      />
                      <span className="font-medium text-gray-900">{user.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      userPlan === 'pro'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {userPlan === 'pro' ? 'Pro' : 'Free'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onPlanChange(user.id, userPlan === 'pro' ? 'free' : 'pro')}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                        userPlan === 'pro'
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                    >
                      {userPlan === 'pro' ? 'Free Yap' : 'Pro Yap'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Kullanıcı bulunamadı
          </div>
        )}
      </div>
    </div>
  );
};

// Main Admin Panel
const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate('/login');
        return;
      }

      setCurrentUser(session.user);

      const adminStatus = await isAdmin(session.user.id);

      if (!adminStatus) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      setAuthorized(true);
      await loadData();
    } catch (error) {
      console.error('Admin check error:', error);
      setAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [usersData, subsData] = await Promise.all([
        getAllUsers(),
        getAllSubscriptions()
      ]);
      setUsers(usersData);
      setSubscriptions(subsData);
    } catch (error) {
      console.error('Data load error:', error);
    }
  };

  const handlePlanChange = async (userId: string, newPlan: PlanType) => {
    try {
      const success = await changeUserPlan(userId, newPlan);
      if (success) {
        toast.success(`Plan ${newPlan === 'pro' ? 'Pro' : 'Free'} olarak güncellendi`);
        await loadData();
      } else {
        toast.error('Plan güncellenemedi');
      }
    } catch (error) {
      toast.error('Bir hata oluştu');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Erişim Engellendi</h1>
          <p className="text-gray-600 mb-6">
            Bu sayfaya erişim yetkiniz bulunmamaktadır. Admin yetkisi gereklidir.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-gray-900 text-white">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold">Emlak CRM</p>
              <p className="text-xs text-gray-400">Admin Panel</p>
            </div>
          </div>

          <nav className="space-y-1">
            <Link
              to="/admin"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition"
            >
              <BarChart3 className="w-5 h-5" />
              Dashboard
            </Link>
            <Link
              to="/admin/users"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition"
            >
              <Users className="w-5 h-5" />
              Kullanıcılar
            </Link>
            <Link
              to="/admin/subscriptions"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition"
            >
              <CreditCard className="w-5 h-5" />
              Abonelikler
            </Link>
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <img
              src={currentUser?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=Admin`}
              alt="Admin"
              className="w-8 h-8 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentUser?.email}</p>
              <p className="text-xs text-gray-400">Admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition w-full"
          >
            <LogOut className="w-4 h-4" />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <Routes>
          <Route index element={<AdminDashboard users={users} subscriptions={subscriptions} />} />
          <Route path="users" element={<AdminUsers users={users} onPlanChange={handlePlanChange} />} />
          <Route path="subscriptions" element={<AdminUsers users={users} onPlanChange={handlePlanChange} />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminPanel;
