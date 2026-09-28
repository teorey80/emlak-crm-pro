import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Calendar, MapPin, ChevronRight, Sparkles, Users, Home as HomeIcon, DollarSign, Plus,
  AlertTriangle, Phone, ClipboardList, UserPlus, Building2, X, CheckCircle2, Clock, Tag
} from 'lucide-react';
import TodayTimeline from '../components/TodayTimeline';
import { useData } from '../context/DataContext';
import { supabase } from '../services/supabaseClient';
import { findMatches } from '../services/matchingService';
import type { Activity, Property } from '../types';

const DAY = 24 * 60 * 60 * 1000;

// YYYY-MM-DD (yerel saat)
const localDateString = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// DB satırları hem camelCase hem snake_case alan taşıyabiliyor
const timeOf = (...values: (string | null | undefined)[]) => {
  for (const value of values) {
    if (!value) continue;
    const t = new Date(value).getTime();
    if (!Number.isNaN(t)) return t;
  }
  return 0;
};

const listingStatusOf = (p: Property) => p.listing_status || p.listingStatus || 'Aktif';
const isActiveListing = (p: Property) => ['Aktif', 'Kapora Alındı'].includes(listingStatusOf(p));

const daysAgoLabel = (time: number) => {
  const days = Math.floor((Date.now() - time) / DAY);
  if (days <= 0) return 'bugün';
  if (days === 1) return 'dün';
  return `${days} gün önce`;
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Günaydın';
  if (h < 18) return 'İyi günler';
  return 'İyi akşamlar';
};

interface FollowUp {
  id: string;
  kind: 'thinking' | 'silent' | 'price' | 'stale-request';
  title: string;
  detail: string;
  action: string;
  path: string;
}

