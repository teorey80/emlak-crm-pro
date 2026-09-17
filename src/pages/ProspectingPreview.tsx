// Development-only entry. No real customer records or database writes.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import { ProspectingWorkspace } from './Prospecting';
import type { ProspectCase, ProspectEvent, ProspectStage } from '../types';
import type { ProspectingRepository } from '../services/prospectingService';
import { attachEngagement } from '../utils/prospecting';

function createPreviewRepository(): ProspectingRepository {
  const day = 86400000;
  const rows: ProspectCase[] = ([
    ['Ayşe Hanım', 'B', '24', 'follow_up', -1, 'Ailesiyle konuşup satış kararını bildirecek.'],
    ['Mehmet Bey', 'A', '03', 'new', 0, 'İlk arama yapılacak.'],
    ['Selim Bey', 'C', '08', 'meeting', 1, 'Dairede fiyat çalışması ve portföy görüşmesi.'],
    ['Derya Hanım', 'A', '31', 'authorization', 0, 'Hizmet koşullarını değerlendiriyor.'],
    ['Murat Bey', 'B', '09', 'other_agent', 30, 'Başka danışmanda; yetki süresi sonunda yeniden görüşülecek.'],
    ['Ece Hanım', 'D', '04', 'lost', null, 'Tekrar aranmak istemiyor.'],
    ['Örnek Malik', 'E', '05', 'pool', null, 'Henüz sınıflandırılmadı.'],
    ['Deniz Hanım', 'G', '17', 'follow_up', null, 'Yeniden arama için tarih belirlenmeli.'],
  ] as Array<[string, string, string, ProspectStage, number | null, string]>).map(([name, block, unit, stage, offset, note], i) => ({
    id: `demo-${i}`, contact_id: `contact-${i}`, contact: { id: `contact-${i}`, name, phone: '', do_not_contact: i === 5 },
    site_name: 'Örnek Site', block, unit, stage, transaction_type: 'Belirsiz', priority: 'Normal',
    source_key: `demo:${i}`, source_url: '', source_note: note, source_metadata: {}, data_warning: '',
    last_note: i === 0 ? note : '', last_contact_at: null, next_action: offset === null ? '' : 'Mal sahibiyle görüş',
    next_action_at: offset === null ? null : new Date(Date.now() + offset * day + 3600000).toISOString(),
    closed_reason: '', version: 1, created_at: new Date().toISOString(),
  }));
  const events: ProspectEvent[] = [];
  const done = new Set<string>();
  return {
    async start(input) {
      const previous = rows.find(r => r.source_key === `manual:${input.request_id}`);
      if (previous) return previous.id;
      const id = crypto.randomUUID();
      const stage = input.outcome === 'do_not_contact' ? 'lost' : input.outcome === 'no_answer' ? 'new' : input.stage;
      rows.push({ id, contact_id: id, contact: { id, name: input.name, phone: input.phone, do_not_contact: input.outcome === 'do_not_contact' },
        source_kind: input.source_kind, site_name: input.site_name, block: input.block, unit: input.unit, stage,
        transaction_type: input.transaction_type, priority: 'Normal', source_key: `manual:${input.request_id}`, source_url: input.source_url,
        source_note: '', source_metadata: { Kanal: input.channel }, data_warning: '', last_note: input.note, last_contact_at: input.outcome === 'reached' ? new Date().toISOString() : null,
        next_action: input.next_action_at ? input.next_action : '', next_action_at: input.next_action_at, closed_reason: input.closed_reason, version: 2, created_at: new Date().toISOString() });
      events.push({ id: crypto.randomUUID(), case_id: id, occurred_at: new Date().toISOString(), date_precision: 'minute', created_at: new Date().toISOString(), outcome: input.outcome, note: input.note, stage, next_action: input.next_action, next_action_at: input.next_action_at });
      return id;
    },
    list: async () => attachEngagement(structuredClone(rows), events),
    history: async id => structuredClone(events.filter(event => event.case_id === id).reverse()),
    async record(input) {
      if (done.has(input.request_id)) return;
      const item = rows.find(row => row.id === input.case_id);
      if (!item || item.version !== input.expected_version) throw new Error('Kayıt değişti. Listeyi yenileyin.');
      if (item.contact.do_not_contact) throw new Error('Bu kişi aranmak istemiyor.');
      const stage = input.outcome === 'no_answer' ? item.stage : input.outcome === 'do_not_contact' ? 'lost' : input.stage;
      Object.assign(item, { stage, last_note: input.note, next_action: input.next_action, next_action_at: input.next_action_at, version: item.version + 1 });
      if (input.outcome === 'do_not_contact') { item.contact.do_not_contact = true; item.next_action = ''; item.next_action_at = null; }
      events.push({ id: crypto.randomUUID(), case_id: item.id, occurred_at: input.occurred_at, date_precision: 'minute', created_at: new Date().toISOString(), outcome: input.outcome, note: input.note, stage, next_action: item.next_action, next_action_at: item.next_action_at });
      done.add(input.request_id);
    },
    async importRows(imported) {
      let added = 0; let skipped = 0;
      for (const source of imported) {
        if (rows.some(row => row.source_key === source.source_key)) { skipped++; continue; }
        const id = crypto.randomUUID();
        rows.push({ ...source, id, contact_id: id, contact: { id, name: source.name, phone: source.phone, do_not_contact: source.do_not_contact }, last_note: '', last_contact_at: null, closed_reason: '', version: 1, created_at: new Date().toISOString() });
        for (const entry of source.events) events.push({ ...entry, id: crypto.randomUUID(), case_id: id, date_precision: entry.date_precision || 'day', created_at: new Date().toISOString(), outcome: 'import' });
        added++;
      }
      return { added, skipped };
    },
  };
}

if (import.meta.env.DEV) {
  const repository = createPreviewRepository();
  createRoot(document.getElementById('root')!).render(<main className="max-w-7xl mx-auto p-4 md:p-8"><Toaster /><ProspectingWorkspace repository={repository} preview /></main>);
}
