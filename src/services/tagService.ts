import { supabase } from './supabaseClient';
import type { CrmTag, TagEntity, TagSearchResult, TagLink } from '../utils/tags';
export interface EntityTagRow { entity_type: TagEntity; entity_id: string; context_label: string; subtitle: string; own_custom_tags: CrmTag[]; tags: CrmTag[]; links: TagLink[]; }
export async function searchTags(selected: string[], kind: TagEntity, search = '', offset = 0): Promise<TagSearchResult> {
 const { data, error } = await supabase.rpc('crm_search_tags', { p_selected: selected, p_kind: kind, p_search: search, p_offset: offset, p_limit: 30 });
 if (error) throw error;
 return data as TagSearchResult;
}
export async function entityTagBatch(entities: { type: TagEntity; id: string }[]): Promise<EntityTagRow[]> {
 const { data, error } = await supabase.rpc('crm_entity_tag_batch', { p_entities: entities });
 if (error) throw error;
 return data as EntityTagRow[];
}
export function tagError(error: unknown) {
 const issue = error as { code?: string; message?: string };
 if (['PGRST202','PGRST205','42P01'].includes(issue?.code || '')) return 'Etiket sistemi için veritabanı güncellemesi henüz uygulanmadı.';
 return 'Etiketler yüklenemedi. Bağlantınızı kontrol ederek yeniden deneyin.';
}
export async function addCustomTag(type: TagEntity, id: string, name: string) {
 const { data: auth, error: authError } = await supabase.auth.getUser();
 if (authError || !auth.user) throw new Error('Oturum gerekli');
 const clean = name.trim().replace(/\s+/g, ' ');
 if (!clean || clean.length > 60) throw new Error('Etiket 1–60 karakter olmalı.');
 // Database normalization owns uniqueness, including races between browser tabs.
 const { data: normalized, error: normalizationError } = await supabase.rpc('crm_normalize_label', { value: clean });
 if (normalizationError) throw normalizationError;
 let { data: existing, error } = await supabase.from('crm_tags').select('id').eq('user_id', auth.user.id).eq('normalized_name', normalized).maybeSingle();
 if (error) throw error;
 if (!existing) {
  const inserted = await supabase.from('crm_tags').insert({ name: clean, user_id: auth.user.id }).select('id').single();
  if (inserted.error?.code === '23505') {
   const retry = await supabase.from('crm_tags').select('id').eq('user_id', auth.user.id).eq('normalized_name', normalized).single();
   if (retry.error) throw retry.error; existing = retry.data;
  } else { if (inserted.error) throw inserted.error; existing = inserted.data; }
 }
 const result = await supabase.from('crm_tag_links').insert({ tag_id: existing.id, entity_type: type, entity_id: id, user_id: auth.user.id });
 if (result.error && result.error.code !== '23505') throw result.error;
 window.dispatchEvent(new Event('crm-tags-changed'));
}
export async function removeCustomTag(type: TagEntity, id: string, key: string) {
 const { error } = await supabase.from('crm_tag_links').delete().eq('entity_type', type).eq('entity_id', id).eq('tag_id', key.slice('custom:'.length));
 if (error) throw error;
 window.dispatchEvent(new Event('crm-tags-changed'));
}
