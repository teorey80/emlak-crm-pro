import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useData } from '../context/DataContext';
// Search results can point outside the first list page. Fetch that record through RLS.
export function useCrmRecord<T extends { id: string }>(table: 'customers'|'properties'|'requests'|'activities', id: string | undefined, rows: T[]) {
 const { session }=useData();const cached=rows.find(row=>row.id===id);
 const [state,setState]=useState<{id?:string;user?:string;record?:T;error?:string;done:boolean}>({done:false});
 useEffect(()=>{let cancelled=false;if(cached || !id || !session?.user.id)return;
 setState({id,user:session.user.id,done:false});
 supabase.from(table).select('*').eq('id',id).maybeSingle().then(({data,error})=>{
  if(!cancelled)setState({id,user:session.user.id,record:data as T || undefined,error:error?'Kayıt yüklenemedi. Sayfayı yenileyerek tekrar deneyin.':undefined,done:true});
 });return()=>{cancelled=true;};},[table,id,cached,rows,session?.user.id]);
 const current=state.id===id && state.user===session?.user.id;
 return {record:cached || (current?state.record:undefined),loading:!cached && (!current || !state.done),error:current?state.error:undefined};
}
