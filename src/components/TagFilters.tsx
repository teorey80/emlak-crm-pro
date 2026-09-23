import React, { useState } from 'react';
import { TAG_COLORS, TAG_GROUPS, type CrmTag } from '../utils/tags';
export default function TagFilters({ facets, selected, onChange }: { facets: CrmTag[]; selected: string[]; onChange: (keys: string[]) => void }) {
 const [filter,setFilter] = useState('');
 const [open,setOpen] = useState(true);
 return <section aria-label="Etiket filtreleri" className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800 space-y-3">
  <div className="flex flex-wrap items-center gap-2"><strong className="text-sm">Seçilen etiketler</strong>{selected.map(key => { const tag=facets.find(t=>t.key===key); return <button type="button" key={key} onClick={()=>onChange(selected.filter(k=>k!==key))} className={`rounded-full px-3 py-1 text-xs ${TAG_COLORS[tag?.group || 'custom']}`} aria-label={`${tag?.label || key} filtresini kaldır`}>{tag?.label || key} ×</button>; })}{selected.length>0 && <button type="button" className="text-sm underline" onClick={()=>onChange([])}>Temizle</button>}</div>
  <button type="button" onClick={()=>setOpen(!open)} aria-expanded={open} className="text-sm text-sky-700 dark:text-sky-300 underline">{open?'Etiket seçeneklerini gizle':'Etiket seç / filtreyi daralt'}</button>
  {open && <>
  <p className="text-xs text-slate-500 dark:text-slate-400">Örneğin: Yer gösterimi yapıldı + Nef Çamlıtepe + 3+1. Birden fazla oda veya site seçersen seçeneklerden birine uyanlar bulunur. Özel etiketlerin ise tamamı aranır.</p>
  <input aria-label="Etiket bul" placeholder="Etiket bul: site, oda, görüşme…" value={filter} onChange={e=>setFilter(e.target.value)} className="w-full rounded-lg border p-2 text-sm dark:bg-slate-900 dark:border-slate-700"/>
  <div className="max-h-72 overflow-auto space-y-3">{Object.entries(TAG_GROUPS).map(([group,label])=>{
   const options=facets.filter(t=>t.group===group && t.label?.toLocaleLowerCase('tr').includes(filter.toLocaleLowerCase('tr')));
   return options.length ? <fieldset key={group}><legend className="text-xs font-semibold mb-1">{label}</legend><div className="flex flex-wrap gap-1.5">{options.map(tag=><button type="button" key={tag.key} aria-pressed={selected.includes(tag.key)} onClick={()=>onChange(selected.includes(tag.key)?selected.filter(k=>k!==tag.key):[...selected,tag.key])} className={`rounded-full px-2.5 py-1 text-xs ${TAG_COLORS[group]} ${selected.includes(tag.key)?'ring-2 ring-sky-600 ring-offset-1':''}`}>{tag.label} <span title="Bu etikete sahip toplam kayıt sayısı" className="opacity-70">{tag.count}</span></button>)}</div></fieldset> : null;
  })}</div></>}
 </section>;
}
