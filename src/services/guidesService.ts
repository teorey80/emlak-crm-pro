// =====================================================
// guidesService — Site Yönetimi / Rehberler (Blog)
// =====================================================
// ademaslan.com/rehberler altında yayınlanan rehber/blog yazıları için CRUD servisi.
// Tablo: guides (migration 39). Desen: projectReviewsService ile birebir aynı.
//
// Kullanım:
//   import { guidesService } from '../services/guidesService';
//   const guides = await guidesService.list();
//   await guidesService.create({ slug: 'enerji-kimlik-belgesi-sorgulama', title: '...', category: 'bilgi', ... });

import { supabase } from './supabaseClient';

export type GuideCategory = 'bilgi' | 'bolge' | 'alici' | 'soru-cevap';

export interface Guide {
    id: string;
    user_id: string;

    // URL ve sınıflandırma
    slug: string;
    category: GuideCategory;
    title: string;
    subtitle?: string;
    district?: string;

    // Medya
    cover_image_url?: string;
    video_url?: string;
    gallery?: Array<{ url: string; caption?: string }>;

    // İçerik
    quick_answer?: string;
    tldr?: string[];
    body?: string;
    related_links?: Array<{ label: string; url: string }>;
    faqs?: Array<{ q: string; a: string }>;

    // SEO
    meta_description?: string;
    read_minutes?: number;

    // Durum
    published?: boolean;

    // Sistem
    created_at?: string;
    updated_at?: string;
}

class GuidesService {
    /** Sahibinin tüm rehberlerini listeler */
    async list(): Promise<Guide[]> {
        const { data, error } = await supabase
            .from('guides')
            .select('*')
            .order('updated_at', { ascending: false });
        if (error) throw error;
        return (data || []) as Guide[];
    }

    /** Tek bir kayıt — slug ile */
    async getBySlug(slug: string): Promise<Guide | null> {
        const { data, error } = await supabase
            .from('guides')
            .select('*')
            .eq('slug', slug)
            .maybeSingle();
        if (error) throw error;
        return data as Guide | null;
    }

    /** Tek bir kayıt — id ile */
    async getById(id: string): Promise<Guide | null> {
        const { data, error } = await supabase
            .from('guides')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error) throw error;
        return data as Guide | null;
    }

    /** Yeni rehber oluşturur — user_id otomatik atanır */
    async create(payload: Partial<Guide>): Promise<Guide> {
        const { data: userResult } = await supabase.auth.getUser();
        const userId = userResult?.user?.id;
        if (!userId) throw new Error('Oturum açık değil');

        const row = { ...payload, user_id: userId } as Guide;
        const { data, error } = await supabase
            .from('guides')
            .insert([row])
            .select()
            .single();
        if (error) throw error;
        return data as Guide;
    }

    /** Mevcut kaydı günceller */
    async update(id: string, payload: Partial<Guide>): Promise<Guide> {
        const { data, error } = await supabase
            .from('guides')
            .update(payload)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data as Guide;
    }

    /** Yayın durumunu toggle eder (Yayınla / Taslağa al) */
    async togglePublish(id: string, published: boolean): Promise<Guide> {
        return this.update(id, { published });
    }

    /** Kaydı siler */
    async remove(id: string): Promise<void> {
        const { error } = await supabase.from('guides').delete().eq('id', id);
        if (error) throw error;
    }
}

export const guidesService = new GuidesService();
