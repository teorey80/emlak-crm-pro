import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, PhoneIncoming, PhoneOutgoing, Home, Users, FileSignature, Wallet, Activity as ActivityIcon, UserPlus, Building2, Search, ListTodo, Handshake, FileText } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useData } from '../context/DataContext';
import { formatPhoneNumber } from '../utils/validation';

interface Entry {
  id: string;
  label: string;
  icon: React.ReactNode;
  who?: string; // kiminle görüşüldü / kim eklendi
  detail?: string; // telefon, kaynak, portföy gibi kısa bilgiler
  note?: string; // kullanıcının yazdığı açıklama
  badge?: string; // görüşme sonucu (Olumlu, Düşünüyor...)
  dateNote?: string; // bugün girilen ama başka tarihli kayıtlar için
  time: string;
  path: string;
  sort: number;
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  'Gelen Arama': <PhoneIncoming className="w-4 h-4 text-emerald-600" />,
  'Giden Arama': <PhoneOutgoing className="w-4 h-4 text-sky-600" />,
  'Yer Gösterimi': <Home className="w-4 h-4 text-amber-600" />,
  'Ofis Toplantısı': <Users className="w-4 h-4 text-violet-600" />,
  'Tapu İşlemi': <FileSignature className="w-4 h-4 text-rose-600" />,
  'Kapora Alındı': <Wallet className="w-4 h-4 text-green-600" />,
};

const BADGE_TONES: Record<string, string> = {
  'Olumlu': 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  'Olumsuz': 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  'Düşünüyor': 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  'Tamamlandı': 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
};

