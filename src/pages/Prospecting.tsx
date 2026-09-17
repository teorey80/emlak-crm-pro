import { useSearchParams } from 'react-router-dom';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ArrowRight, CalendarCheck, Columns3, Database, Phone, RefreshCw, Search, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { useData } from '../context/DataContext';
import type { ProspectCase, ProspectStage } from '../types';
import { prospectingError, prospectingRepository, type ProspectingRepository } from '../services/prospectingService';
import { ACTIVE_STAGES, CLOSED_STAGES, followUpState, formatProspectDate, istanbulDate, matchesProspect, prospectEngagementStatus, PROSPECT_STAGES, prospectSourceKind, prospectLocation } from '../utils/prospecting';
import ProspectConversation from '../components/ProspectConversation';
import ProspectImport from '../components/ProspectImport';
import ProspectStart from '../components/ProspectStart';
import ProspectProvenance from '../components/ProspectProvenance';

type View = 'today' | 'board' | 'pool' | 'archive';
type DueFilter = 'all' | 'overdue' | 'today' | 'undated';
const dueLabels = { blocked: 'Aranmasın', closed: 'Tamamlandı', pool: 'Henüz başlanmadı', undated: 'Tarih belirle', overdue: 'Gecikti', today: 'Bugün', planned: 'Planlı' };

