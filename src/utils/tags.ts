export type TagEntity = 'customer' | 'property' | 'activity' | 'request' | 'prospect';
export interface CrmTag { key: string; group: string; label: string; count?: number; }
export interface TagLink { label: string; href: string; }
export interface TagContext { label: string; subtitle?: string; tags: CrmTag[]; links: TagLink[]; }
export interface TagDocument { entity_type: TagEntity; entity_id: string; title: string; href: string; contexts: TagContext[]; }
export interface TagSearchResult { rows: TagDocument[]; counts: Partial<Record<TagEntity, number>>; facets: CrmTag[]; }
export const ENTITY_LABELS: Record<TagEntity, string> = { customer: 'Müşteriler', property: 'Portföyler', activity: 'Aktiviteler', prospect: 'Takipler', request: 'Talepler' };
export const TAG_GROUPS: Record<string, string> = { role: 'Kişi rolü', event: 'Görüşme / işlem', site: 'Site / proje', rooms: 'Oda', transaction: 'Satılık / kiralık', source: 'Kaynak', stage: 'Takip aşaması', outcome: 'Sonuç', custom: 'Özel etiket' };
export const TAG_COLORS: Record<string, string> = {
 role: 'bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100',
 event: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100',
 site: 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100',
 rooms: 'bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100',
 source: 'bg-cyan-100 text-cyan-900 dark:bg-cyan-900 dark:text-cyan-100',
 stage: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-100',
 outcome: 'bg-orange-100 text-orange-900 dark:bg-orange-900 dark:text-orange-100',
 custom: 'bg-pink-100 text-pink-900 dark:bg-pink-900 dark:text-pink-100',
 transaction: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100',
};
export function uniqueTags(tags: CrmTag[]): CrmTag[] { const order=Object.keys(TAG_GROUPS); return [...new Map(tags.map(tag => [tag.key, tag])).values()].sort((a,b)=>order.indexOf(a.group)-order.indexOf(b.group)); }
export function tagSearchUrl(keys: string[], kind: TagEntity = 'customer') {
 const params = new URLSearchParams({ kind });
 [...new Set(keys)].forEach(key => params.append('tag', key));
 return `/tags?${params}`;
}
// Keep all criteria in one evidence context. Never combine two unrelated showings.
export function matchesTagContext(tags: CrmTag[], selected: string[]): boolean {
 const groups = new Map<string, string[]>();
 for (const key of selected) { const group = key.startsWith('custom:') ? key : key.split(':')[0]; groups.set(group, [...(groups.get(group) || []), key]); }
 return [...groups.values()].every(keys => tags.some(tag => keys.includes(tag.key)));
}
export function matchingContexts(contexts: TagContext[], selected: string[]) { return contexts.filter(context => matchesTagContext(context.tags, selected)); }
