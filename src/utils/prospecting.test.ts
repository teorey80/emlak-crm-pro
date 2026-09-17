import test from 'node:test';
import assert from 'node:assert/strict';
import { followUpState, fromIstanbulInput, matchesProspect, normalizePhone, normalizeSearch, parseDelimited, parseProspectImport, toIstanbulInput, validateImport } from './prospecting.ts';
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
