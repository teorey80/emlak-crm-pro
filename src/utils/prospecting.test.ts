import test from 'node:test';
import assert from 'node:assert/strict';
import { attachEngagement, prospectEngagementStatus, prospectSourceName, followUpState, fromIstanbulInput, matchesProspect, normalizePhone, normalizeSearch, parseDelimited, parseProspectImport, toIstanbulInput, validateImport } from './prospecting.ts';
import type { ProspectCase, ProspectImportRow } from '../types.ts';

const row = (source_key = 'sheet:1'): ProspectImportRow => ({ source_key, source_url: '', name: 'Örnek Malik', phone: '0532 000 00 00', site_name: 'Örnek Site', block: 'A', unit: '03', stage: 'new', do_not_contact: false, transaction_type: 'Belirsiz', priority: 'Normal', source_note: '', source_metadata: {}, data_warning: '', next_action: '', next_action_at: null, events: [] });
const item = (stage: ProspectCase['stage'], due: string | null, blocked = false): ProspectCase => ({ ...row(), id: '1', contact_id: 'c', contact: { id: 'c', name: 'Örnek', phone: '5320000000', do_not_contact: blocked }, stage, next_action_at: due, last_note: '', last_contact_at: null, closed_reason: '', version: 1, created_at: '' });

test('CSV keeps multiline notes, delimiters, leading zeroes and escaped quotes', () => {
  assert.deepEqual(parseDelimited('\uFEFFMalik,Daire,Not\r\n"A, B",03,"Birinci satır\nİkinci ""alıntı"""'), [['Malik','Daire','Not'],['A, B','03','Birinci satır\nİkinci "alıntı"']]);
  assert.deepEqual(parseDelimited('Malik;Daire\nAli;03'), [['Malik','Daire'],['Ali','03']]);
  assert.throws(() => parseDelimited('a,b\n"eksik,b'), /kapanmamış/);
});
test('Turkish search and telephone normalization', () => {
  assert.equal(normalizeSearch('ÇEKMEKÖY Işık İREM'), normalizeSearch('cekmekoy isik irem'));
  assert.equal(normalizePhone('+90 (532) 000 00 00'), '5320000000');
  assert.equal(normalizePhone('0090 5320000000'), '5320000000');
});
test('Search finds region metadata, historical notes and formatted phone numbers', () => {
  const candidate = { ...item('follow_up', null), site_name: 'Nef Çamlıtepe', source_metadata: { 'Bölge': 'Çekmeköy' }, search_notes: 'Önceki not: Temmuzda satış düşünüyor.' };
  assert.equal(matchesProspect(candidate, 'nef çekmeköy'), true);
  assert.equal(matchesProspect(candidate, 'temmuz'), true);
  assert.equal(matchesProspect(candidate, '0532 000 00 00'), true);
  assert.equal(matchesProspect(candidate, '+90 (532) 000 00 00'), true);
  assert.equal(matchesProspect(candidate, 'başka site'), false);
});
test('Istanbul dates round trip regardless of machine timezone', () => {
  assert.equal(fromIstanbulInput('2026-09-17T09:30'), '2026-09-17T06:30:00.000Z');
  assert.equal(toIstanbulInput('2026-09-17T06:30:00Z'), '2026-09-17T09:30');
});
test('Overdue work remains visible; blocked and completed records leave the queue', () => {
  assert.equal(followUpState(item('follow_up', '2026-09-15T12:00:00Z'), '2026-09-17'), 'overdue');
  assert.equal(followUpState(item('new', null), '2026-09-17'), 'undated');
  assert.equal(followUpState(item('new', null, true), '2026-09-17'), 'blocked');
  assert.equal(followUpState(item('won', null), '2026-09-17'), 'closed');
  assert.equal(followUpState(item('pool', null), '2026-09-17'), 'pool');
  assert.equal(followUpState(item('pool', '2026-09-17T06:00:00Z'), '2026-09-17'), 'today');
  assert.equal(followUpState(item('snoozed', '2026-10-17T06:00:00Z'), '2026-09-17'), 'planned');
});
test('Source IDs prevent duplicates, unit conflicts are retained for review', () => {
  assert.throws(() => validateImport({ format: 'emlakcrm-prospecting-v1', rows: [row(), row()] }), /tekrarlanmış/);
  const result = validateImport({ format: 'emlakcrm-prospecting-v1', rows: [row(), { ...row('sheet:2'), name: 'Diğer malik' }] });
  assert.equal(result.rows.length, 2);
  assert.ok(result.rows.every(r => r.data_warning.includes('daire')));
  assert.equal(result.rows[0].unit, '03');
});
test('Unknown stages and invalid dates cannot be silently imported', () => {
  assert.throws(() => validateImport({ format: 'emlakcrm-prospecting-v1', rows: [{ ...row(), stage: 'unexpected' }] }), /aşama/);
  assert.throws(() => validateImport({ format: 'emlakcrm-prospecting-v1', rows: [{ ...row(), next_action_at: 'yesterday' }] }), /tarihi/);
});
test('Repeated preview does not duplicate data warnings', () => {
  const batch = validateImport({ format: 'emlakcrm-prospecting-v1', rows: [{ ...row(), phone: '' }] });
  assert.equal(validateImport(batch).rows[0].data_warning, 'Telefon eksik');
});
test('CSV imports retain source notes and opt-outs, without guessing follow-up dates', () => {
  const source = 'https://docs.google.com/spreadsheets/d/sheet-id/edit#range=A3:N3';
  const csv = 'Kayıt ID,Daire,Malik,Telefon,Güncel aşama • otomatik,İletişim tercihi,Kaynak kayıt,Kaynak notu,Sonraki takip • otomatik\nNEF-1,H1-03,Örnek,05320000000,Kapandı / pasif,Aranmasın,' + source + ',Eski not,17.09.2026';
  const imported = parseProspectImport(csv).rows[0];
  assert.equal(imported.source_key, 'sheet-id:NEF-1');
  assert.equal(imported.do_not_contact, true);
  assert.equal(imported.source_note, 'Eski not');
  assert.equal(imported.unit, '03');
  assert.equal(imported.next_action_at, null);
  assert.match(imported.data_warning, /17.09.2026/);
});

