import type { ProspectCase, ProspectEngagement, ProspectEvent, ProspectImportBatch, ProspectImportRow, ProspectStage } from '../types';

export type ProspectEngagementEvent = Pick<ProspectEvent, 'case_id' | 'outcome' | 'occurred_at'>;
export const emptyEngagement = (): ProspectEngagement => ({ conversations: 0, attempts: 0, plans: 0, imported: 0, crmEvents: 0, lastConversationAt: null });

// Source notes and imported history never count as a conversation recorded in this CRM.
export function attachEngagement(records: ProspectCase[], events: ProspectEngagementEvent[]): ProspectCase[] {
  const summaries = new Map(records.map(record => [record.id, emptyEngagement()]));
  for (const event of events) {
    const summary = summaries.get(event.case_id);
    if (!summary) continue;
    if (event.outcome === 'import') { summary.imported++; continue; }
    summary.crmEvents++;
    if (event.outcome === 'reached') {
      summary.conversations++;
      if (event.occurred_at && (!summary.lastConversationAt || Date.parse(event.occurred_at) > Date.parse(summary.lastConversationAt))) summary.lastConversationAt = event.occurred_at;
    } else if (event.outcome === 'no_answer') summary.attempts++;
    else if (event.outcome === 'plan') summary.plans++;
  }
  return records.map(record => ({ ...record, engagement: summaries.get(record.id)! }));
}

export function prospectEngagementStatus(item: ProspectCase): 'unknown' | 'reached' | 'unanswered' | 'imported' | 'planned' | 'untouched' {
  const history = item.engagement;
  if (!history) return 'unknown';
  if (history.conversations) return 'reached';
  if (history.attempts) return 'unanswered';
  if (history.imported) return 'imported';
  if (history.plans) return 'planned';
  return 'untouched';
}

export const ENGAGEMENT_LABELS = {
  unknown: 'Görüşme durumu doğrulanamadı', reached: 'CRM’de görüşüldü', unanswered: 'Arandı, ulaşılamadı',
  imported: 'Listede eski görüşme var', planned: 'Planlandı · Görüşme kaydı yok', untouched: 'Görüşme kaydı yok',
};

export const prospectSourceName = (item: ProspectCase) => item.source_metadata['Aktarım kaynağı'] || `${item.site_name} listesi`;

export const PROSPECT_STAGES: Record<ProspectStage, string> = {
  pool: 'Veri havuzu', new: 'Aranacak', follow_up: 'Takipte', meeting: 'Portföy görüşmesi',
  authorization: 'Yetkilendirme', other_agent: 'Başka emlakçıda', snoozed: 'İleri tarih',
  won: 'Portföye dönüştü', lost: 'Pasif',
};
export const ACTIVE_STAGES: ProspectStage[] = ['new', 'follow_up', 'meeting', 'authorization'];
export const WAITING_STAGES: ProspectStage[] = ['other_agent', 'snoozed'];
export const CLOSED_STAGES: ProspectStage[] = ['won', 'lost'];
export const normalizeSearch = (value: string) => value.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i');
export const normalizePhone = (value: string) => {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('0090')) digits = digits.slice(4);
  if (digits.length === 12 && digits.startsWith('90')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
};
export const istanbulDate = (value: string | Date = new Date()) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date(value));
export const formatProspectDate = (value: string) => new Intl.DateTimeFormat('tr-TR', {
  timeZone: 'Europe/Istanbul', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
}).format(new Date(value));
export const toIstanbulInput = (value: string) => {
  const parts = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(value));
  return parts.replace(' ', 'T');
};
export const fromIstanbulInput = (value: string) => value ? new Date(`${value}:00+03:00`).toISOString() : null;

export function followUpState(item: ProspectCase, today = istanbulDate()): 'blocked' | 'closed' | 'pool' | 'undated' | 'overdue' | 'today' | 'planned' {
  if (item.contact.do_not_contact) return 'blocked';
  if (CLOSED_STAGES.includes(item.stage)) return 'closed';
  if (item.stage === 'pool' && !item.next_action_at) return 'pool';
  if (!item.next_action_at) return 'undated';
  const day = istanbulDate(item.next_action_at);
  return day < today ? 'overdue' : day === today ? 'today' : 'planned';
}

