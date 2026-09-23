import { supabase } from './supabaseClient';
import type { ProspectCase, ProspectEvent, ProspectEventInput, ProspectImportRow, ProspectStartInput, ProspectActivitySource } from '../types';
import { attachProspectHistory } from '../utils/prospecting';

export interface ProspectingRepository {
  start?: (input: ProspectStartInput) => Promise<string>;
  activity?: (id: string) => Promise<ProspectActivitySource>;
  list: () => Promise<ProspectCase[]>;
  history: (id: string) => Promise<ProspectEvent[]>;
  record: (input: ProspectEventInput) => Promise<void>;
  importRows: (rows: ProspectImportRow[]) => Promise<{ added: number; skipped: number }>;
}

export function prospectingError(error: unknown): string {
  const issue = error as { code?: string; message?: string };
  if (issue?.code === '42P01' || issue?.code === 'PGRST205' || issue?.code === 'PGRST202') return 'Portföy Takibi henüz bu hesapta etkinleştirilmedi. Kurulum tamamlandıktan sonra yeniden deneyin.';
  return issue?.message || 'İşlem tamamlanamadı. Bağlantınızı kontrol edip tekrar deneyin.';
}

async function listCases() {
    // Load every page before filtering: older records never disappear from search.
    const records: ProspectCase[] = [];
    let cursor: string | undefined;
    while (true) {
      let query = supabase.from('prospecting_cases').select('*, contact:prospecting_contacts!inner(id,name,phone,do_not_contact,customer_id)').order('id').limit(500);
      if (cursor) query = query.gt('id', cursor);
      const { data, error } = await query;
      if (error) throw error;
      const page = data as unknown as ProspectCase[];
      records.push(...page);
      if (page.length < 500) return records;
      cursor = page[page.length - 1].id;
    }
}

async function listEngagementEvents() {
  const events: ProspectEvent[] = [];
  let cursor: string | undefined;
  while (true) {
    let query = supabase.from('prospecting_events').select('*').order('id').limit(500);
    if (cursor) query = query.gt('id', cursor);
    const { data, error } = await query;
    if (error) throw error;
    const page = data as ProspectEvent[];
    events.push(...page);
    if (page.length < 500) return events;
    cursor = page[page.length - 1].id;
  }
}

export const prospectingRepository: ProspectingRepository = {
  async start(input) {
    const { data, error } = await supabase.rpc('prospecting_start', { p_input: input });
    if (error) throw error;
    window.dispatchEvent(new Event('crm-tags-changed'));
    return data as string;
  },
  async activity(id) {
    const [activityResult, linkResult] = await Promise.all([
      supabase.from('activities').select('*').eq('id', id).single(),
      supabase.from('prospecting_activity_links').select('case_id').eq('activity_id', id).maybeSingle(),
    ]);
    if (activityResult.error) throw activityResult.error;
    if (linkResult.error) throw linkResult.error;
    const activity = activityResult.data as ProspectActivitySource['activity'];
    const { data: customer, error } = await supabase.from('customers').select('id,name,phone').eq('id', activity.customerId).single();
    if (error) throw error;
    return { activity, customer, linkedCaseId: linkResult.data?.case_id };
  },
  async list() {
    // A history read failure must not label real conversations as untouched.
    const [records, events, sites] = await Promise.all([listCases(), listEngagementEvents(), supabase.from('sites').select('id,name')]);
    if (sites.error) throw sites.error;
    const names = new Map((sites.data || []).map(site=>[site.id,site.name]));
    return attachProspectHistory(records.map(record=>({...record,site_name:names.get(record.site_id) || record.site_name})), events);
  },
  async history(id) {
    const events: ProspectEvent[] = [];
    let cursor: string | undefined;
    while (true) {
      let query = supabase.from('prospecting_events').select('*').eq('case_id', id).order('id').limit(500);
      if (cursor) query = query.gt('id', cursor);
      const { data, error } = await query;
      if (error) throw error;
      const page = data as ProspectEvent[];
      events.push(...page);
      if (page.length < 500) return events.sort((a, b) => (b.occurred_at || '').localeCompare(a.occurred_at || '') || b.created_at.localeCompare(a.created_at));
      cursor = page[page.length - 1].id;
    }
  },
  async record(input) {
    const { error } = await supabase.rpc('prospecting_record_event', { p_input: input });
    if (error) throw error;
    window.dispatchEvent(new Event('crm-tags-changed'));
  },
  async importRows(rows) {
    const { data, error } = await supabase.rpc('prospecting_import', { p_rows: rows });
    if (error) throw error;
    return data as { added: number; skipped: number };
  },
};
