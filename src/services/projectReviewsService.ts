// =====================================================
// projectReviewsService — Site Yönetimi / Proje İncelemeleri
// =====================================================
// ademaslan.com'da yayınlanan proje incelemeleri için CRUD servisi.
// Tablo: project_reviews (migration 38).
//
// Kullanım:
//   import { projectReviewsService } from '../services/projectReviewsService';
//   const projects = await projectReviewsService.list();
//   await projectReviewsService.create({ slug: 'birbahce-evleri', title: '...', ... });

import { supabase } from './supabaseClient';

export interface ProjectReview {
    id: string;
    user_id: string;

    // Temel
    slug: string;
    title: string;
    developer?: string;

    // Lokasyon
    district?: string;
    neighborhood?: string;

    // Veri
    status_tag?: 'hazir' | 'insaat' | 'yeni';
    delivery_date?: string;
    price_range?: string;
    unit_types?: string;
    dues_info?: string;

    // Medya
    hero_image_url?: string;
    gallery?: Array<{ url: string; caption?: string }>;
    video_url?: string;

    // Sahibinden.com proje ilan listesi linki — haftalık otomatik
    // fiyat takibi (sahibinden-ilan-takip görevi) bu linki okur
    sahibinden_url?: string;

    // İçerik
    quick_answer?: string;
    location_intro?: string;
    distances?: Array<{ label: string; value: string; percent?: number }>;
    units_table?: Array<{ tip: string; ozellik?: string; profil?: string; stok?: string }>;
    description?: string;
    pros?: string[];
    cons?: string[];
    target_profile?: Array<{ icon?: string; title: string; text: string; fit?: boolean }>;
    investment_notes?: string;
    investment_stats?: Array<{ n: string; l: string }>;
    payment_plan?: Array<{ step: string; label: string; sublabel?: string; pct: string }>;
    post_delivery?: string;
    adem_opinion?: string;
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

class ProjectReviewsService {
    /** Sahibinin tüm proje incelemelerini listeler */
    async list(): Promise<ProjectReview[]> {
        const { data, error } = await supabase
            .from('project_reviews')
            .select('*')
            .order('updated_at', { ascending: false });
        if (error) throw error;
        return (data || []) as ProjectReview[];
    }

    /** Tek bir kayıt — slug veya id ile */
    async getBySlug(slug: string): Promise<ProjectReview | null> {
        const { data, error } = await supabase
            .from('project_reviews')
            .select('*')
            .eq('slug', slug)
            .maybeSingle();
        if (error) throw error;
        return data as ProjectReview | null;
    }

    async getById(id: string): Promise<ProjectReview | null> {
        const { data, error } = await supabase
            .from('project_reviews')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error) throw error;
        return data as ProjectReview | null;
    }

    /** Yeni proje incelemesi oluşturur — user_id otomatik atanır */
    async create(payload: Partial<ProjectReview>): Promise<ProjectReview> {
        const { data: userResult } = await supabase.auth.getUser();
        const userId = userResult?.user?.id;
        if (!userId) throw new Error('Oturum açık değil');

        const row = { ...payload, user_id: userId } as ProjectReview;
        const { data, error } = await supabase
            .from('project_reviews')
            .insert([row])
            .select()
            .single();
        if (error) throw error;
        return data as ProjectReview;
    }

    /** Mevcut kaydı günceller */
    async update(id: string, payload: Partial<ProjectReview>): Promise<ProjectReview> {
        const { data, error } = await supabase
            .from('project_reviews')
            .update(payload)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data as ProjectReview;
    }

    /** Yayın durumunu toggle eder (Yayınla / Taslağa al) */
    async togglePublish(id: string, published: boolean): Promise<ProjectReview> {
        return this.update(id, { published });
    }

    /** Kaydı siler */
    async remove(id: string): Promise<void> {
        const { error } = await supabase.from('project_reviews').delete().eq('id', id);
        if (error) throw error;
    }
}

export const projectReviewsService = new ProjectReviewsService();
