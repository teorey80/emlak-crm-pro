import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useData } from '../context/DataContext';
export default function CustomerLinkPicker({ value, onChange }: { value: string | null; onChange: (id: string | null) => void }) {
 const {session}=useData();const [search,setSearch]=useState('');const [rows,setRows]=useState<{id:string;name:string}[]>([]);const [error,setError]=useState('');
 useEffect(()=>{let active=true;const timer=setTimeout(async()=>{
  if(!session)return;
  let query=supabase.from('customers').select('id,name').eq('user_id',session.user.id).order('name').order('id').limit(30);
  if(search.trim())query=query.ilike('name',`%${search.trim().replace(/[%_\\]/g,'\\$&')}%`);
  const [result,current]=await Promise.all([query,value?supabase.from('customers').select('id,name').eq('user_id',session.user.id).eq('id',value).maybeSingle():Promise.resolve({data:null,error:null})]);
  if(!active)return;
  if(result.error || current.error){setError('Müşteriler yüklenemedi.');return;}
  setError('');setRows([...new Map([...(current.data?[current.data]:[]),...(result.data || [])].map(row=>[row.id,row])).values()]);
 },200);return()=>{active=false;clearTimeout(timer);};},[search,value,session?.user.id]);
 return <div className="space-y-2"><label className="block text-sm">Bağlı müşteri kartı<input aria-label="Bağlanacak müşteriyi ara" value={search} onChange={e=>setSearch(e.target.value)} placeholder="İsimle müşteri bul…" className="block w-full border rounded-lg p-2 dark:bg-slate-800 dark:border-slate-600"/></label><select aria-label="Bağlı müşteri kartı seç" value={value || ''} onChange={e=>onChange(e.target.value || null)} className="w-full border rounded-lg p-2 dark:bg-slate-800 dark:border-slate-600"><option value="">Müşteri kartına bağlanmadı</option>{rows.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}</select><p className="text-xs text-slate-500">İlk 30 eşleşme listelenir; isim yazarak daraltabilirsin. Bağlantı bu kişinin tüm takip kartlarında kullanılır.</p>{error && <p role="alert" className="text-red-600">{error}</p>}</div>;
}
