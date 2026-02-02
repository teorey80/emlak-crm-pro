
import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Building2, BarChart3, Settings, LayoutDashboard, Building, CalendarCheck, SearchCheck, Moon, Sun, Globe, LogOut, Briefcase, Calendar, Menu, X } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const { userProfile, signOut, subscription } = useData();
  const { isDark, toggleDark, currentTheme } = useTheme();

  // Close sidebar on route change (mobile only, and only if open)
  useEffect(() => {
    if (window.innerWidth < 1024 && isOpen) {
      onToggle();
    }
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navItems = [
    { path: '/', label: 'Ana Sayfa', icon: LayoutDashboard },
    { path: '/calendar', label: 'Takvim / Ajanda', icon: Calendar },
    { path: '/activities', label: 'Aktiviteler', icon: CalendarCheck },
    { path: '/requests', label: 'Talepler', icon: SearchCheck },
    { path: '/customers', label: 'Müşteriler', icon: Users },
    { path: '/properties', label: 'Emlaklar', icon: Building2 },
    { path: '/sites', label: 'Site Yönetimi', icon: Building },
    { path: '/web-builder', label: 'Web & Domain', icon: Globe },
    { path: '/team', label: 'Ekibim', icon: Briefcase },
    { path: '/reports', label: 'Raporlar', icon: BarChart3 },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        w-64 bg-white dark:bg-slate-800 h-screen border-r border-gray-200 dark:border-slate-700
        fixed left-0 top-0 z-50 flex flex-col transition-all duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header with close button for mobile */}
        <div className="p-6 flex items-center justify-between border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: currentTheme.colors.primary }}>
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Emlak CRM</span>
              {subscription?.plan === 'pro' && (
                <span className="px-1.5 py-0.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-[10px] font-bold rounded uppercase">
                  Pro
                </span>
              )}
            </div>
          </div>
          {/* Close button - only visible on mobile */}
          <button
            onClick={onToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
          </button>
        </div>

        <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-3 px-3">Menü</div>
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? ''
                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-200'
                }`}
                style={active ? {
                  backgroundColor: isDark ? currentTheme.colors.sidebarActiveBgDark : currentTheme.colors.sidebarActiveBg,
                  color: isDark ? currentTheme.colors.sidebarActiveDark : currentTheme.colors.sidebarActive
                } : undefined}
              >
                <item.icon
                  className="w-5 h-5"
                  style={active ? {
                    color: isDark ? currentTheme.colors.sidebarActiveDark : currentTheme.colors.sidebarActive
                  } : undefined}
                />
                {item.label}
              </Link>
            );
          })}

          <div className="mt-8 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-3 px-3">Ayarlar</div>
          <Link
            to="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-200 transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-400 dark:text-slate-500" />
            Ayarlar
          </Link>
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4 px-1">
            <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Görünüm & Çıkış</span>
            <div className="flex gap-2">
              <button
                onClick={toggleDark}
                className="p-1.5 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-yellow-400 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                title="Tema Değiştir"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={signOut}
                className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                title="Çıkış Yap"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
          <Link to="/settings" className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700 p-2 rounded-lg transition-colors">
            <img src={userProfile.avatar} alt="Admin" className="w-9 h-9 rounded-full bg-gray-200 dark:bg-slate-600 object-cover" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{userProfile.name}</span>
              <span className="text-xs text-gray-500 dark:text-slate-400">Profili Düzenle</span>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
};

// Mobile Header Component
export const MobileHeader: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
  const { currentTheme } = useTheme();

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-3 flex items-center gap-3">
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
      >
        <Menu className="w-6 h-6 text-gray-600 dark:text-slate-300" />
      </button>
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg" style={{ backgroundColor: currentTheme.colors.primary }}>
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold text-slate-800 dark:text-slate-100">Emlak CRM</span>
      </div>
    </header>
  );
};

export default Sidebar;