const ProspectCard: React.FC<{ item: ProspectCase; onOpen: () => void; today: string }> = ({ item, onOpen, today }: { item: ProspectCase; onOpen: () => void; today: string }) => {
  const due = followUpState(item, today);
  return <button type="button" draggable={!item.contact.do_not_contact} onDragStart={event => { event.dataTransfer.setData('text/prospect-id', item.id); event.dataTransfer.effectAllowed = 'move'; }} onClick={onOpen} className="w-full text-left rounded-xl p-4 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-sky-400 focus-visible:outline-sky-500 shadow-sm transition-colors">
    <div className="flex items-start justify-between gap-2"><span className="font-semibold text-slate-900 dark:text-slate-100 break-words">{item.contact.name}</span>{item.data_warning && <AlertCircle size={16} className="shrink-0 text-amber-600" aria-label="Veri kontrolü gerekli" />}</div>
    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{prospectLocation(item)}</p>
    <div className="mt-3"><ProspectProvenance item={item} /></div>
    <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 line-clamp-2 break-words">{(item.last_note || item.source_note) && <span className="font-medium">{item.engagement?.crmEvents ? 'CRM notu: ' : 'Kaynak notu: '}</span>}{item.last_note || item.source_note || 'Henüz not yok.'}</p>
    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700"><span className={`text-xs font-medium ${due === 'overdue' || due === 'blocked' ? 'text-amber-700 dark:text-amber-300' : 'text-sky-700 dark:text-sky-300'}`}>{dueLabels[due]}{item.next_action_at && due !== 'blocked' ? ` · ${formatProspectDate(item.next_action_at)}` : ''}</span>
      {item.next_action && due !== 'blocked' && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 break-words">{item.next_action}</p>}
    </div>
  </button>;
};

export const ProspectingWorkspace: React.FC<{ repository: ProspectingRepository; preview?: boolean; activityId?: string; onActivityDone?: () => void }> = ({ repository, preview = false, activityId, onActivityDone }) => {
  const [creating, setCreating] = useState(false);
  const [sourceFilter, setSourceFilter] = useState('all');
  const [records, setRecords] = useState<ProspectCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<View>('today');
  const [dueFilter, setDueFilter] = useState<DueFilter>('all');
  const [search, setSearch] = useState('');
  const [site, setSite] = useState('');
  const [engagementFilter, setEngagementFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [proposedStage, setProposedStage] = useState<ProspectStage | undefined>();
  const [importing, setImporting] = useState(false);
  const [today, setToday] = useState(istanbulDate());
  const generation = useRef(0);
  const reload = useCallback(async () => {
    const current = ++generation.current;
    setLoading(true); setError('');
    try {
      const data = await repository.list();
      if (current === generation.current) setRecords(data);
      return data;
    } catch (err) { if (current === generation.current) setError(prospectingError(err)); throw err; }
    finally { if (current === generation.current) setLoading(false); }
  }, [repository]);
  useEffect(() => { void reload().catch(() => {}); return () => { generation.current++; }; }, [reload]);
  useEffect(() => {
    const update = () => setToday(istanbulDate());
    const timer = window.setInterval(update, 60000);
    window.addEventListener('focus', update);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', update); };
  }, []);
  const selected = records.find(r => r.id === selectedId);
  const sites = useMemo(() => [...new Set<string>(records.map((r: ProspectCase) => r.site_name))].sort((a, b) => a.localeCompare(b, 'tr')), [records]);
  const existingKeys = useMemo(() => new Set(records.map(r => r.source_key)), [records]);
  const siteRecords = useMemo(() => records.filter(r => (!site || r.site_name === site) && (sourceFilter === 'all' || prospectSourceKind(r) === sourceFilter)), [records, site, sourceFilter]);
  const counts = useMemo(() => siteRecords.reduce((all, r) => { const key = followUpState(r, today); all[key]++; return all; }, { blocked: 0, closed: 0, pool: 0, undated: 0, overdue: 0, today: 0, planned: 0 }), [siteRecords, today]);
  const filtered = useMemo(() => {
    const match = siteRecords.filter(item => {
      const engagement = prospectEngagementStatus(item);
      if (engagementFilter === 'no_crm_contact' && (engagement === 'reached' || engagement === 'unknown')) return false;
      if (engagementFilter !== 'all' && engagementFilter !== 'no_crm_contact' && engagement !== engagementFilter) return false;
      if (search.trim()) return matchesProspect(item, search);
      const state = followUpState(item, today);
      if (view === 'today') return dueFilter === 'all' ? ['overdue', 'today', 'undated'].includes(state) : state === dueFilter;
      if (view === 'board') return ACTIVE_STAGES.includes(item.stage) && !item.contact.do_not_contact;
      if (view === 'pool') return item.stage === 'pool' && !item.contact.do_not_contact;
      return ['other_agent', 'snoozed', 'won', 'lost'].includes(item.stage) || item.contact.do_not_contact;
    });
    const rank = { overdue: 0, today: 1, undated: 2, planned: 3, pool: 4, closed: 5, blocked: 6 };
    return match.sort((a, b) => rank[followUpState(a, today)] - rank[followUpState(b, today)] || (a.next_action_at || '').localeCompare(b.next_action_at || '') || a.contact.name.localeCompare(b.contact.name, 'tr'));
  }, [siteRecords, search, view, dueFilter, today, engagementFilter]);

  const open = (item: ProspectCase, stage?: ProspectStage) => { setSelectedId(item.id); setProposedStage(stage); };
  const onSaved = async (next: boolean) => {
    // Close only after the write succeeded; a failed readback must not encourage a duplicate write.
    const queue = filtered.filter(r => !r.contact.do_not_contact && !CLOSED_STAGES.includes(r.stage)).map(r => r.id);
    const currentIndex = queue.indexOf(selectedId || '');
    setSelectedId(null); setProposedStage(undefined);
    toast.success('Görüşme ve takip kaydedildi.');
    try {
      const updated = await reload();
      if (next) {
        const candidates = [...queue.slice(currentIndex + 1), ...queue.slice(0, Math.max(currentIndex, 0))];
        const id = candidates.find(candidate => updated.some(r => r.id === candidate && !r.contact.do_not_contact && !CLOSED_STAGES.includes(r.stage)));
        if (id) setSelectedId(id); else toast.success('Bu listedeki kayıtlar tamamlandı.');
      }
    } catch { toast.error('Kayıt kaydedildi; liste yenilenemedi. Yenile düğmesini kullanın.'); }
  };

  return <div className="space-y-5 text-slate-800 dark:text-slate-100">
    {preview && <div className="rounded-lg bg-amber-50 dark:bg-amber-950 px-4 py-2 text-sm text-amber-800 dark:text-amber-200">Deneme ekranı · Tamamı örnek kayıtlar · Değişiklikler bu oturumda kalır.</div>}
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-wider text-sky-700 dark:text-sky-300 mb-1">Çalışma alanım</p><h1 className="text-2xl font-semibold">Portföy Takibi</h1><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Görüşmelerin, sıradaki işlerin ve portföy fırsatların.</p></div><div className="flex flex-wrap gap-2"><button type="button" disabled={loading || !!error} onClick={() => setCreating(true)} className="bg-sky-600 text-white rounded-lg px-4 py-2.5 text-sm disabled:opacity-50">Yeni FSBO / takip</button><button type="button" onClick={() => void reload().catch(() => {})} disabled={loading} className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800" aria-label="Kayıtları yenile"><RefreshCw size={18} className={loading ? 'animate-spin' : ''} /></button><button type="button" disabled={loading || !!error} onClick={() => setImporting(!importing)} className="flex items-center gap-2 bg-sky-600 text-white rounded-lg px-4 py-2.5 text-sm disabled:opacity-50"><Upload size={16} /> İçeri aktar</button></div></div>
    {importing && <ProspectImport repository={repository} existingKeys={existingKeys} onClose={() => setImporting(false)} onDone={async () => { await reload(); }} />}
    <div className="flex flex-wrap gap-2 items-center">
      <nav className="flex flex-wrap gap-1" aria-label="Takip görünümü">{([
        ['today', 'Bugün', CalendarCheck], ['board', 'Kanban', Columns3], ['pool', 'Veri havuzu', Database], ['archive', 'Bekleyen / kapanan', ClockIcon],
      ] as const).map(([key, label, Icon]) => <button key={key} onClick={() => { setView(key); setSearch(''); }} aria-pressed={view === key && !search} className={`flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg ${view === key && !search ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}><Icon size={16} />{label}</button>)}</nav>
      <div className="relative flex-1 min-w-[220px]"><Search size={17} className="absolute left-3 top-3 text-slate-400" /><input aria-label="Tüm kayıtlarda ara" placeholder="İsim, telefon, site, blok, daire veya not…" value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-3 py-2.5 text-sm" /></div>
      {sites.length > 1 && <select aria-label="Site filtresi" value={site} onChange={e => setSite(e.target.value)} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm"><option value="">Tüm siteler</option>{sites.map(name => <option key={name}>{name}</option>)}</select>}
      <select aria-label="Kayıt kaynağı filtresi" value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm"><option value="all">Tüm kaynaklar</option><option value="list">Liste datası</option><option value="fsbo">FSBO</option><option value="manual">Manuel / diğer</option></select>
      <select aria-label="Görüşme durumu filtresi" value={engagementFilter} onChange={e => setEngagementFilter(e.target.value)} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm"><option value="all">Tüm görüşme durumları</option><option value="no_crm_contact">CRM’de görüşme kaydı olmayanlar</option><option value="reached">CRM’de görüşülenler</option><option value="unanswered">Arandı, ulaşılamadı</option><option value="imported">Eski liste / aktivite kaydı olanlar</option></select>
    </div>
    {error && <div role="alert" className="p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200"><p className="font-medium">Liste yüklenemedi</p><p className="text-sm mt-1">{error}</p></div>}
    {loading ? <p role="status" className="py-12 text-center text-slate-500">Kayıtlar yükleniyor…</p> : !error && <>
      {view === 'today' && !search && <div className="flex flex-wrap gap-2">{([
        ['all', 'Tüm işler', counts.overdue + counts.today + counts.undated], ['overdue', 'Geciken', counts.overdue], ['today', 'Bugün', counts.today], ['undated', 'Tarih bekleyen', counts.undated],
      ] as const).map(([key, label, count]) => <button key={key} aria-pressed={dueFilter === key} onClick={() => setDueFilter(key)} className={`px-3 py-1.5 rounded-full text-sm border ${dueFilter === key ? 'border-sky-500 bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-200' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}>{label} <span className="ml-1 font-semibold">{count}</span></button>)}</div>}
      {search && <p className="text-sm text-slate-500" role="status">Tüm aşamalarda {filtered.length} sonuç</p>}
      {view === 'board' && !search ? <>
        <p className="text-xs text-slate-500">Kartı açarak veya başka sütuna taşıyarak görüşme ve takip planlayabilirsin.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">{ACTIVE_STAGES.map(stage => {
          const group = filtered.filter(r => r.stage === stage);
          return <section key={stage} aria-label={PROSPECT_STAGES[stage]} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const item = records.find(r => r.id === e.dataTransfer.getData('text/prospect-id')); if (item && !item.contact.do_not_contact && item.stage !== stage) open(item, stage); }} className="min-w-0 rounded-xl bg-slate-100/70 dark:bg-slate-900/50 p-3 min-h-48"><h2 className="flex justify-between text-sm font-semibold mb-3 px-1">{PROSPECT_STAGES[stage]}<span className="text-slate-500">{group.length}</span></h2><div className="space-y-3">{group.map(item => <ProspectCard key={item.id} item={item} today={today} onOpen={() => open(item)} />)}{!group.length && <p className="text-xs text-slate-400 p-3">Bu aşamada kayıt yok.</p>}</div></section>;
        })}</div>
      </> : filtered.length ? <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">{filtered.map(item => <div key={item.id} className="min-w-0"><p className="text-xs text-slate-500 mb-1 pl-1">{PROSPECT_STAGES[item.stage]}</p><ProspectCard item={item} today={today} onOpen={() => open(item)} /></div>)}</div> : <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center"><Phone className="mx-auto mb-3 text-slate-400" size={28} /><p className="font-medium">{records.length === 0 ? 'İlk kayıtlarını ekleyerek başla' : 'Bu görünümde kayıt yok'}</p><p className="text-sm text-slate-500 mt-2">{records.length === 0 ? 'İçeri aktar düğmesiyle E-Tablodaki listenin önizlemesini açabilirsin.' : search ? 'Farklı bir isim, blok veya daireyle aramayı deneyebilirsin.' : 'Diğer görünümlerdeki kayıtları açarak sıradaki adımı planlayabilirsin.'}</p></div>}
      <p className="text-xs text-slate-500">{records.length} kayıt · {counts.blocked} arama dışı · Tarihler İstanbul saatine göre gösterilir.</p>
    </>}
    {(creating || activityId) && <ProspectStart repository={repository} records={records} activityId={activityId} onClose={() => { setCreating(false); onActivityDone?.(); }} onSaved={async id => {
      setCreating(false); onActivityDone?.();
      toast.success('Takip kartı hazır.');
      try { await reload(); setSelectedId(id); } catch { toast.error('Kayıt kaydedildi; listeyi yenileyin.'); }
    }} />}
    {selected && <ProspectConversation key={`${selected.id}:${selected.version}`} item={selected} proposedStage={proposedStage} repository={repository} onClose={() => { setSelectedId(null); setProposedStage(undefined); }} onSaved={onSaved} />}
  </div>;
};

const ClockIcon = ArrowRight;
export default function Prospecting() {
  const { session } = useData();
  const [params, setParams] = useSearchParams();
  return <ProspectingWorkspace key={session?.user.id} repository={prospectingRepository} activityId={params.get('activity') || undefined} onActivityDone={() => setParams({}, { replace: true })} />;
}
