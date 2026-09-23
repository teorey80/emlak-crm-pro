import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { searchTags, tagError } from '../services/tagService';
import { TagChips } from '../components/EntityTags';
import TagFilters from '../components/TagFilters';
import { ENTITY_LABELS, type TagEntity, type TagSearchResult } from '../utils/tags';
export default function TagSearch({ repository = searchTags }: { repository?: typeof searchTags }) {
 const [params,setParams]=useSearchParams();
 const kind=(Object.keys(ENTITY_LABELS).includes(params.get('kind') || '')?params.get('kind'):'customer') as TagEntity;
 const selected=params.getAll('tag'); const search=params.get('q') || ''; const signature=JSON.stringify([kind,selected,search]);
 const [result,setResult]=useState<TagSearchResult>({rows:[],counts:{},facets:[]});
 const [error,setError]=useState('');const [loading,setLoading]=useState(true);const [more,setMore]=useState(false);const [refresh,setRefresh]=useState(0);
 const sequence=useRef(0); const moreLock=useRef(false);
 const change=(field: string,value: string | string[])=>{const next=new URLSearchParams(params);next.delete(field);(Array.isArray(value)?value:[value]).filter(Boolean).forEach(v=>next.append(field,v));setParams(next);};
 useEffect(()=>{const seq=++sequence.current;setLoading(true);setError('');setResult(prev=>({...prev,rows:[],counts:{}}));const timer=setTimeout(()=>{
  repository(selected,kind,search).then(data=>{if(seq===sequence.current)setResult(data);}).catch(err=>{if(seq===sequence.current)setError(tagError(err));}).finally(()=>{if(seq===sequence.current)setLoading(false);});
 },200);return()=>{clearTimeout(timer);sequence.current++;};},[signature,refresh,repository]);
 useEffect(()=>{const update=()=>setRefresh(v=>v+1);window.addEventListener('crm-tags-changed',update);return()=>window.removeEventListener('crm-tags-changed',update);},[]);
 const loadMore=async()=>{if(moreLock.current)return;moreLock.current=true;setMore(true);const seq=sequence.current;try{const data=await repository(selected,kind,search,result.rows.length);if(seq===sequence.current)setResult(prev=>({...data,rows:[...prev.rows,...data.rows]}));}catch(err){if(seq===sequence.current)setError(tagError(err));}finally{moreLock.current=false;setMore(false);}};
 return <div className="space-y-5 text-slate-900 dark:text-slate-100"><div><h1 className="text-2xl font-bold">Etiketlerle Ara</h1><p className="text-sm text-slate-500 mt-1">Kişileri, gösterilen evleri ve takiplerini ortak etiketlerle bul.</p><p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Site etiketi, ilan, talep veya aktivitedeki Site / proje seçiminden gelir. Bir mal sahibi, bağlı ilanındaki site etiketiyle de bulunur. Eksikse ilgili kaydı açıp siteyi sonradan seçebilirsin.</p></div>
 <TagFilters facets={result.facets} selected={selected} onChange={keys=>change('tag',keys)}/>
 <input aria-label="Etiket sonuçlarında ara" value={search} onChange={e=>change('q',e.target.value)} placeholder="Sonuçları isim veya başlıkla daralt…" className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700"/>
 <nav aria-label="Sonuç türü" className="flex flex-wrap gap-2">{Object.entries(ENTITY_LABELS).map(([key,label])=><button type="button" key={key} aria-pressed={kind===key} onClick={()=>change('kind',key)} className={`px-3 py-2 rounded-lg text-sm ${kind===key?'bg-sky-600 text-white':'bg-slate-100 dark:bg-slate-800'}`}>{label} {!loading && `(${result.counts[key as TagEntity] || 0})`}</button>)}</nav>
 {error && <div role="alert" className="p-4 border rounded-xl text-amber-800 dark:text-amber-200">{error} <button onClick={()=>setRefresh(v=>v+1)} className="underline">Yeniden dene</button></div>}
 {loading ? <p role="status">Tüm kayıtlarda aranıyor…</p> : !error && !result.rows.length ? <p>Bu etiket birleşiminde kayıt yok. Bir filtreyi kaldırarak aramayı genişletebilirsin.</p> : <div className="grid md:grid-cols-2 gap-4">{result.rows.map(row=><article key={row.entity_id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3"><Link to={row.href} className="font-semibold text-sky-700 dark:text-sky-300 hover:underline">{row.title || 'İsimsiz kayıt'} →</Link>{row.contexts.map((context,i)=><div key={i} className="border-t border-slate-100 dark:border-slate-700 pt-2 space-y-2"><p className="text-xs text-slate-500">{context.label}{context.subtitle ? ` · ${context.subtitle}`:''}</p><TagChips tags={context.tags} kind={kind} selected={selected}/><div className="flex flex-wrap gap-3">{context.links.map((link,j)=><Link key={j} to={link.href} className="text-sm underline text-sky-700 dark:text-sky-300">{link.label}</Link>)}</div></div>)}</article>)}</div>}
 {!loading && result.rows.length<(result.counts[kind] || 0) && <button disabled={more} onClick={()=>void loadMore()} className="rounded-lg bg-sky-600 text-white px-4 py-2 disabled:opacity-50">{more?'Yükleniyor…':'Daha fazla göster'}</button>}
 </div>;
}
