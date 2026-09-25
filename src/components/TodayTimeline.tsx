import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useData } from '../context/DataContext';

interface Entry { id: string; label: string; detail: string; time: string; path: string; sort: number }

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
        supabase.from('activities').select('id,type,customerName,description,date,time,status').eq('user_id', session.user.id).gte('date', day).lt('date', next).order('time', { ascending: false }),
        supabase.from('customers').select('id,name,created_at').eq('user_id', session.user.id).gte('created_at', start).lt('created_at', end),
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
        result.push({ id: `a-${row.id}`, label: row.type, detail: [row.customerName, row.description].filter(Boolean).join(' · '), time: time || '—', path: `/activities/edit/${row.id}`, sort: time ? new Date(`${day}T${time}:00`).getTime() : 0 });
      }
      for (const row of customerResult.data || []) result.push({ id: `c-${row.id}`, label: 'Yeni müşteri', detail: row.name, time: new Date(row.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), path: `/customers/${row.id}`, sort: new Date(row.created_at).getTime() });
      for (const row of propertyResult.data || []) result.push({ id: `p-${row.id}`, label: 'Yeni portföy', detail: row.title, time: new Date(row.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), path: `/properties/${row.id}`, sort: new Date(row.created_at).getTime() });
      for (const row of requestResult.data || []) result.push({ id: `r-${row.id}`, label: 'Yeni talep', detail: `${row.customerName} · ${row.requestType}`, time: new Date(row.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), path: `/requests/edit/${row.id}`, sort: new Date(row.created_at).getTime() });
      for (const row of taskResult.data || []) result.push({ id: `t-${row.id}`, label: 'Yeni görev', detail: row.title, time: new Date(row.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), path: '/tasks', sort: new Date(row.created_at).getTime() });
      for (const row of saleResult.data || []) result.push({ id: `s-${row.id}`, label: row.transaction_type === 'rental' ? 'Yeni kiralama' : 'Yeni satış', detail: row.buyer_name || 'İşlem', time: new Date(row.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), path: `/sales/${row.id}/edit`, sort: new Date(row.created_at).getTime() });
      for (const row of documentResult.data || []) result.push({ id: `d-${row.id}`, label: 'Yeni belge', detail: row.file_name, time: new Date(row.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), path: row.entity_type === 'property' ? `/properties/${row.entity_id}` : row.entity_type === 'customer' ? `/customers/${row.entity_id}` : `/sales/${row.entity_id}/edit`, sort: new Date(row.created_at).getTime() });
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
          <div className="flex justify-between gap-2"><strong className="text-sm text-slate-800 dark:text-white">{entry.label}</strong><span className="text-xs text-gray-500">{entry.time}</span></div>
          <p className="text-xs text-gray-600 dark:text-slate-400 mt-1 line-clamp-2">{entry.detail}</p>
        </Link>)}
      </div>}
  </section>;
};

export default TodayTimeline;
