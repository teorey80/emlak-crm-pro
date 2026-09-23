import ProspectDetails from './ProspectDetails';
import EntityTags from './EntityTags';
import React, { useEffect, useRef, useState } from 'react';
import { Clock, Phone, X } from 'lucide-react';
import type { ProspectCase, ProspectEvent, ProspectEventInput, ProspectOutcome, ProspectStage } from '../types';
import type { ProspectingRepository } from '../services/prospectingService';
import { prospectingError } from '../services/prospectingService';
import { CLOSED_STAGES, formatProspectDate, fromIstanbulInput, normalizePhone, PROSPECT_STAGES, toIstanbulInput, safeProspectUrl, prospectSourceKind, prospectLocation } from '../utils/prospecting';
import ProspectProvenance from './ProspectProvenance';

interface Props {
  item: ProspectCase;
  proposedStage?: ProspectStage;
  metadataEnabled?: boolean;
  onMetadataSaved?: () => Promise<void>;
  repository: ProspectingRepository;
  onClose: () => void;
  onSaved: (next: boolean) => Promise<void>;
}

const field = 'w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-2.5 text-sm text-slate-900 dark:text-white disabled:opacity-60';

const ProspectConversation: React.FC<Props> = ({ item, proposedStage, repository, onClose, onSaved, onMetadataSaved, metadataEnabled = true }: Props) => {
  const dialog = useRef<HTMLDialogElement>(null);
  const requestId = useRef(crypto.randomUUID());
  const [history, setHistory] = useState<ProspectEvent[]>([]);
  const [historyError, setHistoryError] = useState('');
  const [historyLoading, setHistoryLoading] = useState(true);
  const [note, setNote] = useState('');
  const [outcome, setOutcome] = useState<ProspectOutcome>(proposedStage ? 'plan' : 'reached');
  const [stage, setStage] = useState<ProspectStage>(proposedStage || (item.stage === 'pool' ? 'new' : item.stage));
  const [due, setDue] = useState(item.next_action_at ? toIstanbulInput(item.next_action_at) : '');
  const [action, setAction] = useState(item.next_action || '');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [blockedConfirmed, setBlockedConfirmed] = useState(false);
  const closed = CLOSED_STAGES.includes(stage) || outcome === 'do_not_contact';
  const phone = normalizePhone(item.contact.phone);
  const safeSource = safeProspectUrl(item.source_url);

  useEffect(() => {
    dialog.current?.showModal();
    let cancelled = false;
    repository.history(item.id).then(events => { if (!cancelled) setHistory(events); })
      .catch(err => { if (!cancelled) setHistoryError(prospectingError(err)); })
      .finally(() => { if (!cancelled) setHistoryLoading(false); });
    return () => { cancelled = true; };
  }, [item.id, item.version, repository]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || item.contact.do_not_contact) return;
    const next = (event.nativeEvent as SubmitEvent).submitter?.getAttribute('data-next') === 'true';
    const nextDate = closed ? null : fromIstanbulInput(due);
    if (!closed && (!nextDate || Date.parse(nextDate) <= Date.now())) { setError('Gelecekte bir takip tarihi seçin.'); return; }
    if (outcome === 'do_not_contact' && !blockedConfirmed) { setError('İletişim tercihini onaylayın.'); return; }
    const input: ProspectEventInput = {
      request_id: requestId.current, case_id: item.id, expected_version: item.version,
      occurred_at: new Date().toISOString(), outcome, note: note.trim(), stage,
      next_action: closed ? '' : action.trim(), next_action_at: nextDate, closed_reason: reason.trim(),
    };
    setBusy(true); setError('');
    try { await repository.record(input); await onSaved(next); }
    catch (err) { setError(prospectingError(err)); }
    finally { setBusy(false); }
  };

  return <dialog ref={dialog} aria-labelledby="prospect-dialog-title" onCancel={e => { e.preventDefault(); if (!busy) onClose(); }} className="w-[min(960px,96vw)] max-h-[92dvh] m-auto p-0 rounded-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-2xl backdrop:bg-slate-950/50">
    <header className="sticky top-0 z-10 flex justify-between items-start gap-4 p-5 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <div><p className="text-xs text-sky-600 dark:text-sky-400 mb-1">{PROSPECT_STAGES[item.stage]}</p><h2 id="prospect-dialog-title" className="text-xl font-semibold">{item.contact.name}</h2><p className="text-sm text-slate-500 mt-1">{prospectLocation(item)}</p></div>
      <button type="button" onClick={onClose} disabled={busy} aria-label="Görüşme panelini kapat" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"><X size={20} /></button>
    </header>
    <div className="grid md:grid-cols-2 gap-6 p-5">
      <section aria-label="Kişi ve görüşme geçmişi" className="min-w-0 space-y-4">
        <EntityTags type="prospect" id={item.id} editable/>
        {metadataEnabled && <ProspectDetails item={item} onSaved={onMetadataSaved}/>}
        <ProspectProvenance item={item} detailed />
        <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
          <span className="text-sm">{item.contact.phone || 'Telefon eklenmemiş'}</span>
          {phone.length === 10 && !item.contact.do_not_contact && <a href={`tel:+90${phone}`} className="flex items-center gap-1.5 text-sky-700 dark:text-sky-300 text-sm font-medium"><Phone size={15} /> Ara</a>}
        </div>
        {item.contact.do_not_contact && <p className="rounded-lg bg-amber-50 dark:bg-amber-950 p-3 text-sm text-amber-800 dark:text-amber-200">Bu kişi aranmak istemiyor. Görüşme geçmişi korunuyor; yeni arama veya takip oluşturulamaz.</p>}
        {item.data_warning && <p className="text-sm rounded-lg bg-amber-50 dark:bg-amber-950 p-3 text-amber-800 dark:text-amber-200">{item.data_warning}</p>}
        <h3 className="font-semibold flex items-center gap-2"><Clock size={16} /> Görüşme geçmişi</h3>
        {historyLoading ? <p className="text-sm text-slate-500">Geçmiş yükleniyor…</p> : historyError ? <p role="alert" className="text-sm text-red-600">{historyError}</p> : history.length === 0 ? <p className="text-sm text-slate-500">Henüz görüşme kaydı yok.</p> : <ol className="space-y-4">
          {history.map(entry => <li key={entry.id} className="border-l-2 border-sky-200 dark:border-sky-800 pl-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">{entry.occurred_at ? entry.date_precision === 'day' ? new Date(entry.occurred_at).toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' }) : formatProspectDate(entry.occurred_at) : 'Tarihi belirtilmemiş'} · {entry.outcome === 'plan' ? 'Takip planı' : entry.outcome === 'import' ? 'Önceki kaynak kaydı' : entry.outcome === 'no_answer' ? 'Ulaşılamadı' : entry.outcome === 'do_not_contact' ? 'İletişim tercihi' : 'Görüşme'}</p>
            <p className="text-sm whitespace-pre-wrap break-words mt-1">{entry.note}</p>
            {['reached','no_answer','do_not_contact'].includes(entry.outcome) && <EntityTags type="activity" id={`PROSPECT-${entry.id}`}/>}
            <p className="text-xs text-sky-700 dark:text-sky-300 mt-1">{PROSPECT_STAGES[entry.stage]}{entry.next_action_at ? ` · ${formatProspectDate(entry.next_action_at)} — ${entry.next_action}` : ''}</p>
          </li>)}
        </ol>}
        {(item.source_note || Object.values(item.source_metadata).some(Boolean)) && <details className="text-sm border-t border-slate-200 dark:border-slate-700 pt-3"><summary className="cursor-pointer font-medium">Kaynak notları ve daire bilgileri</summary>
          <p className="mt-3 whitespace-pre-wrap break-words">{item.source_note}</p>
          <dl className="mt-3 space-y-2">{Object.entries(item.source_metadata).filter(([, value]) => value).map(([key, value]) => <div key={key}><dt className="text-xs text-slate-500">{key}</dt><dd className="break-words whitespace-pre-wrap">{value}</dd></div>)}</dl>
          {safeSource && <a href={item.source_url} target="_blank" rel="noreferrer" className="inline-block mt-3 text-sky-600 underline">{prospectSourceKind(item) === 'list' ? 'E-Tablodaki kaynak kayıt' : 'İlan bağlantısını aç'}</a>}
        </details>}
      </section>
      <form onSubmit={submit} className="min-w-0 space-y-4" onChange={() => { requestId.current = crypto.randomUUID(); }}>
        <h3 className="font-semibold">Görüşme ve sonraki adım</h3>
        <fieldset disabled={busy || item.contact.do_not_contact} className="space-y-4 disabled:opacity-60">
          <label className="block text-sm">Sonuç<select className={`${field} mt-1`} value={outcome} onChange={e => { const value = e.target.value as ProspectOutcome; setOutcome(value); if (value === 'no_answer') setStage(item.stage); else if (stage === 'pool') setStage('new'); }}>
            <option value="reached">Görüştüm</option><option value="no_answer">Ulaşamadım</option><option value="plan">Sadece takip planla</option><option value="do_not_contact">Tekrar aranmak istemiyor</option>
          </select></label>
          <label className="block text-sm">{outcome === 'plan' ? 'Planlama notu' : 'Görüşme notu'}<textarea autoFocus required maxLength={20000} rows={4} value={note} onChange={e => setNote(e.target.value)} placeholder="Ne konuşuldu? Beklentisi ve sonraki adım ne?" className={`${field} mt-1 resize-y`} /></label>
          {outcome !== 'do_not_contact' && <label className="block text-sm">Süreç aşaması<select disabled={outcome === 'no_answer'} className={`${field} mt-1`} value={stage} onChange={e => setStage(e.target.value as ProspectStage)}>
            {Object.entries(PROSPECT_STAGES).filter(([key]) => key !== 'pool' || stage === 'pool').map(([key, label]) => <option value={key} key={key}>{label}</option>)}
          </select></label>}
          {outcome === 'no_answer' && <p className="text-xs text-slate-500">Ulaşılamaması süreç aşamasını değiştirmez.</p>}
          {closed ? <label className="block text-sm">{outcome === 'do_not_contact' ? 'İletişim tercihi notu' : 'Kapanış nedeni'}<input required maxLength={2000} className={`${field} mt-1`} value={reason} onChange={e => setReason(e.target.value)} placeholder={stage === 'won' ? 'Örn. Yetkilendirme alındı' : 'Örn. Başka danışmanla anlaştı'} /></label> : <>
            <label className="block text-sm">Sonraki adım<input required maxLength={2000} value={action} onChange={e => setAction(e.target.value)} className={`${field} mt-1`} placeholder="Örn. Satış kararını tekrar sor" /></label>
            <label className="block text-sm">Takip tarihi ve saati <span className="text-slate-500">(İstanbul)</span><input type="datetime-local" required value={due} onChange={e => setDue(e.target.value)} className={`${field} mt-1`} /></label>
          </>}
          {outcome === 'do_not_contact' && <label className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-200"><input type="checkbox" required checked={blockedConfirmed} onChange={e => setBlockedConfirmed(e.target.checked)} className="mt-1" />Bu kişi ve aynı telefonun kullanıldığı diğer kayıtlar arama listesinden çıkarılsın.</label>}
          {stage === 'won' && <p className="text-xs text-slate-500">Bu işlem takip sürecini tamamlar. İlan veya satış kaydı oluşturmaz.</p>}
          {error && <p role="alert" className="rounded-lg bg-red-50 dark:bg-red-950 p-3 text-sm text-red-700 dark:text-red-200">{error}</p>}
          <div className="flex flex-wrap gap-2 pt-2">
            <button type="submit" className="rounded-lg bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 text-sm font-medium">{busy ? 'Kaydediliyor…' : 'Kaydet'}</button>
            <button type="submit" data-next="true" className="rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm">Kaydet ve sıradakine geç</button>
          </div>
        </fieldset>
      </form>
    </div>
  </dialog>;
};

export default ProspectConversation;
