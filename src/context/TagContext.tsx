import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useData } from './DataContext';
import { entityTagBatch, tagError, type EntityTagRow } from '../services/tagService';
import type { TagEntity } from '../utils/tags';
interface TagCache { rows: Record<string, EntityTagRow[]>; error: string; load: (type: TagEntity, id: string) => (() => void); refresh: () => void; }
const Context = createContext<TagCache | null>(null);
export const useEntityTagCache = () => useContext(Context);
const ScopedTagProvider: React.FC<{ children: React.ReactNode }> = ({ children }: { children: React.ReactNode }) => {
 const { customers, properties, activities, requests, sites } = useData();
 const [rows, setRows] = useState<Record<string, EntityTagRow[]>>({});
 const [error, setError] = useState('');
 const requested = useRef(new Map<string, { type: TagEntity; id: string }>());
 const subscribers = useRef(new Map<string,number>());
 const pending = useRef(new Map<string, { type: TagEntity; id: string }>());
 const timer = useRef<ReturnType<typeof setTimeout>>();
 const generation = useRef(0);
 const flush = useCallback(() => {
  clearTimeout(timer.current);
  timer.current = setTimeout(async () => {
   const batch = [...pending.current.values()]; pending.current.clear();
   if (!batch.length) return;
   const version = generation.current;
   try {
    const result = await entityTagBatch(batch);
    if (version !== generation.current) return;
    const next: Record<string, EntityTagRow[]> = {};
    batch.forEach(item => { next[`${item.type}:${item.id}`] = []; });
    result.forEach(item => { (next[`${item.entity_type}:${item.entity_id}`] ||= []).push(item); });
    setRows(prev => ({ ...prev, ...next })); setError('');
   } catch (err) { if (version === generation.current) setError(tagError(err)); }
  }, 40);
 }, []);
 const load = useCallback((type: TagEntity, id: string) => {
  const key = `${type}:${id}`;
  if (!id) return () => {};
  subscribers.current.set(key, (subscribers.current.get(key) || 0) + 1);
  if (!requested.current.has(key)) {
   requested.current.set(key, { type, id });
   pending.current.set(key, { type, id }); flush();
  }
  return () => {
   const remaining = (subscribers.current.get(key) || 1) - 1;
   if (remaining) subscribers.current.set(key, remaining);
   else { subscribers.current.delete(key); requested.current.delete(key); pending.current.delete(key); }
  };
 }, [flush]);
 const refresh = useCallback(() => {
  generation.current++; setRows({}); setError(''); pending.current = new Map(requested.current); flush();
 }, [flush]);
 useEffect(refresh, [customers, properties, activities, requests, sites, refresh]);
 useEffect(() => { window.addEventListener('crm-tags-changed', refresh); return () => window.removeEventListener('crm-tags-changed', refresh); }, [refresh]);
 useEffect(() => () => { generation.current++; clearTimeout(timer.current); }, []);
 return <Context.Provider value={{ rows, error, load, refresh }}>{children}</Context.Provider>;
}
export function TagProvider({ children }: { children: React.ReactNode }) {
 const { session } = useData();
 return session ? <ScopedTagProvider key={session.user.id}>{children}</ScopedTagProvider> : <>{children}</>;
}
