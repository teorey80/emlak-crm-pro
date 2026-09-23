import React, { useId, useState } from 'react';
import { useData } from '../context/DataContext';
import type { Site } from '../types';
export default function SitePicker({ value, legacyName='', onChange }: {value?: string | null; legacyName?: string; onChange: (id: string | null,name: string)=>void}) {
 const { sites,addSite }=useData();const inputId=useId();const [query,setQuery]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 const [adding,setAdding]=useState(false);
 const create=async()=>{setBusy(true);setError('');try{
  const name=query.trim().replace(/\s+/g,' ');if(!name)return;
  const exists=sites.find(s=>s.name.trim().toLocaleLowerCase('tr')===name.toLocaleLowerCase('tr'));
  if(exists){onChange(exists.id,exists.name);setAdding(false);return;}
  const site: Site={id:crypto.randomUUID(),name,region:'',address:'',status:'Aktif',createdAt:new Date().toISOString().slice(0,10)};
  await addSite(site);onChange(site.id,site.name);setQuery('');setAdding(false);
 }catch{setError('Site eklenemedi. Bağlantınızı ve site ekleme yetkinizi kontrol edin.');}finally{setBusy(false);}};
 return <div className="space-y-2"><label htmlFor={inputId} className="block text-sm font-medium">Site / proje</label><select id={inputId} value={value || ''} onChange={e=>{const site=sites.find(s=>s.id===e.target.value);onChange(site?.id || null,site?.name || '');}} className="w-full border rounded-lg p-2.5 bg-white dark:bg-slate-800 dark:border-slate-600"><option value="">Site seçilmedi</option>{sites.map(site=><option key={site.id} value={site.id}>{site.name}{site.region?` · ${site.region}`:''}</option>)}</select>
 {!value && legacyName && <p className="text-xs text-amber-700 dark:text-amber-300">Eski kayıt: {legacyName}. Ortak siteyi seçerek bağlayabilirsin.</p>}
 <button type="button" onClick={()=>setAdding(!adding)} className="text-xs text-sky-700 dark:text-sky-300 underline">{adding?'Vazgeç':'Listede yoksa site ekle'}</button>{adding && <div className="flex gap-2"><input onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();if(!busy && query.trim())void create();}}} aria-label="Yeni site adı" maxLength={120} placeholder="Örn. Nef Çamlıtepe" value={query} onChange={e=>setQuery(e.target.value)} className="min-w-0 flex-1 border rounded-lg p-2 dark:bg-slate-800 dark:border-slate-600"/><button type="button" disabled={busy || !query.trim()} onClick={()=>void create()} className="px-3 rounded-lg bg-sky-600 text-white disabled:opacity-50">Ekle</button></div>}{error && <p role="alert" className="text-xs text-red-600">{error}</p>}</div>;
}