export function matchesProspect(item: ProspectCase, query: string): boolean {
  if (!query.trim()) return true;
  if (/^[+\d\s().-]+$/.test(query) && query.replace(/\D/g, '').length >= 7) {
    return normalizePhone(item.contact.phone).includes(normalizePhone(query));
  }
  const haystack = normalizeSearch([item.contact.name, item.contact.phone, item.site_name, item.block, item.unit,
    `${item.block}-${item.unit}`, item.last_note, item.search_notes || '', item.source_note, item.next_action,
    PROSPECT_STAGES[item.stage], ...Object.values(item.source_metadata)].join(' '));
  return normalizeSearch(query).split(/\s+/).filter(Boolean).every(word => haystack.includes(word));
}

const sheetStages: Record<string, ProspectStage> = {
  'Sınıflandırılmadı': 'pool', 'Aranacak': 'new', 'İletişime geçildi': 'follow_up',
  'Potansiyel portföy': 'follow_up', 'Portföy görüşmesi': 'meeting', 'Aktif portföy': 'won',
  'Başka emlakçıda': 'other_agent', 'Reddetti': 'lost', 'Kapandı / pasif': 'lost',
};

// CSV quoted commas, multiline notes and escaped quotes must survive import unchanged.
export function parseDelimited(text: string): string[][] {
  const input = text.replace(/^\uFEFF/, '');
  const header = input.split(/\r?\n/, 1)[0];
  const delimiter = header.includes('\t') ? '\t' : header.split(';').length > header.split(',').length ? ';' : ',';
  const rows: string[][] = []; let row: string[] = []; let cell = ''; let quoted = false;
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === '"') {
      if (quoted && input[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted;
    } else if (!quoted && char === delimiter) { row.push(cell); cell = ''; }
    else if (!quoted && (char === '\n' || char === '\r')) {
      if (char === '\r' && input[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += char;
  }
  if (quoted) throw new Error('Dosyada kapanmamış bir metin alanı var. CSV dosyasını yeniden dışa aktarın.');
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim()));
}

export function parseProspectImport(text: string): ProspectImportBatch {
  if (text.trimStart().startsWith('{')) {
    try { return validateImport(JSON.parse(text)); }
    catch (error) { if (error instanceof SyntaxError) throw new Error('Aktarım dosyasının biçimi bozuk. Dosyayı yeniden seçin.'); throw error; }
  }
  const [headers, ...values] = parseDelimited(text);
  if (!headers || !['Kayıt ID', 'Daire', 'Malik', 'Telefon'].every(h => headers.includes(h))) {
    throw new Error('CRM_Kayitlar sayfasının CSV dosyasını veya hazırlanmış aktarım dosyasını seçin.');
  }
  const rows: ProspectImportRow[] = values.map((cells, i) => {
    const at = (label: string) => cells[headers.indexOf(label)]?.trim() || '';
    const unit = at('Daire'); const split = unit.indexOf('-');
    const sourceUrl = at('Kaynak kayıt');
    const sourceId = sourceUrl.match(/\/spreadsheets\/d\/([^/]+)/)?.[1];
    if (!sourceId) throw new Error(`${i + 2}. satırda kaynak tablo bağlantısı eksik.`);
    const rawStage = at('Güncel aşama • otomatik') || at('Başlangıç aşaması');
    const rawDate = at('Sonraki takip • otomatik');
    const warning = [at('Veri kontrolü'), rawDate ? 'Kaynak takip tarihi kontrol edilerek yeniden planlanmalı: ' + rawDate : '', rawStage && !sheetStages[rawStage] ? 'Bilinmeyen kaynak aşaması: ' + rawStage : ''].filter(Boolean).join(' · ');
    return {
      source_key: `${sourceId}:${at('Kayıt ID')}`, source_url: sourceUrl, name: at('Malik'), phone: at('Telefon'),
      site_name: 'Nef Çamlıtepe', block: split < 0 ? '' : unit.slice(0, split), unit: split < 0 ? unit : unit.slice(split + 1),
      stage: sheetStages[rawStage] || 'pool', do_not_contact: at('İletişim tercihi') === 'Aranmasın',
      transaction_type: at('İşlem türü') || 'Belirsiz', priority: at('Öncelik') || 'Normal',
      source_note: at('Kaynak notu'), source_metadata: { 'Kaynak aşaması': rawStage, 'Kullanım bilgisi': at('Kullanım bilgisi'), 'Diğer emlakçı': at('Diğer emlakçı'), 'Yetki bitişi': at('Diğer emlakçı yetki bitişi'), 'Son not': at('Son not • otomatik'), 'Kaynak takip tarihi': rawDate },
      data_warning: warning, next_action: at('Sonraki adım • otomatik'), next_action_at: null, events: [],
    };
  });
  return validateImport({ format: 'emlakcrm-prospecting-v1', source_name: 'Google E-Tablo', rows });
}

export function validateImport(value: unknown): ProspectImportBatch {
  if (!value || typeof value !== 'object') throw new Error('Aktarım dosyası geçersiz.');
  const batch = value as ProspectImportBatch;
  if (batch.format !== 'emlakcrm-prospecting-v1' || !Array.isArray(batch.rows) || !batch.rows.length || batch.rows.length > 1000) throw new Error('Aktarım dosyası 1–1000 kayıt içermeli.');
  const keys = new Set<string>();
  batch.rows.forEach((r, i) => {
    if (!r || typeof r !== 'object') throw new Error(`${i + 1}. kayıt geçersiz.`);
    for (const key of ['source_key', 'source_url', 'name', 'phone', 'site_name', 'block', 'unit', 'transaction_type', 'priority', 'source_note', 'data_warning', 'next_action'] as const) {
      if (typeof r[key] !== 'string' || r[key].length > 20000) throw new Error(`${i + 1}. kayıtta ${key} alanı geçersiz.`);
    }
    if (!r.name.trim() || !r.source_key.trim() || !r.site_name.trim() || !r.unit.trim() || keys.has(r.source_key)) throw new Error(`${i + 1}. kayıtta zorunlu alan eksik veya kayıt ID’si tekrarlanmış.`);
    keys.add(r.source_key);
    if (!Object.hasOwn(PROSPECT_STAGES, r.stage) || typeof r.do_not_contact !== 'boolean') throw new Error(`${i + 1}. kayıtta aşama veya iletişim tercihi geçersiz.`);
    if (r.next_action_at !== null && (typeof r.next_action_at !== 'string' || !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(r.next_action_at) || !Number.isFinite(Date.parse(r.next_action_at)))) throw new Error(`${i + 1}. kayıtta takip tarihi geçersiz.`);
    if (!r.source_metadata || typeof r.source_metadata !== 'object' || Array.isArray(r.source_metadata) || Object.values(r.source_metadata).some(v => typeof v !== 'string')) throw new Error(`${i + 1}. kayıtta kaynak bilgisi geçersiz.`);
    if (!Array.isArray(r.events) || r.events.length > 1000) throw new Error(`${i + 1}. kayıtta görüşme geçmişi geçersiz.`);
    for (const event of r.events) {
      if (!event || typeof event.note !== 'string' || !event.note.trim() || !Object.hasOwn(PROSPECT_STAGES, event.stage) || typeof event.next_action !== 'string') throw new Error(`${i + 1}. kayıtta görüşme bilgisi eksik.`);
      if (event.date_precision && !['day', 'minute', 'unknown'].includes(event.date_precision)) throw new Error(`${i + 1}. kayıtta tarih hassasiyeti geçersiz.`);
      for (const date of [event.occurred_at, event.next_action_at]) if (date !== null && (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(date) || !Number.isFinite(Date.parse(date)))) throw new Error(`${i + 1}. kayıtta görüşme tarihi geçersiz.`);
    }
    if (r.phone && normalizePhone(r.phone).length !== 10 && !r.data_warning.includes('Telefon biçimini kontrol edin')) r.data_warning = [r.data_warning, 'Telefon biçimini kontrol edin'].filter(Boolean).join(' · ');
    if (!r.phone && !r.data_warning.includes('Telefon eksik')) r.data_warning = [r.data_warning, 'Telefon eksik'].filter(Boolean).join(' · ');
  });
  const units = new Map<string, number>();
  for (const r of batch.rows) { const key = normalizeSearch(`${r.site_name}|${r.block}|${r.unit}`); units.set(key, (units.get(key) || 0) + 1); }
  for (const r of batch.rows) if ((units.get(normalizeSearch(`${r.site_name}|${r.block}|${r.unit}`)) || 0) > 1 && !r.data_warning.includes('daire')) r.data_warning = [r.data_warning, 'Aynı daire birden fazla kayıtta; birleştirmeden teyit edin'].filter(Boolean).join(' · ');
  return batch;
}

export const prospectSourceKind = (item: ProspectCase) => item.source_kind || 'list';
export const prospectOriginLabel = (item: ProspectCase) => prospectSourceKind(item) === 'fsbo' ? 'FSBO' : prospectSourceKind(item) === 'manual' ? 'Manuel kayıt' : 'Liste aktarımı';
export function safeProspectUrl(value: string): boolean {
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password; } catch { return false; }
}

export const prospectLocation = (item: ProspectCase) => [item.site_name, [item.block && `${item.block} blok`, item.unit && `Daire ${item.unit}`].filter(Boolean).join(' · ')].filter(Boolean).join(' · ');
