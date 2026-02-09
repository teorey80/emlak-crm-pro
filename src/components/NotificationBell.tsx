import React, { useState, useEffect, useMemo } from 'react';
import { Bell, X, Sparkles, CheckCircle, Users, UserPlus, Shield, DollarSign, Home, MessageCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { findMatches, MatchResult } from '../services/matchingService';
import { getNotifications, markAsRead, markAllAsRead, Notification, subscribeToNotifications } from '../services/notificationService';
import { useNavigate } from 'react-router-dom';

const NotificationBell: React.FC = () => {
  const { properties, requests, teamMembers, session } = useData();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissedMatches, setDismissedMatches] = useState<string[]>(() => {
    const saved = localStorage.getItem('dismissedMatches');
    return saved ? JSON.parse(saved) : [];
  });

  // Fetch notifications from database
  useEffect(() => {
    if (session?.user) {
      fetchNotifications(session.user.id);

      // Subscribe to realtime notifications
      const unsubscribe = subscribeToNotifications(session.user.id, (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
      });

      return () => unsubscribe();
    }
  }, [session?.user?.id]);

  const fetchNotifications = async (userId: string) => {
    const data = await getNotifications(20, false, userId);
    setNotifications(data);
  };

  // Calculate matches with team member info
  const allMatches = useMemo(() => {
    return findMatches(properties, requests, teamMembers);
  }, [properties, requests, teamMembers]);

  // Filter out dismissed matches
  const activeMatches = useMemo(() => {
    return allMatches.filter(match => {
      const matchId = `${match.request.id}-${match.property.id}`;
      return !dismissedMatches.includes(matchId);
    });
  }, [allMatches, dismissedMatches]);

  // Unread notifications from database
  const unreadNotifications = useMemo(() => {
    return notifications.filter(n => !n.is_read);
  }, [notifications]);

  const totalUnread = activeMatches.length + unreadNotifications.length;

  // Save dismissed matches to localStorage
  useEffect(() => {
    localStorage.setItem('dismissedMatches', JSON.stringify(dismissedMatches));
  }, [dismissedMatches]);

  const dismissMatch = (match: MatchResult) => {
    const matchId = `${match.request.id}-${match.property.id}`;
    setDismissedMatches(prev => [...prev, matchId]);
  };

  const dismissAll = async () => {
    // Dismiss all matches
    const allMatchIds = activeMatches.map(m => `${m.request.id}-${m.property.id}`);
    setDismissedMatches(prev => [...prev, ...allMatchIds]);

    // Mark all notifications as read
    if (session?.user?.id) {
      await markAllAsRead(session.user.id);
    }
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setIsOpen(false);
  };

  const handleMatchClick = (match: MatchResult) => {
    dismissMatch(match);
    navigate(`/properties/${match.property.id}`);
    setIsOpen(false);
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    await markAsRead(notification.id);
    setNotifications(prev =>
      prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
    );

    // Navigate based on type
    switch (notification.type) {
      case 'team_joined':
        navigate('/team');
        break;
      case 'role_changed':
        navigate('/team');
        break;
      case 'match_found':
        if (notification.data?.property_id) {
          navigate(`/properties/${notification.data.property_id}`);
        }
        break;
      case 'deposit_received':
        if (notification.data?.property_id) {
          navigate(`/properties/${notification.data.property_id}`);
        }
        break;
      default:
        navigate('/');
    }
    setIsOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'team_joined':
        return <UserPlus className="w-4 h-4 text-green-500" />;
      case 'role_changed':
        return <Shield className="w-4 h-4 text-amber-500" />;
      case 'match_found':
        return <Sparkles className="w-4 h-4 text-violet-500" />;
      case 'deposit_received':
        return <DollarSign className="w-4 h-4 text-emerald-500" />;
      case 'sale_completed':
        return <Home className="w-4 h-4 text-blue-500" />;
      default:
        return <MessageCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        aria-label="Bildirimler"
      >
        <Bell className="w-5 h-5" />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold text-white bg-red-500 rounded-full px-1 animate-pulse">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Notification Panel */}
          <div className="absolute right-0 mt-2 w-96 max-h-[480px] overflow-hidden bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 z-50">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between bg-gray-50 dark:bg-slate-800/80">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#1193d4]" />
                <h3 className="font-semibold text-slate-800 dark:text-white text-sm">Bildirimler</h3>
              </div>
              {totalUnread > 0 && (
                <button
                  onClick={dismissAll}
                  className="text-xs text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
                >
                  Tümünü Okundu İşaretle
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-[380px] overflow-y-auto">
              {totalUnread === 0 && notifications.length === 0 && activeMatches.length === 0 ? (
                <div className="p-8 text-center text-gray-400 dark:text-slate-500">
                  <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Bildirim yok</p>
                  <p className="text-xs mt-1 text-gray-400">Ekip, eşleşme ve diğer bildirimler burada görünecek.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-slate-700">
                  {/* Database Notifications */}
                  {unreadNotifications.slice(0, 5).map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer ${!notification.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 dark:text-white text-sm">
                            {notification.title}
                          </p>
                          {notification.message && (
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 truncate">
                              {notification.message}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notification.created_at).toLocaleString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: 'numeric',
                              month: 'short'
                            })}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Match Notifications */}
                  {activeMatches.length > 0 && (
                    <>
                      {unreadNotifications.length > 0 && (
                        <div className="px-4 py-2 bg-gray-50 dark:bg-slate-700/50">
                          <span className="text-xs font-medium text-gray-500 dark:text-slate-400 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Akıllı Eşleşmeler
                          </span>
                        </div>
                      )}
                      {activeMatches.slice(0, 5).map((match, idx) => (
                        <div
                          key={`${match.request.id}-${match.property.id}-${idx}`}
                          className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1" onClick={() => handleMatchClick(match)}>
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 px-2 py-0.5 rounded-full">
                                  %{match.score} Eşleşme
                                </span>
                                {match.isCrossConsultant && (
                                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    Çapraz
                                  </span>
                                )}
                              </div>
                              <p className="font-medium text-slate-800 dark:text-white text-sm">
                                {match.request.customerName}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                {match.request.type} arıyor
                              </p>
                              <div className="flex items-center gap-1 mt-2 text-xs text-green-600 dark:text-green-400">
                                <CheckCircle className="w-3 h-3" />
                                <span>{match.property.title}</span>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                dismissMatch(match);
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {(activeMatches.length > 5 || notifications.length > 5) && (
              <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/80 text-center">
                <span className="text-xs text-gray-500 dark:text-slate-400">
                  Daha fazla bildirim için Dashboard'u ziyaret edin
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
