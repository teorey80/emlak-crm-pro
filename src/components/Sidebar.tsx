
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Building2, BarChart3, Settings, LayoutDashboard, Building, CalendarCheck, SearchCheck, Moon, Sun, Globe, LogOut, Briefcase, Calendar } from 'lucide-react';
import { useData } from '../context/DataContext';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(false);
  const { userProfile, signOut } = useData();

  useEffect(() => {
    // Check local storage or system preference
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDarkMode(true);
    }
  };

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
    <aside className="w-64 bg-white dark:bg-slate-800 h-screen border-r border-gray-200 dark:border-slate-700 fixed left-0 top-0 z-10 flex flex-col transition-colors duration-200">
      <div className="p-6 flex items-center gap-3 border-b border-gray-100 dark:border-slate-700">
        <div className="bg-sky-600 p-2 rounded-lg">
          <Building2 className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Emlak CRM</span>
      </div>

      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-3 px-3">Menü</div>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(item.path)
              ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400'
              : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-200'
              }`}
          >
            <item.icon className={`w-5 h-5 ${isActive(item.path) ? 'text-sky-600 dark:text-sky-400' : 'text-gray-400 dark:text-slate-500'}`} />
            {item.label}
          </Link>
        ))}

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
              onClick={toggleTheme}
              className="p-1.5 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-yellow-400 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              title="Tema Değiştir"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
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
  );
};

export default Sidebar;