test('Imported notes and imported conversations cannot become CRM conversations', () => {
  const record = { ...item('meeting', null), source_note: 'Daha önce konuşulmuş', last_contact_at: '2026-09-16T10:00:00Z' };
  assert.equal(prospectEngagementStatus(record), 'unknown');
  assert.equal(prospectEngagementStatus(attachEngagement([record], [])[0]), 'untouched');
  const imported = attachEngagement([record], [{ case_id: record.id, outcome: 'import', occurred_at: record.last_contact_at }])[0];
  assert.equal(prospectEngagementStatus(imported), 'imported');
  assert.equal(imported.engagement?.conversations, 0);
});

test('Plans and unsuccessful calls stay separate from reached conversations', () => {
  const record = item('follow_up', null);
  const plan = { case_id: record.id, outcome: 'plan' as const, occurred_at: '2026-09-16T10:00:00Z' };
  const attempt = { ...plan, outcome: 'no_answer' as const };
  assert.equal(prospectEngagementStatus(attachEngagement([record], [plan])[0]), 'planned');
  assert.equal(prospectEngagementStatus(attachEngagement([record], [plan, attempt])[0]), 'unanswered');
  const contacted = attachEngagement([record], [plan, attempt, { ...plan, outcome: 'reached' }])[0];
  assert.equal(prospectEngagementStatus(contacted), 'reached');
  assert.equal(contacted.engagement?.conversations, 1);
});

test('Source survives progress and later failed calls cannot erase a real conversation', () => {
  const record = { ...item('authorization', null), source_metadata: { 'Aktarım kaynağı': 'Örnek malik listesi' } };
  const result = attachEngagement([record], [
    { case_id: record.id, outcome: 'reached', occurred_at: '2026-09-17T10:00:00+03:00' },
    { case_id: record.id, outcome: 'reached', occurred_at: '2026-09-17T06:00:00Z' },
    { case_id: record.id, outcome: 'no_answer', occurred_at: '2026-09-18T10:00:00Z' },
  ])[0];
  assert.equal(prospectEngagementStatus(result), 'reached');
  assert.equal(result.engagement?.lastConversationAt, '2026-09-17T10:00:00+03:00');
  assert.equal(prospectSourceName(result), 'Örnek malik listesi');
  assert.equal(result.stage, 'authorization');
});

test('Conversation summaries are scoped to a case, even for the same contact', () => {
  const one = item('new', null);
  const two = { ...one, id: '2', unit: '04' };
  const results = attachEngagement([one, two], [{ case_id: one.id, outcome: 'reached', occurred_at: '2026-09-17T10:00:00Z' }]);
  assert.equal(prospectEngagementStatus(results[0]), 'reached');
  assert.equal(prospectEngagementStatus(results[1]), 'untouched');
});


test('FSBO links accept web URLs but reject scripts and embedded credentials', async () => {
  const { safeProspectUrl } = await import('./prospecting.ts');
  assert.equal(safeProspectUrl('https://example.com/ilan/123'), true);
  assert.equal(safeProspectUrl('javascript:alert(1)'), false);
  assert.equal(safeProspectUrl('https://user:secret@example.com'), false);
  assert.equal(safeProspectUrl(''), false);
});