const clockTime = (iso: string) => new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
const shortDate = (day: string) => new Date(`${day}T12:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });

function localDayBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
  const day = [start.getFullYear(), String(start.getMonth() + 1).padStart(2, '0'), String(start.getDate()).padStart(2, '0')].join('-');
  const next = [end.getFullYear(), String(end.getMonth() + 1).padStart(2, '0'), String(end.getDate()).padStart(2, '0')].join('-');
  return { day, next, start: start.toISOString(), end: end.toISOString() };
}

const TodayTimeline: React.FC = () => {
  const { session } = useData();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!session?.user.id) return;
    setLoading(true); setError('');
    const { day, next, start, end } = localDayBounds();
    try {
    const [activityResult, customerResult, propertyResult, requestResult, taskResult, saleResult, documentResult] = await Promise.all([
        supabase.from('activities').select('id,type,customerName,propertyTitle,description,date,time,status,created_at').eq('user_id', session.user.id).or(`and(date.gte.${day},date.lt.${next}),and(created_at.gte.${start},created_at.lt.${end})`),
        supabase.from('customers').select('id,name,phone,source,customerType,created_at').eq('user_id', session.user.id).gte('created_at', start).lt('created_at', end),
        supabase.from('properties').select('id,title,created_at').eq('user_id', session.user.id).gte('created_at', start).lt('created_at', end),
        supabase.from('requests').select('id,customerName,created_at,requestType').eq('user_id', session.user.id).gte('created_at', start).lt('created_at', end),
        supabase.from('crm_tasks').select('id,title,created_at').eq('user_id', session.user.id).gte('created_at', start).lt('created_at', end),
        supabase.from('sales').select('id,buyer_name,created_at,transaction_type').eq('user_id', session.user.id).gte('created_at', start).lt('created_at', end),
        supabase.from('documents').select('id,file_name,entity_id,entity_type,created_at').eq('uploaded_by', session.user.id).gte('created_at', start).lt('created_at', end),
      ]);
      for (const result of [activityResult, customerResult, propertyResult, requestResult, taskResult, saleResult, documentResult]) if (result.error) throw result.error;
      const result: Entry[] = [];
      for (const row of activityResult.data || []) {
        if (row.status === 'Planlandı') continue;
        const time = typeof row.time === 'string' ? row.time.slice(0, 5) : '';
        const datedToday = row.date === day;
        result.push({
          id: `a-${row.id}`,
          label: row.type || 'Aktivite',
          icon: ACTIVITY_ICONS[row.type] || <ActivityIcon className="w-4 h-4 text-slate-500" />,
          who: row.customerName || undefined,
          detail: row.propertyTitle ? `Portföy: ${row.propertyTitle}` : undefined,
          note: row.description || undefined,
          badge: row.status || undefined,
          dateNote: datedToday ? undefined : `${shortDate(row.date)}${time ? ` ${time}` : ''} tarihli`,
          time: datedToday ? (time || '—') : clockTime(row.created_at),
          path: `/activities/edit/${row.id}`,
          sort: datedToday && time ? new Date(`${day}T${time}:00`).getTime() : new Date(row.created_at).getTime(),
        });
      }
      for (const row of customerResult.data || []) result.push({
        id: `c-${row.id}`,
        label: row.customerType ? `Yeni müşteri · ${row.customerType}` : 'Yeni müşteri',
        icon: <UserPlus className="w-4 h-4 text-blue-600" />,
        who: row.name,
        detail: [row.phone ? formatPhoneNumber(row.phone) : '', row.source ? `Kaynak: ${row.source}` : ''].filter(Boolean).join(' · ') || undefined,
        time: clockTime(row.created_at), path: `/customers/${row.id}`, sort: new Date(row.created_at).getTime(),
      });
      for (const row of propertyResult.data || []) result.push({ id: `p-${row.id}`, label: 'Yeni portföy', icon: <Building2 className="w-4 h-4 text-indigo-600" />, who: row.title, time: clockTime(row.created_at), path: `/properties/${row.id}`, sort: new Date(row.created_at).getTime() });
      for (const row of requestResult.data || []) result.push({ id: `r-${row.id}`, label: 'Yeni talep', icon: <Search className="w-4 h-4 text-teal-600" />, who: `${row.customerName} · ${row.requestType}`, time: clockTime(row.created_at), path: `/requests/edit/${row.id}`, sort: new Date(row.created_at).getTime() });
      for (const row of taskResult.data || []) result.push({ id: `t-${row.id}`, label: 'Yeni görev', icon: <ListTodo className="w-4 h-4 text-slate-600" />, who: row.title, time: clockTime(row.created_at), path: '/tasks', sort: new Date(row.created_at).getTime() });
      for (const row of saleResult.data || []) result.push({ id: `s-${row.id}`, label: row.transaction_type === 'rental' ? 'Yeni kiralama' : 'Yeni satış', icon: <Handshake className="w-4 h-4 text-green-600" />, who: row.buyer_name || 'İşlem', time: clockTime(row.created_at), path: `/sales/${row.id}/edit`, sort: new Date(row.created_at).getTime() });
      for (const row of documentResult.data || []) result.push({ id: `d-${row.id}`, label: 'Yeni belge', icon: <FileText className="w-4 h-4 text-slate-600" />, who: row.file_name, time: clockTime(row.created_at), path: row.entity_type === 'property' ? `/properties/${row.entity_id}` : row.entity_type === 'customer' ? `/customers/${row.entity_id}` : `/sales/${row.entity_id}/edit`, sort: new Date(row.created_at).getTime() });
      result.sort((a, b) => b.sort - a.sort);
      setEntries(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Günlük kayıtlar yüklenemedi.');
    } finally { setLoading(false); }
  }, [session?.user.id]);

  useEffect(() => { void load(); }, [load]);

  return <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6 flex flex-col">
    <div className="flex items-center justify-between mb-4">
      <div><h2 className="text-lg font-bold text-slate-800 dark:text-white">Bugün Yaptıklarım</h2><p className="text-xs text-gray-500">{entries.length} kayıt</p></div>
      <button type="button" onClick={() => void load()} aria-label="Bugünün kayıtlarını yenile" className="text-sky-600"><RefreshCw className="w-4 h-4" /></button>
    </div>
    {loading ? <p className="text-sm text-gray-500">Yükleniyor...</p> : error ? <p className="text-sm text-red-600">{error}</p> : entries.length === 0 ? <p className="text-sm text-gray-500">Bugün henüz tamamlanan bir kayıt yok.</p> :
      <div className="space-y-2 max-h-[430px] overflow-y-auto">
        {entries.map(entry => <Link key={entry.id} to={entry.path} className="block rounded-lg border border-gray-100 dark:border-slate-700 p-3 hover:border-sky-300">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="shrink-0">{entry.icon}</span>
              <strong className="text-sm text-slate-800 dark:text-white truncate">{entry.label}</strong>
              {entry.badge && <span className={`shrink-0 text-[11px] px-1.5 py-0.5 rounded ${BADGE_TONES[entry.badge] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>{entry.badge}</span>}
            </div>
            <span className="shrink-0 text-xs text-gray-500">{entry.time}</span>
          </div>
          {entry.who && <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mt-1">{entry.who}</p>}
          {entry.detail && <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{entry.detail}</p>}
          {entry.note && <p className="text-xs text-gray-600 dark:text-slate-400 mt-1 line-clamp-2">{entry.note}</p>}
          {entry.dateNote && <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">Bugün girildi · {entry.dateNote}</p>}
        </Link>)}
      </div>}
  </section>;
};

export default TodayTimeline;
