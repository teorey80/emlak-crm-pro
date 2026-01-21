import React, { useState, useEffect, useMemo } from 'react';
import { Bell, X, Sparkles, CheckCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { findMatches, MatchResult } from '../services/matchingService';
import { useNavigate } from 'react-router-dom';

const NotificationBell: React.FC = () => {
  const { properties, requests } = useData();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedMatches, setDismissedMatches] = useState<string[]>(() => {
    // Load dismissed matches from localStorage
    const saved = localStorage.getItem('dismissedMatches');
    return saved ? JSON.parse(saved) : [];
  });

  // Calculate matches
  const allMatches = useMemo(() => {
    return findMatches(properties, requests);
  }, [properties, requests]);

  // Filter out dismissed matches
  const activeMatches = useMemo(() => {
    return allMatches.filter(match => {
      const matchId = `${match.request.id}-${match.property.id}`;
      return !dismissedMatches.includes(matchId);
    });
  }, [allMatches, dismissedMatches]);

  const unreadCount = activeMatches.length;

  // Save dismissed matches to localStorage
  useEffect(() => {
    localStorage.setItem('dismissedMatches', JSON.stringify(dismissedMatches));
  }, [dismissedMatches]);

  const dismissMatch = (match: MatchResult) => {
    const matchId = `${match.request.id}-${match.property.id}`;
    setDismissedMatches(prev => [...prev, matchId]);
  };

  const dismissAll = () => {
    const allMatchIds = activeMatches.map(m => `${m.request.id}-${m.property.id}`);
    setDismissedMatches(prev => [...prev, ...allMatchIds]);
    setIsOpen(false);
  };

  const handleMatchClick = (match: MatchResult) => {
    dismissMatch(match);
    navigate(`/properties/${match.property.id}`);
    setIsOpen(false);
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
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold text-white bg-red-500 rounded-full px-1 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
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
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <h3 className="font-semibold text-slate-800 dark:text-white text-sm">Akıllı Eşleşmeler</h3>
              </div>
              {unreadCount > 0 && (
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
              {activeMatches.length === 0 ? (
                <div className="p-8 text-center text-gray-400 dark:text-slate-500">
                  <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Yeni eşleşme bildirimi yok</p>
                  <p className="text-xs mt-1 text-gray-400">Talepler ve portföyler arasında eşleşme olduğunda burada göreceksiniz.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-slate-700">
                  {activeMatches.slice(0, 10).map((match, idx) => (
                    <div
                      key={`${match.request.id}-${match.property.id}-${idx}`}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1" onClick={() => handleMatchClick(match)}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 px-2 py-0.5 rounded-full">
                              %{match.score} Eşleşme
                            </span>
                          </div>
                          <p className="font-medium text-slate-800 dark:text-white text-sm">
                            {match.request.customerName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                            {match.request.type} arıyor (Max {match.request.maxPrice?.toLocaleString('tr-TR')} TL)
                          </p>
                          <div className="flex items-center gap-1 mt-2 text-xs text-green-600 dark:text-green-400">
                            <CheckCircle className="w-3 h-3" />
                            <span>{match.property.title} - {match.property.price.toLocaleString('tr-TR')} TL</span>
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
                </div>
              )}
            </div>

            {/* Footer */}
            {activeMatches.length > 10 && (
              <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/80">
                <button
                  onClick={() => {
                    navigate('/');
                    setIsOpen(false);
                  }}
                  className="text-xs text-[#1193d4] hover:underline font-medium"
                >
                  Dashboard'da {activeMatches.length - 10} eşleşme daha görüntüle
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
