import React from 'react';
import { Search, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import NotificationBell from './NotificationBell';

const TopBar: React.FC<{ title: string }> = ({ title }) => {
  const { userProfile, activities, requests } = useData();
  const [showNotifications, setShowNotifications] = React.useState(false);

  // Real Notification Logic
  const notifications = React.useMemo(() => {
    const list: { id: string; text: string; date: string; type: 'activity' | 'request' }[] = [];
    // Fix: Use generic YYYY-MM-DD that matches how we save dates (usually input[type=date] uses local YYYY-MM-DD or simple string)
    // Actually input type="date" value is YYYY-MM-DD. 
    // To match 'Today', let's get YYYY-MM-DD in local time.
    const today = new Date().toLocaleDateString('en-CA'); // en-CA returns YYYY-MM-DD

    // 1. Filter Activities (Today & Tomorrow)
    activities.forEach(act => {
      // Simple string comparison for 'YYYY-MM-DD' if stored that way, 
      // or check if it matches today's date string.
      if (act.date === today && act.status !== 'Tamamlandı') {
        list.push({
          id: act.id,
          text: `Bugün: ${act.type} - ${act.customerName}`,
          date: 'Bugün',
          type: 'activity'
        });
      }
    });

    // 2. Filter Recent Requests (Last 5)
    // Assuming requests are sorted by date desc in context, take top 3
    requests.slice(0, 3).forEach(req => {
      list.push({
        id: req.id,
        text: `Yeni Talep: ${req.customerName} - ${req.type}`,
        date: req.date,
        type: 'request'
      });
    });

    return list;
  }, [activities, requests]);

  const [readNotifications, setReadNotifications] = React.useState<string[]>([]);
  const unreadCount = notifications.filter(n => !readNotifications.includes(n.id)).length;

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadCount > 0) {
      // Mark all current as read when opening
      setReadNotifications(prev => [...new Set([...prev, ...notifications.map(n => n.id)])]);
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-8 sticky top-0 z-20 transition-colors duration-200">
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h1>

      <div className="flex items-center gap-6">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Genel Arama..."
            className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 w-64 transition-all placeholder-gray-400 dark:placeholder-slate-500"
          />
        </div>

        <div className="relative">
          <button
            onClick={toggleNotifications}
            className={`relative p-2 rounded-full transition-colors ${showNotifications ? 'bg-sky-50 dark:bg-slate-700 text-[#1193d4]' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
            )}
          </button>

          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-30 cursor-default"
                onClick={() => setShowNotifications(false)}
              ></div>
              <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden z-40 animate-in fade-in zoom-in-95 duration-200">
                <div className="p-3 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-700/50">
                  <h3 className="font-semibold text-slate-800 dark:text-white text-sm">Bildirimler</h3>
                  <span className="text-xs text-gray-500 dark:text-slate-400 px-2 py-0.5 bg-white dark:bg-slate-700 rounded-md border border-gray-200 dark:border-slate-600">{unreadCount} Yeni</span>
                </div>
                <div className="max-h-[320px] overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map(n => (
                      <div key={n.id} className={`p-4 border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group ${readNotifications.includes(n.id) ? 'opacity-60' : ''}`}>
                        <div className="flex justify-between items-start mb-1">
                          <p className={`text-sm ${readNotifications.includes(n.id) ? 'font-normal' : 'font-semibold'} text-slate-800 dark:text-slate-200 line-clamp-2`}>{n.text}</p>
                          {!readNotifications.includes(n.id) && <span className="w-2 h-2 bg-[#1193d4] rounded-full mt-1.5 flex-shrink-0"></span>}
                        </div>
                        <span className="text-xs text-gray-400 dark:text-slate-500 block mt-1">{n.date}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500 dark:text-slate-400">
                      <div className="bg-gray-50 dark:bg-slate-700/50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Bell className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm">Hiç bildiriminiz yok</p>
                      <p className="text-xs mt-1 opacity-70">Bugüne ait aktivite veya yeni talep bulunamadı.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Smart Matching Notifications */}
        <NotificationBell />

        <Link to="/settings">
          <img
            src={userProfile.avatar}
            alt="Profile"
            className="w-9 h-9 rounded-full border-2 border-white dark:border-slate-700 shadow-sm object-cover hover:opacity-80 transition-opacity"
          />
        </Link>
      </div>
    </header>
  );
};

export default TopBar;