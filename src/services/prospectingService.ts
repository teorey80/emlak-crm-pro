import { supabase } from './supabaseClient';
import type { ProspectCase, ProspectEvent, ProspectEventInput, ProspectImportRow } from '../types';

export interface ProspectingRepository {
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

export const prospectingRepository: ProspectingRepository = {
  async list() {
    // Load every page before filtering: older records never disappear from search.
    const records: ProspectCase[] = [];
    let cursor: string | undefined;
    while (true) {
      let query = supabase.from('prospecting_cases').select('*, contact:prospecting_contacts!inner(id,name,phone,do_not_contact)').order('id').limit(500);
      if (cursor) query = query.gt('id', cursor);
      const { data, error } = await query;
      if (error) throw error;
      const page = data as unknown as ProspectCase[];
      records.push(...page);
      if (page.length < 500) return records;
      cursor = page[page.length - 1].id;
    }
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
  },
  async importRows(rows) {
    const { data, error } = await supabase.rpc('prospecting_import', { p_rows: rows });
    if (error) throw error;
    return data as { added: number; skipped: number };
  },
};
