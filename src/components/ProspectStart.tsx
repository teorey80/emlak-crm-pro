import SitePicker from './SitePicker';
import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { ProspectActivitySource, ProspectCase, ProspectStartInput } from '../types';
import type { ProspectingRepository } from '../services/prospectingService';
import { prospectingError } from '../services/prospectingService';
import { CLOSED_STAGES, fromIstanbulInput, normalizePhone, normalizeSearch, PROSPECT_STAGES, safeProspectUrl, toIstanbulInput } from '../utils/prospecting';

const field = 'w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-2.5 text-sm';
interface Props {
  preview?: boolean;
  repository: ProspectingRepository; records: ProspectCase[]; activityId?: string;
  onClose: () => void; onSaved: (id: string) => Promise<void>;
}
export default function ProspectStart({ repository, records, activityId, onClose, onSaved, preview = false }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const request = useRef(crypto.randomUUID());
  const processing = useRef(false);
  const [source, setSource] = useState<ProspectActivitySource>();
  const [loading, setLoading] = useState(!!activityId);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [due, setDue] = useState('');
  const [target, setTarget] = useState('');
  const [form, setForm] = useState<ProspectStartInput>({ request_id: request.current, source_kind: 'fsbo', name: '', phone: '', site_name: '', block: '', unit: '', source_url: '', channel: 'Sahibinden', transaction_type: 'Satılık', outcome: 'plan', note: '', stage: 'new', next_action: 'Mal sahibiyle görüş', next_action_at: null, closed_reason: '' });
  const change = <K extends keyof ProspectStartInput>(key: K, value: ProspectStartInput[K]) => setForm(prev => ({ ...prev, [key]: value }));
  useEffect(() => {
    dialog.current?.showModal();
    let cancelled = false;
    if (activityId) {
      if (!repository.activity) { setLoadError('Bu ortamda aktivite bağlantısı kullanılamıyor.'); setLoading(false); }
      else repository.activity(activityId).then(value => {
        if (cancelled) return;
        setSource(value);
        setForm(prev => ({ ...prev, name: value.customer.name, phone: value.customer.phone, site_name: value.activity.propertyTitle || '', stage: 'follow_up', note: 'Eski aramanın ardından takip planlandı.' }));
      }).catch(err => { if (!cancelled) setLoadError(prospectingError(err)); }).finally(() => { if (!cancelled) setLoading(false); });
    }
    return () => { cancelled = true; };
  }, [activityId, repository]);
  const phone = normalizePhone(form.phone);
  const samePerson = records.filter(r => phone ? normalizePhone(r.contact.phone) === phone : normalizeSearch(r.contact.name) === normalizeSearch(form.name));
  const candidates = samePerson.filter(r => !r.contact.do_not_contact);
  const blocked = samePerson.some(r => r.contact.do_not_contact);
  const selected = records.find(r => r.id === target);
  const effectiveStage = !activityId && form.outcome === 'no_answer' ? 'new' : form.outcome === 'do_not_contact' ? 'lost' : form.stage;
  const closed = CLOSED_STAGES.includes(effectiveStage);
  const selectTarget = (id: string) => {
    setTarget(id);
    const item = records.find(r => r.id === id);
    if (item) {
      setForm(prev => ({ ...prev, stage: item.stage === 'pool' ? 'follow_up' : item.stage, next_action: item.next_action || 'Mal sahibiyle tekrar görüş', closed_reason: item.closed_reason }));
      setDue(item.next_action_at ? toIstanbulInput(item.next_action_at) : '');
    }
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (processing.current || !repository.start) return;
    setError('');
    if (!target && normalizePhone(form.phone).length !== 10) { setError('Telefonu alan koduyla birlikte 10 hane olarak girin.'); return; }
    if (blocked) { setError('Bu kişi tekrar aranmak istemiyor; takip açılamaz.'); return; }
    if (!target && form.source_url && !safeProspectUrl(form.source_url)) { setError('Geçerli bir http veya https ilan bağlantısı girin.'); return; }
    let date: string | null = null;
    try { date = closed ? null : fromIstanbulInput(due); } catch { setError('Geçerli bir takip tarihi seçin.'); return; }
    if (!closed && (!date || Date.parse(date) <= Date.now())) { setError('Açık takip için gelecekte bir tarih ve saat seçin.'); return; }
    processing.current = true; setBusy(true);
    try {
      const id = await repository.start({ ...form, request_id: request.current, activity_id: activityId, case_id: target || undefined, expected_version: selected?.version, next_action_at: date, stage: effectiveStage, outcome: activityId ? 'plan' : form.outcome });
      await onSaved(id);
    } catch (err) { setError(prospectingError(err)); }
    finally { processing.current = false; setBusy(false); }
  };
  return <dialog ref={dialog} onCancel={event => { if (busy) event.preventDefault(); else onClose(); }} aria-labelledby="prospect-start-title" className="w-[min(720px,calc(100vw-2rem))] max-h-[90vh] rounded-2xl p-0 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 backdrop:bg-black/50">
    <div className="p-5 border-b dark:border-slate-700 flex justify-between gap-3"><h2 id="prospect-start-title" className="text-xl font-semibold">{activityId ? 'Aramayı portföy takibine al' : 'Yeni FSBO / takip kaydı'}</h2><button onClick={onClose} disabled={busy} aria-label="Yeni kayıt panelini kapat"><X size={20} /></button></div>
    <div className="p-5">
      {loading ? <p role="status">Arama kaydı yükleniyor…</p> : loadError ? <p role="alert">{loadError}</p> : source?.linkedCaseId ? <div className="space-y-4"><p>Bu aktivite zaten bir takip kartına bağlı. Yeni kopya oluşturulmayacak.</p><button className="rounded-lg bg-sky-600 text-white px-4 py-2" onClick={() => void onSaved(source.linkedCaseId!)}>Takip kartını aç</button></div> : <form onSubmit={event => void submit(event)} className="space-y-4">
        {source && <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 text-sm"><p className="font-medium">{source.activity.date} · {source.activity.type} · {source.activity.status}</p><p className="mt-2 whitespace-pre-wrap">{source.activity.description || 'Açıklama yok.'}</p><p className="mt-2 text-xs text-slate-500">Eski aktivite korunur. Bu işlem yeni görüşme sayılmaz; sonraki aramanı planlar.</p></div>}
        <fieldset disabled={busy} className="space-y-4 disabled:opacity-60">
          <div className="grid sm:grid-cols-2 gap-3"><label className="text-sm">Ad soyad<input required readOnly={!!activityId} className={field} value={form.name} onChange={e => change('name',e.target.value)} /></label><label className="text-sm">Telefon<input required type="tel" readOnly={!!activityId} className={field} value={form.phone} onChange={e => change('phone',e.target.value)} /></label></div>
          {blocked && <p role="alert" className="text-amber-700">Bu telefon arama dışında. Yeni takip açılamaz.</p>}
          {samePerson.length > 0 && !blocked && <p className="text-sm text-amber-700">Bu kişiye ait {samePerson.length} takip kartı var. Farklı bir taşınmazsa yeni kart açabilirsin.</p>}
          {activityId && candidates.length > 0 && <label className="block text-sm">Bağlanacak takip kartı<select className={field} value={target} onChange={e => selectTarget(e.target.value)}><option value="">Yeni taşınmaz için kart oluştur</option>{candidates.map(r => <option key={r.id} value={r.id}>{r.site_name} {r.block} {r.unit} · {PROSPECT_STAGES[r.stage]}</option>)}</select></label>}
          {!target && <>
            <div className="grid sm:grid-cols-2 gap-3"><label className="text-sm">Kayıt kaynağı<select className={field} value={form.source_kind} onChange={e => change('source_kind', e.target.value as ProspectStartInput['source_kind'])}><option value="fsbo">FSBO — sahibinden satış / kiralama</option><option value="manual">Manuel / diğer</option></select></label><label className="text-sm">Kanal<input className={field} value={form.channel} onChange={e => change('channel',e.target.value)} placeholder="Sahibinden, referans, sokak ilanı…" /></label></div>
            <label className="block text-sm">İlan bağlantısı (isteğe bağlı)<input type="url" className={field} value={form.source_url} onChange={e => change('source_url',e.target.value)} placeholder="https://…" /></label>
            {!preview && <SitePicker value={form.site_id} legacyName={form.site_name} onChange={(site_id,name)=>setForm(prev=>({...prev,site_id,site_name:name || prev.site_name}))}/>}
            <label className="block text-sm">Oda sayısı<input className={field} value={form.rooms || ''} onChange={e=>change('rooms',e.target.value.replace(/\s/g,''))} placeholder="Örn. 3+1" /></label>
            <label className="block text-sm">Konum / taşınmaz açıklaması<input required className={field} value={form.site_name} onChange={e => change('site_name',e.target.value)} placeholder="Çekmeköy, Merkez Mahallesi 2+1 daire" /></label>
            <div className="grid grid-cols-3 gap-3"><label className="text-sm">Blok<input className={field} value={form.block} onChange={e => change('block',e.target.value)} /></label><label className="text-sm">Daire<input className={field} value={form.unit} onChange={e => change('unit',e.target.value)} /></label><label className="text-sm">İşlem<select className={field} value={form.transaction_type} onChange={e => change('transaction_type',e.target.value)}><option>Satılık</option><option>Kiralık</option><option>Belirsiz</option></select></label></div>
          </>}
          {!activityId && <label className="block text-sm">Görüşme sonucu<select className={field} value={form.outcome} onChange={e => change('outcome', e.target.value as ProspectStartInput['outcome'])}><option value="plan">Henüz görüşmedim / sadece planla</option><option value="reached">Görüştüm</option><option value="no_answer">Aradım, ulaşamadım</option><option value="do_not_contact">Tekrar aranmak istemiyor</option></select></label>}
          <label className="block text-sm">{activityId ? 'Yeni takip notu' : 'Görüşme / plan notu'}<textarea required rows={3} className={field} value={form.note} onChange={e => change('note',e.target.value)} placeholder="Bir süre kendisi satmayı deneyecek; sonra yeniden görüşülecek." /></label>
          <label className="block text-sm">Süreç aşaması<select className={field} disabled={!activityId && ['do_not_contact','no_answer'].includes(form.outcome)} value={effectiveStage} onChange={e => change('stage',e.target.value as ProspectStartInput['stage'])}>{Object.entries(PROSPECT_STAGES).filter(([key]) => key !== 'pool').map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          {closed ? <label className="block text-sm">Kapanış nedeni<input required className={field} value={form.closed_reason} onChange={e => change('closed_reason',e.target.value)} /></label> : <div className="grid sm:grid-cols-2 gap-3"><label className="text-sm">Sonraki adım<input required className={field} value={form.next_action} onChange={e => change('next_action',e.target.value)} /></label><label className="text-sm">Takip tarihi ve saati (İstanbul)<input required type="datetime-local" className={field} value={due} onChange={e => setDue(e.target.value)} /></label></div>}
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button disabled={blocked || !repository.start} type="submit" className="rounded-lg bg-sky-600 text-white px-4 py-2.5 disabled:opacity-50">{busy ? 'Kaydediliyor…' : 'Kaydet ve takip kartını aç'}</button>
        </fieldset>
      </form>}
    </div>
  </dialog>;
}
