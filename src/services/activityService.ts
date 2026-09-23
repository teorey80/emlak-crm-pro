import { supabase } from './supabaseClient';
import type { Activity } from '../types';

export interface ActivityFilters { search: string; type: string; source: string; date: string; record?: string; }
export async function listActivityPage(filters: ActivityFilters, offset = 0, pageSize = 50) {
  let query = supabase.from('activities').select('*', { count: 'exact' })
    .order('date', { ascending: false, nullsFirst: false })
    .order('time', { ascending: false, nullsFirst: false }).order('id', { ascending: false });
  if (filters.record) query = query.eq('id', filters.record);
  if (filters.type !== 'all') query = query.eq('type', filters.type);
  if (filters.date) query = query.eq('date', filters.date);
  if (filters.source === 'fsbo') query = query.eq('prospecting_source_kind', 'fsbo');
  if (filters.source === 'follow_up') query = query.eq('prospecting_is_follow_up', true);
  if (filters.source === 'list') query = query.eq('prospecting_source_kind', 'list');
  if (filters.source === 'other') query = query.is('prospecting_event_id', null);
  if (filters.search.trim()) {
    const text = filters.search.trim().replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[%_]/g, '\\$&');
    query = query.or(`customerName.ilike."%${text}%",propertyTitle.ilike."%${text}%",description.ilike."%${text}%"`);
  }
  const { data, error, count } = await query.range(offset, offset + pageSize - 1);
  if (error) throw error;
  return { rows: data as Activity[], count: count || 0 };
}
