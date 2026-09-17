import React, { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import type { ProspectImportBatch } from '../types';
import type { ProspectingRepository } from '../services/prospectingService';
import { prospectingError } from '../services/prospectingService';
import { normalizePhone, parseProspectImport, PROSPECT_STAGES } from '../utils/prospecting';

interface Props { repository: ProspectingRepository; existingKeys: Set<string>; onDone: () => Promise<void>; onClose: () => void; }
export default function ProspectImport({ repository, existingKeys, onDone, onClose }: Props) {
  const [batch, setBatch] = useState<ProspectImportBatch | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const processing = useRef(false);
  const read = async (file?: File) => {
    if (!file) return;
    setError(''); setResult(''); setBatch(null);
    try {
      if (file.size > 5000000) throw new Error('Dosya 5 MB’tan küçük olmalı.');
      const parsed = parseProspectImport(await file.text());
      setBatch(parsed); setSelected(new Set());
    } catch (err) { setError(prospectingError(err)); }
  };
  const choosePilot = () => {
    if (!batch) return;
    const stages = ['meeting', 'follow_up', 'other_agent', 'new'];
    const blockedPhones = new Set(batch.rows.filter(r => r.do_not_contact && r.phone).map(r => normalizePhone(r.phone)));
    const candidates = batch.rows.filter(r => !existingKeys.has(r.source_key) && !r.do_not_contact && !blockedPhones.has(normalizePhone(r.phone)) && !r.data_warning && r.phone && stages.includes(r.stage));
    candidates.sort((a, b) => stages.indexOf(a.stage) - stages.indexOf(b.stage));
    setSelected(new Set(candidates.slice(0, 30).map(r => r.source_key)));
  };
  const submit = async () => {
    if (!batch || !selected.size || processing.current) return;
    processing.current = true; setBusy(true); setError('');
    try {
      // Include all opt-outs even in a pilot, so a matching selected phone cannot be contacted.
      const blockedPhones = new Set(batch.rows.filter(r => r.do_not_contact && r.phone).map(r => normalizePhone(r.phone)));
      const chosen = batch.rows.filter(r => selected.has(r.source_key)).map(r => ({ ...r, do_not_contact: r.do_not_contact || (r.phone.length > 0 && blockedPhones.has(normalizePhone(r.phone))) }));
      const answer = await repository.importRows(chosen);
      setResult(`${answer.added} kayıt aktarıldı; daha önce alınmış ${answer.skipped} kayıt korundu.`);
      setSelected(new Set()); await onDone();
    } catch (err) { setError(prospectingError(err)); }
    finally { setBusy(false); processing.current = false; }
  };
  return <section aria-label="Kayıt aktarımı" className="p-5 rounded-xl border border-sky-200 dark:border-sky-800 bg-white dark:bg-slate-800 space-y-4">
    <div className="flex justify-between gap-4"><div><h3 className="font-semibold text-slate-900 dark:text-white">E-Tablodan kayıt al</h3><p className="text-sm text-slate-500 mt-1">Hazırlanmış aktarım dosyası (.json) veya CRM_Kayitlar sayfasının CSV dosyası. Kaynak tablo değişmez.</p></div><button disabled={busy} onClick={onClose} aria-label="Aktarımı kapat" className="p-2 self-start"><X size={18} /></button></div>
    <label className="block text-sm text-slate-700 dark:text-slate-200">Aktarım dosyası<input type="file" accept=".json,.csv,.tsv" disabled={busy} onChange={e => void read(e.target.files?.[0])} className="block w-full mt-2 text-sm" /></label>
    {batch && <>
      <p className="text-sm text-slate-600 dark:text-slate-300">{batch.rows.length} kayıt · {batch.rows.filter(r => r.do_not_contact).length} arama dışı · {batch.rows.filter(r => r.data_warning).length} kontrol gerektiren · {batch.rows.filter(r => existingKeys.has(r.source_key)).length} daha önce aktarılmış</p>
      <div className="flex flex-wrap gap-2 text-sm"><button disabled={busy} onClick={choosePilot} className="px-3 py-2 border rounded-lg dark:border-slate-600">İlk deneme için en fazla 30 kayıt seç</button><button disabled={busy} onClick={() => setSelected(new Set(batch.rows.filter(r => !existingKeys.has(r.source_key)).map(r => r.source_key)))} className="px-3 py-2 border rounded-lg dark:border-slate-600">Tüm yeni kayıtları seç</button><button disabled={busy} onClick={() => setSelected(new Set())} className="px-3 py-2">Seçimi temizle</button></div>
      <div className="max-h-72 overflow-auto border rounded-lg dark:border-slate-700"><table className="w-full text-sm text-left"><thead className="sticky top-0 bg-slate-50 dark:bg-slate-900"><tr><th className="p-3">Seç</th><th className="p-3">Malik / daire</th><th className="p-3">Aşama / kontrol</th></tr></thead><tbody>
        {batch.rows.map(r => <tr key={r.source_key} className="border-t dark:border-slate-700"><td className="p-3"><input type="checkbox" aria-label={`${r.name}, ${r.block}-${r.unit} kaydını seç`} disabled={busy || existingKeys.has(r.source_key)} checked={selected.has(r.source_key)} onChange={e => setSelected(previous => { const next = new Set(previous); if (e.target.checked) next.add(r.source_key); else next.delete(r.source_key); return next; })} /></td><td className="p-3"><span className="block font-medium">{r.name}</span><span className="text-slate-500">{r.block}-{r.unit}</span></td><td className="p-3">{PROSPECT_STAGES[r.stage]}{r.do_not_contact && <span className="block text-amber-700 dark:text-amber-300">Aranmasın</span>}{r.data_warning && <span className="block text-xs text-amber-700 dark:text-amber-300">{r.data_warning}</span>}{existingKeys.has(r.source_key) && <span className="block text-xs text-slate-500">Zaten aktarılmış</span>}</td></tr>)}
      </tbody></table></div>
      <button disabled={busy || !selected.size} onClick={() => void submit()} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-sky-600 text-white text-sm disabled:opacity-50"><Upload size={16} />{busy ? 'Aktarılıyor…' : `Seçili ${selected.size} kaydı aktar`}</button>
    </>}
    {error && <p role="alert" className="text-sm text-red-600 dark:text-red-300">{error}</p>}
    {result && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">{result}</p>}
  </section>;
}
