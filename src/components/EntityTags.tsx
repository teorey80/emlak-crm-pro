import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEntityTagCache } from '../context/TagContext';
import { addCustomTag, removeCustomTag } from '../services/tagService';
import { TAG_COLORS, TAG_GROUPS, tagSearchUrl, uniqueTags, type CrmTag, type TagEntity } from '../utils/tags';
export function TagChips({ tags, kind = 'customer', selected = [] }: { tags: CrmTag[]; kind?: TagEntity; selected?: string[] }) {
 return <span className="flex flex-wrap gap-1.5">{uniqueTags(tags).map(tag => <Link key={tag.key} to={tagSearchUrl([...selected, tag.key], kind)} onClick={e => e.stopPropagation()} title={`${TAG_GROUPS[tag.group] || 'Etiket'}: ${tag.label} — ilgili kayıtları bul`} className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium hover:ring-2 hover:ring-sky-400 focus-visible:ring-2 focus-visible:ring-sky-500 ${TAG_COLORS[tag.group] || TAG_COLORS.custom}`}>{tag.label}</Link>)}</span>;
}
export default function EntityTags({ type, id, detailed = false, editable = false }: { type: TagEntity; id: string; detailed?: boolean; editable?: boolean }) {
 const cache = useEntityTagCache();
 const [expanded, setExpanded] = useState(false);
 const [editing, setEditing] = useState(false);
 const [name, setName] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
 useEffect(() => cache?.load(type,id), [cache?.load,type,id]);
 if (!cache) return null;
 const rows = cache.rows[`${type}:${id}`];
 const tags = uniqueTags((rows || []).flatMap(row => row.tags));
 const act = async (action: () => Promise<void>) => { setBusy(true); setError(''); try { await action(); setName(''); } catch { setError('Etiket kaydedilemedi. Bu kaydı düzenleme yetkinizi ve bağlantınızı kontrol edin.'); } finally { setBusy(false); } };
 return <div className="mt-2 space-y-2" onClick={e => e.stopPropagation()}>
  {cache.error && !rows ? <button type="button" onClick={cache.refresh} className="text-xs text-amber-700 dark:text-amber-300">{cache.error} Yeniden dene</button> : detailed ? (expanded ? rows : rows?.slice(0,6))?.map((row,i) => <div key={i} className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 space-y-1.5"><p className="text-xs text-slate-500">{row.context_label}{row.subtitle ? ` · ${row.subtitle}` : ''}</p><TagChips tags={row.tags} kind={type}/><div className="flex flex-wrap gap-3">{row.links.map((link,j) => <Link key={j} to={link.href} className="text-xs text-sky-700 dark:text-sky-300 underline">{link.label}</Link>)}</div></div>) : <><TagChips tags={expanded ? tags : tags.slice(0,6)} kind={type}/>{tags.length>6 && <button type="button" onClick={() => setExpanded(!expanded)} className="text-xs text-sky-700 dark:text-sky-300">{expanded ? 'Daha az göster' : `+${tags.length-6} etiket`}</button>}</>}
  {detailed && (rows?.length || 0)>6 && <button type="button" onClick={()=>setExpanded(!expanded)} className="text-xs underline">{expanded?'Daha az göster':`Tüm bağlantıları göster (${rows?.length})`}</button>}
  {editable && <button type="button" onClick={()=>setEditing(!editing)} aria-expanded={editing} className="text-xs text-sky-700 dark:text-sky-300 underline">{editing?'Etiket düzenlemeyi kapat':'Özel etiketleri düzenle'}</button>}
  {editable && editing && <div className="space-y-2"><div className="flex gap-2"><input onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();if(!busy && name.trim())void act(()=>addCustomTag(type,id,name));}}} aria-label="Özel etiket" maxLength={60} value={name} onChange={e=>setName(e.target.value)} placeholder="Özel etiket ekle…" className="min-w-0 flex-1 border rounded-lg p-2 text-sm bg-white dark:bg-slate-800 dark:border-slate-600"/><button type="button" disabled={busy || !name.trim()} onClick={()=>void act(()=>addCustomTag(type,id,name))} className="text-sm rounded-lg px-3 bg-sky-600 text-white disabled:opacity-50">Ekle</button></div><div className="flex flex-wrap gap-2">{uniqueTags((rows || []).flatMap(row=>row.own_custom_tags || [])).map(t=><button type="button" key={t.key} disabled={busy} onClick={()=>void act(()=>removeCustomTag(type,id,t.key))} className="text-xs text-pink-700 dark:text-pink-300" aria-label={`${t.label} etiketini bu kayıttan kaldır`}>{t.label} ×</button>)}</div>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}</div>}
 </div>;
}