const followUpStyle: Record<FollowUp['kind'], { icon: React.ReactNode; className: string }> = {
  thinking: { icon: <Clock className="w-4 h-4" />, className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  silent: { icon: <Phone className="w-4 h-4" />, className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' },
  price: { icon: <Tag className="w-4 h-4" />, className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  'stale-request': { icon: <ClipboardList className="w-4 h-4" />, className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
};

const card = 'bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm';

const Dashboard: React.FC = () => {
  const { customers, properties, activities, requests, sales, session, userProfile } = useData();
  const navigate = useNavigate();
  const me = session?.user.id;

  // İlan sayıları: bağlamda en fazla 50 ilan yüklü olduğu için sayım doğrudan DB'den alınır
  const [listingCounts, setListingCounts] = useState<{ mine: number; office: number } | null>(null);
  useEffect(() => {
    if (!me) return;
    let cancelled = false;
    const activeFilter = 'listing_status.is.null,listing_status.in.("Aktif","Kapora Alındı")';
    Promise.all([
      supabase.from('properties').select('id', { count: 'exact', head: true }).eq('user_id', me).or(activeFilter),
      supabase.from('properties').select('id', { count: 'exact', head: true }).or(activeFilter),
    ]).then(([mine, office]) => {
      if (cancelled || mine.error || office.error) return;
      setListingCounts({ mine: mine.count ?? 0, office: office.count ?? 0 });
    });
    return () => { cancelled = true; };
  }, [me, properties.length]);

  const myProperties = useMemo(() => properties.filter(p => p.user_id === me), [properties, me]);
  const myRequests = useMemo(() => requests.filter(r => !r.user_id || r.user_id === me), [requests, me]);
  const myActivities = useMemo(() => activities.filter(a => !a.user_id || a.user_id === me), [activities, me]);

  const todayStr = localDateString(new Date());

  // --- Bugünün planı ---
  const todayPlan = useMemo(() => {
    const overdue = myActivities
      .filter(a => a.status === 'Planlandı' && a.date && a.date < todayStr)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
    const today = myActivities
      .filter(a => a.date === todayStr)
      .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
    const upcoming = myActivities
      .filter(a => a.status === 'Planlandı' && a.date > todayStr)
      .sort((a, b) => `${a.date}${a.time || ''}`.localeCompare(`${b.date}${b.time || ''}`))
      .slice(0, 3);
    return { overdue, today, upcoming };
  }, [myActivities, todayStr]);

  // --- Bu ayın özeti ---
  const month = useMemo(() => {
    const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    const monthStartStr = localDateString(new Date(start));
    const mySales = sales.filter(s => !s.user_id || s.user_id === me);
    return {
      requests: myRequests.filter(r => timeOf(r.created_at, r.date) >= start).length,
      customers: customers.filter(c => timeOf(c.createdAt, (c as { created_at?: string }).created_at) >= start).length,
      showings: myActivities.filter(a => a.type === 'Yer Gösterimi' && a.date >= monthStartStr && a.status !== 'Planlandı').length,
      sales: mySales.filter(s => timeOf(s.saleDate, s.sale_date) >= start).length,
    };
  }, [myRequests, customers, myActivities, sales, me]);

  // --- Takip edilmesi gerekenler ---
  const followUps = useMemo<FollowUp[]>(() => {
    const now = Date.now();
    const items: FollowUp[] = [];
    const lastContact = new Map<string, number>();
    for (const a of myActivities) {
      if (!a.customerId || a.status === 'Planlandı') continue;
      const t = timeOf(a.date);
      if (t > (lastContact.get(a.customerId) || 0)) lastContact.set(a.customerId, t);
    }

    // 1) "Düşünüyor" denilen ve sonrasında temas olmayan yer gösterimleri
    for (const a of myActivities) {
      if (a.type !== 'Yer Gösterimi' || a.status !== 'Düşünüyor') continue;
      const t = timeOf(a.date);
      if (now - t > 45 * DAY || now - t < DAY) continue;
      if ((lastContact.get(a.customerId) || 0) > t) continue;
      items.push({
        id: `thinking-${a.id}`, kind: 'thinking',
        title: `${a.customerName} düşünüyor`,
        detail: `${a.propertyTitle ? `${a.propertyTitle} · ` : ''}${daysAgoLabel(t)} gösterildi, dönüş yapılmadı`,
        action: 'Ara', path: `/customers/${a.customerId}`,
      });
    }

    // 2) Uzun süredir temas kurulmayan aktif müşteriler.
    // Aktivitelerin yalnız son 50'si yüklü; son 30 günü tam kapsamıyorsa yanlış uyarı vermemek için atla.
    const oldestLoaded = Math.min(...myActivities.map(a => timeOf(a.date)).filter(Boolean), now);
    const coversLast30 = activities.length < 50 || now - oldestLoaded > 30 * DAY;
    if (coversLast30) {
      const silent = customers
        .filter(c => c.status === 'Aktif' && c.customerType !== 'Emlakçı')
        .filter(c => now - timeOf(c.createdAt, (c as { created_at?: string }).created_at) > 14 * DAY)
        .map(c => ({ c, last: lastContact.get(c.id) || 0 }))
        .filter(({ last }) => now - last > 30 * DAY)
        .sort((a, b) => b.last - a.last)
        .slice(0, 4);
      for (const { c, last } of silent) {
        items.push({
          id: `silent-${c.id}`, kind: 'silent',
          title: `${c.name} ile 30+ gündür konuşulmadı`,
          detail: last ? `Son temas ${daysAgoLabel(last)}` : 'Henüz hiç aktivite girilmemiş',
          action: 'Ara', path: `/customers/${c.id}`,
        });
      }
    }

    // 3) Fiyatı girilmemiş aktif ilanlar
    for (const p of myProperties.filter(isActiveListing).filter(p => !p.price || p.price <= 0)) {
      items.push({
        id: `price-${p.id}`, kind: 'price',
        title: `Fiyatı girilmemiş ilan`,
        detail: p.title || 'Başlıksız ilan',
        action: 'Düzelt', path: `/properties/${p.id}`,
      });
    }

    // 4) 60 günden eski aktif talepler
    for (const r of myRequests.filter(r => r.status === 'Aktif')) {
      const t = timeOf(r.created_at, r.date);
      if (!t || now - t < 60 * DAY) continue;
      if ((lastContact.get(r.customerId) || 0) > now - 30 * DAY) continue;
      items.push({
        id: `request-${r.id}`, kind: 'stale-request',
        title: `${r.customerName} talebi hâlâ güncel mi?`,
        detail: `${r.requestType} ${r.type} · ${daysAgoLabel(t)} eklendi`,
        action: 'Kontrol et', path: `/requests/${r.id}`,
      });
    }
    return items;
  }, [myActivities, activities.length, customers, myProperties, myRequests]);

  // --- Yeni eşleşmeler (son 30 gün, "Geç" denilenler hariç) ---
  // Gizlenenler DB'de (dismissed_matches) tutulur, böylece her cihazda aynı görünür.
  // Tablo henüz yoksa (migration uygulanmadıysa) tarayıcı hafızasına düşülür.
  const legacyKey = `dashboard:dismissedMatches:${me || 'anon'}`;
  const readLocal = (): string[] => {
    try { return JSON.parse(localStorage.getItem(legacyKey) || '[]'); } catch { return []; }
  };
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [dismissStore, setDismissStore] = useState<'db' | 'local'>('db');
  useEffect(() => {
    if (!me) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from('dismissed_matches').select('request_id,property_id');
      if (cancelled) return;
      if (error) {
        setDismissStore('local');
        setDismissed(readLocal());
        return;
      }
      const keys = (data || []).map(row => `${row.request_id}:${row.property_id}`);
      // Bu cihazda önceden gizlenmiş olanları bir kerelik DB'ye taşı
      const pending = readLocal().filter(key => !keys.includes(key));
      if (pending.length > 0) {
        const rows = pending.map(key => { const [request_id, property_id] = key.split(':'); return { request_id, property_id }; });
        const { error: moveError } = await supabase.from('dismissed_matches').upsert(rows, { ignoreDuplicates: true });
        if (!moveError) {
          keys.push(...pending);
          try { localStorage.removeItem(legacyKey); } catch { /* yoksay */ }
        }
      }
      if (!cancelled) { setDismissStore('db'); setDismissed(keys); }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);
  const dismissMatch = async (requestId: string, propertyId: string) => {
    const key = `${requestId}:${propertyId}`;
    setDismissed(prev => [...prev, key]);
    if (dismissStore === 'db') {
      const { error } = await supabase.from('dismissed_matches').upsert({ request_id: requestId, property_id: propertyId }, { ignoreDuplicates: true });
      if (!error) return;
      console.error('Eşleşme gizlenemedi:', error);
    }
    try { localStorage.setItem(legacyKey, JSON.stringify([...readLocal(), key].slice(-500))); } catch { /* yalnız bu oturumda gizli kalır */ }
  };

  const newMatches = useMemo(() => {
    const cutoff = Date.now() - 30 * DAY;
    return findMatches(properties, requests)
      .filter(m => m.request.user_id === me || m.property.user_id === me)
      .filter(m => timeOf(m.request.created_at, m.request.date) >= cutoff || timeOf(m.property.created_at, m.property.updated_at) >= cutoff)
      .filter(m => !dismissed.includes(`${m.request.id}:${m.property.id}`))
      .slice(0, 4);
  }, [properties, requests, me, dismissed]);

  const firstName = (userProfile?.name || '').split(' ')[0];
  const myActiveListings = listingCounts?.mine ?? myProperties.filter(isActiveListing).length;
  const todayCount = todayPlan.today.length + todayPlan.overdue.length;

  const quickActions = [
    { label: 'Yer Gösterimi', icon: <MapPin className="w-5 h-5" />, path: '/activities/new', className: 'bg-indigo-600 hover:bg-indigo-700 text-white' },
    { label: 'Yeni Talep', icon: <ClipboardList className="w-5 h-5" />, path: '/requests/new', className: 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 hover:border-sky-300' },
    { label: 'Yeni Müşteri', icon: <UserPlus className="w-5 h-5" />, path: '/customers/new', className: 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 hover:border-sky-300' },
    { label: 'Yeni İlan', icon: <Building2 className="w-5 h-5" />, path: '/properties/new', className: 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 hover:border-sky-300' },
  ];

  const renderActivityRow = (a: Activity, variant: 'overdue' | 'today' | 'upcoming') => (
    <button
      key={a.id}
      type="button"
      onClick={() => navigate(`/activities/edit/${a.id}`)}
      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left border transition-colors ${variant === 'overdue'
        ? 'bg-red-50/70 dark:bg-red-900/10 border-red-100 dark:border-red-900/40 hover:border-red-300'
        : 'bg-gray-50 dark:bg-slate-700/40 border-gray-100 dark:border-slate-700 hover:border-sky-200 dark:hover:border-sky-800'}`}
    >
      <div className="w-14 shrink-0 text-center">
        <p className={`text-sm font-bold ${variant === 'overdue' ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-white'}`}>{a.time?.slice(0, 5) || '—'}</p>
        {variant !== 'today' && <p className="text-[10px] text-gray-500 dark:text-slate-400">{new Date(a.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</p>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{a.type} · {a.customerName}</p>
        <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{a.propertyTitle || a.description || '—'}</p>
      </div>
      {variant === 'overdue'
        ? <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 shrink-0">Sonucu gir</span>
        : a.status !== 'Planlandı'
          ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
    </button>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Karşılama + hızlı işlemler */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-slate-400">{new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mt-1">{greeting()}{firstName ? `, ${firstName}` : ''} 👋</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {todayCount > 0 ? `Bugün ${todayPlan.today.length} planın var` : 'Bugün için planlanmış iş yok'}
            {followUps.length > 0 ? ` · ${followUps.length} takip seni bekliyor` : ''}
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {quickActions.map(q => (
            <button key={q.label} type="button" onClick={() => navigate(q.path)} className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold shadow-sm transition-colors ${q.className}`}>
              {q.icon}{q.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Bugünün planı */}
          <section className={`${card} p-5`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"><Calendar className="w-5 h-5 text-sky-600" /> Bugünün Planı</h2>
              <Link to="/calendar" className="text-sm text-sky-600 dark:text-sky-400 font-medium hover:underline">Takvim</Link>
            </div>

            {todayPlan.overdue.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400 mb-2 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Geciken randevular — sonucu girilmedi</p>
                <div className="space-y-2">{todayPlan.overdue.map(a => renderActivityRow(a, 'overdue'))}</div>
              </div>
            )}

            {todayPlan.today.length > 0 ? (
              <div className="space-y-2">{todayPlan.today.map(a => renderActivityRow(a, 'today'))}</div>
            ) : (
              <div className="p-6 text-center rounded-xl border border-dashed border-gray-200 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-700/20">
                <p className="text-sm text-gray-500 dark:text-slate-400">Bugün için randevu yok. Takip listesindeki müşterileri aramak için iyi bir gün.</p>
                <button type="button" onClick={() => navigate('/activities/new')} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#1193d4] hover:underline"><Plus className="w-4 h-4" /> Randevu ekle</button>
              </div>
            )}

            {todayPlan.upcoming.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400 mb-2">Yaklaşan</p>
                <div className="space-y-2">{todayPlan.upcoming.map(a => renderActivityRow(a, 'upcoming'))}</div>
              </div>
            )}
          </section>

          {/* Takip edilmesi gerekenler */}
          <section className={`${card} p-5`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"><Phone className="w-5 h-5 text-amber-500" /> Takip Edilmesi Gerekenler</h2>
              {followUps.length > 0 && <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">{followUps.length}</span>}
            </div>
            {followUps.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-emerald-50/70 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/40">
                <CheckCircle2 className="w-7 h-7 mx-auto text-emerald-500" />
                <p className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">Harika, bekleyen takip yok.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-slate-700">
                {followUps.slice(0, 8).map(item => (
                  <li key={item.id} className="flex items-center gap-3 py-3">
                    <span className={`p-2 rounded-lg shrink-0 ${followUpStyle[item.kind].className}`}>{followUpStyle[item.kind].icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{item.title}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{item.detail}</p>
                    </div>
                    <button type="button" onClick={() => navigate(item.path)} className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-300 dark:hover:bg-sky-900/50">
                      {item.action}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {followUps.length > 8 && <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">+{followUps.length - 8} takip daha</p>}
          </section>

          <TodayTimeline />
        </div>

        <div className="space-y-6">
          {/* Aktif ilanlarım */}
          <button type="button" onClick={() => navigate('/properties?scope=mine&listing_status=Aktif')} className={`${card} w-full p-5 text-left hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Aktif İlanlarım</p>
                <p className="text-4xl font-bold text-slate-800 dark:text-white mt-1">{myActiveListings}</p>
              </div>
              <span className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"><HomeIcon className="w-6 h-6" /></span>
            </div>
            <p className="mt-3 text-xs text-gray-500 dark:text-slate-400">Aktif + kaporası alınmış{listingCounts ? ` · Ofiste toplam ${listingCounts.office}` : ''}</p>
          </button>

          {/* Bu ay */}
          <section className={`${card} p-5`}>
            <h2 className="text-base font-bold text-slate-800 dark:text-white mb-3">Bu Ay</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Yeni Talep', value: month.requests, icon: <ClipboardList className="w-4 h-4" />, path: '/requests?period=month', tone: 'text-sky-600 bg-sky-50 dark:bg-sky-900/30 dark:text-sky-400' },
                { label: 'Yeni Müşteri', value: month.customers, icon: <Users className="w-4 h-4" />, path: '/customers', tone: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400' },
                { label: 'Yer Gösterimi', value: month.showings, icon: <MapPin className="w-4 h-4" />, path: '/activities?type=Yer Gösterimi', tone: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400' },
                { label: 'Satış / Kira', value: month.sales, icon: <DollarSign className="w-4 h-4" />, path: '/reports', tone: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400' },
              ].map(item => (
                <button key={item.label} type="button" onClick={() => navigate(item.path)} className="p-3 rounded-xl border border-gray-100 dark:border-slate-700 text-left hover:border-sky-200 dark:hover:border-sky-800 transition-colors">
                  <span className={`inline-flex p-1.5 rounded-lg ${item.tone}`}>{item.icon}</span>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white mt-2">{item.value}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{item.label}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Yeni eşleşmeler */}
          <section className={`${card} p-5`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2"><Sparkles className="w-4 h-4 text-violet-500" /> Yeni Eşleşmeler</h2>
              <Link to="/matches" className="text-xs text-sky-600 dark:text-sky-400 font-medium hover:underline">Tümü</Link>
            </div>
            {newMatches.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-slate-400 py-4 text-center">Son 30 günde yeni eşleşme yok.</p>
            ) : (
              <ul className="space-y-2">
                {newMatches.map(m => {
                  const key = `${m.request.id}:${m.property.id}`;
                  return (
                    <li key={key} className="p-3 rounded-xl bg-violet-50/60 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-900/40">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{m.request.customerName}</p>
                          <p className="text-xs text-gray-600 dark:text-slate-300 truncate">{m.property.title}</p>
                          <p className="text-xs text-violet-700 dark:text-violet-300 mt-0.5">{m.property.price.toLocaleString('tr-TR')} ₺ · %{m.score} uyum</p>
                        </div>
                        <button type="button" aria-label="Gördüm, geç" title="Gördüm, geç" onClick={() => void dismissMatch(m.request.id, m.property.id)} className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 shrink-0"><X className="w-4 h-4" /></button>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button type="button" onClick={() => navigate(`/properties/${m.property.id}`)} className="flex-1 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700">İncele</button>
                        <button type="button" onClick={() => void dismissMatch(m.request.id, m.property.id)} className="flex-1 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-violet-200 dark:border-violet-900 text-violet-700 dark:text-violet-300 text-xs font-semibold">Gördüm, geç</button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
