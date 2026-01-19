import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Phone, MessageSquare, Clock, Plus, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Activity, Property, Request } from '../types';

type CalendarEvent = {
    id: string;
    date: string; // YYYY-MM-DD
    type: 'activity' | 'property' | 'request';
    subtype?: string; // e.g. 'Yer Gösterimi' or 'Daire'
    title: string;
    description: string;
    status?: string;
    time?: string;
    sourceData: Activity | Property | Request;
};

const CalendarPage: React.FC = () => {
    const { activities, properties, requests } = useData();
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    // Helper to format date as YYYY-MM-DD in local time
    const formatDateKey = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    // Formatting Helpers
    const months = [
        "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
        "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
    ];

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => {
        const day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1; // Adjust for Monday start (0 = Mon, 6 = Sun)
    };

    // Calendar Math
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysCount = getDaysInMonth(year, month);
    const firstDayIndex = getFirstDayOfMonth(year, month);

    // Generate Grid
    const days = Array.from({ length: daysCount }, (_, i) => i + 1);
    const emptySlots = Array.from({ length: firstDayIndex }, (_, i) => i);

    // Navigation
    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const goToToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    };

    // Unified Events Data
    const calendarEvents = useMemo<CalendarEvent[]>(() => {
        // 1. Map Activities
        const activityEvents: CalendarEvent[] = activities.map(a => ({
            id: a.id,
            date: a.date,
            type: 'activity',
            subtype: a.type,
            title: a.customerName,
            description: a.description,
            status: a.status,
            time: a.time,
            sourceData: a
        }));

        // 2. Map Properties (using listingDate or fallback to createdAt/today if missing)
        // If listingDate is empty, we exclude it or use a default. Ideally only listed ones.
        const propertyEvents: CalendarEvent[] = properties
            .filter(p => p.listingDate) // Only properties with dates
            .map(p => ({
                id: p.id,
                date: (p.listingDate as string).split('T')[0], // Ensure YYYY-MM-DD
                type: 'property',
                subtype: p.type,
                title: p.title,
                description: `${p.location} - ${p.price} ${p.currency}`,
                status: p.status, // Satılık/Kiralık
                sourceData: p
            }));

        // 3. Map Requests
        const requestEvents: CalendarEvent[] = requests.map(r => ({
            id: r.id,
            date: r.date,
            type: 'request',
            subtype: r.type,
            title: r.customerName,
            description: `${r.requestType} ${r.type} - Bütçe: ${r.maxPrice.toLocaleString('tr-TR')} ${r.currency}`,
            status: r.status,
            sourceData: r
        }));

        return [...activityEvents, ...propertyEvents, ...requestEvents];
    }, [activities, properties, requests]);

    // Data Filtering
    const getEventsForDate = (day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return calendarEvents.filter(e => e.date === dateStr);
    };

    const selectedEvents = useMemo(() => {
        const dateStr = formatDateKey(selectedDate);
        return calendarEvents
            .filter(e => e.date === dateStr)
            .sort((a, b) => {
                // Time sort
                if (a.time && b.time) return a.time.localeCompare(b.time);
                return 0;
            });
    }, [selectedDate, calendarEvents]);

    const isToday = (day: number) => {
        const today = new Date();
        return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    };

    const isSelected = (day: number) => {
        return day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();
    };

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] gap-6 animate-fade-in">
            {/* Calendar Section */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-[#1193d4]" />
                        {months[month]} {year}
                    </h2>
                    <div className="flex items-center gap-2">
                        <button onClick={goToToday} className="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-lg hover:bg-gray-200 transition-colors">
                            Bugün
                        </button>
                        <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-0.5">
                            <button onClick={prevMonth} className="p-1 hover:bg-white dark:hover:bg-slate-600 rounded-md transition-colors text-gray-600 dark:text-slate-300">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button onClick={nextMonth} className="p-1 hover:bg-white dark:hover:bg-slate-600 rounded-md transition-colors text-gray-600 dark:text-slate-300">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Days Header */}
                <div className="grid grid-cols-7 border-b border-gray-100 dark:border-slate-700">
                    {['Paz', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(d => (
                        <div key={d} className="p-3 text-center text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Grid */}
                <div className="flex-1 grid grid-cols-7 auto-rows-fr p-2 gap-1 overflow-y-auto">
                    {emptySlots.map(i => <div key={`empty-${i}`} />)}

                    {days.map(day => {
                        const dayEvents = getEventsForDate(day);
                        const hasPlanned = dayEvents.some(e => e.type === 'activity' && e.status === 'Planlandı');
                        const hasCompleted = dayEvents.some(e => e.type === 'activity' && e.status !== 'Planlandı');
                        const hasProperty = dayEvents.some(e => e.type === 'property');

                        return (
                            <button
                                key={day}
                                onClick={() => setSelectedDate(new Date(year, month, day))}
                                className={`
                                    relative p-2 rounded-xl flex flex-col items-center justify-start gap-1 transition-all border
                                    ${isSelected(day)
                                        ? 'bg-sky-50 dark:bg-sky-900/30 border-sky-200 dark:border-sky-700 shadow-inner'
                                        : 'bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-slate-700/50'
                                    }
                                `}
                            >
                                <span className={`
                                    w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium
                                    ${isToday(day) ? 'bg-[#1193d4] text-white shadow-sm' : 'text-gray-700 dark:text-slate-300'}
                                `}>
                                    {day}
                                </span>

                                {/* Indicators */}
                                <div className="flex gap-1 h-1.5 flex-wrap justify-center max-w-[2rem]">
                                    {hasPlanned && <span className="w-1.5 h-1.5 rounded-full bg-[#1193d4]" title="Planlanmış Aktivite" />}
                                    {hasCompleted && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Geçmiş Aktivite" />}
                                    {hasProperty && <span className="w-1.5 h-1.5 rounded-full bg-purple-500" title="Yeni Emlak" />}
                                    {dayEvents.some(e => e.type === 'request') && <span className="w-1.5 h-1.5 rounded-full bg-orange-400" title="Yeni Talep" />}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Side Panel: Selected Day Detail */}
            <div className="w-full lg:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/20">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                        {selectedDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                        {selectedEvents.length > 0
                            ? `${selectedEvents.length} kayıt bulundu.`
                            : 'Bugün için kayıt bulunmuyor.'}
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {selectedEvents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-slate-500 py-10">
                            <CalendarIcon className="w-12 h-12 mb-3 opacity-20" />
                            <p className="text-sm">Planlanmış bir şey yok.</p>
                            <button
                                onClick={() => navigate('/activities/new')}
                                className="mt-4 flex items-center gap-1.5 text-sm font-medium text-[#1193d4] hover:bg-sky-50 dark:hover:bg-sky-900/20 px-4 py-2 rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Aktivite Ekle
                            </button>
                        </div>
                    ) : (
                        selectedEvents.map(event => (
                            <div
                                key={event.id}
                                onClick={() => {
                                    if (event.type === 'activity') {
                                        navigate(`/customers/${(event.sourceData as Activity).customerId}`);
                                    } else if (event.type === 'property') {
                                        navigate(`/properties/${event.id}`);
                                    } else {
                                        navigate(`/requests/edit/${event.id}`);
                                    }
                                }}
                                className={`
                                    group p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden
                                    ${event.type === 'property'
                                        ? 'bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-800/30'
                                        : event.type === 'request'
                                            ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-800/30'
                                            : event.status === 'Planlandı'
                                                ? 'bg-white dark:bg-slate-800 border-l-4 border-l-[#1193d4] border-gray-100 dark:border-slate-700 shadow-sm'
                                                : 'bg-gray-50 dark:bg-slate-700/30 border-gray-100 dark:border-slate-700'
                                    }
                                `}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${event.type === 'property'
                                        ? 'bg-purple-100 text-purple-700'
                                        : event.type === 'request'
                                            ? 'bg-orange-100 text-orange-700'
                                            : event.status === 'Planlandı'
                                                ? 'bg-sky-100 text-sky-700'
                                                : 'bg-emerald-100 text-emerald-700'
                                        }`}>
                                        {event.type === 'property' ? 'Yeni İlan' : event.type === 'request' ? 'Müşteri Talebi' : event.status}
                                    </span>
                                    {event.time && (
                                        <span className="flex items-center text-xs font-semibold text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-gray-100 dark:border-slate-700">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {event.time}
                                        </span>
                                    )}
                                </div>

                                <h4 className="font-bold text-slate-800 dark:text-white mb-0.5 flex items-center gap-2">
                                    {event.type === 'property' && <Home className="w-3.5 h-3.5 text-purple-500" />}
                                    {event.subtype === 'Telefon Görüşmesi' && <Phone className="w-3.5 h-3.5 text-gray-400" />}
                                    {event.subtype === 'Yer Gösterimi' && <MapPin className="w-3.5 h-3.5 text-gray-400" />}
                                    {event.title}
                                </h4>

                                <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2">
                                    {event.description}
                                </p>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-100 dark:border-slate-700 grid grid-cols-2 gap-2">
                    <button
                        onClick={() => navigate('/activities/new')}
                        className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-sky-50 dark:bg-sky-900/20 text-[#1193d4] hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors text-xs font-bold"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Aktivite
                    </button>
                    <button
                        onClick={() => navigate('/properties/new')}
                        className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors text-xs font-bold"
                    >
                        <Home className="w-3.5 h-3.5" />
                        Emlak
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CalendarPage;
