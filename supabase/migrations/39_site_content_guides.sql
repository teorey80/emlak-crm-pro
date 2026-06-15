-- =====================================================
-- Migration 39: Site Yönetimi — Rehberler / Blog
-- =====================================================
-- ademaslan.com/rehberler/[slug] sayfalarını besleyen tablo.
-- CRM'in "Site Yönetimi → Rehberler" panelinden yönetilir.
-- Tek esnek içerik tipi; category alanı ile dört türü kapsar:
--   'bilgi'      -> Bilgi Rehberi (EKB, tapu masrafları, kredi vb. how-to)
--   'bolge'      -> Bölge Rehberi (Alemdağ, Nişantepe vb.)
--   'alici'      -> Alıcı Rehberi (ilk ev alma kılavuzu vb.)
--   'soru-cevap' -> Soru-Cevap
-- RLS:
--   - Sahibi (Adem) her zaman erişir
--   - Anonim kullanıcılar SADECE published=true olanları okur
-- Tarih: 2026-06-15
-- Not: Desen migration 38 (project_reviews) ile birebir aynıdır.

CREATE TABLE IF NOT EXISTS guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- URL ve sınıflandırma
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'bilgi',  -- 'bilgi' | 'bolge' | 'alici' | 'soru-cevap'
  title TEXT NOT NULL,
  subtitle TEXT,                            -- kısa alt başlık / özet (kart ve giriş)
  district TEXT,                            -- bölge rehberinde ilçe/mahalle (opsiyonel)

  -- Medya
  cover_image_url TEXT,
  video_url TEXT,                           -- YouTube watch/embed URL
  gallery JSONB DEFAULT '[]'::jsonb,        -- [{ url, caption }, ...]

  -- İçerik
  quick_answer TEXT,                        -- Hızlı cevap / TL;DR kutusu (AI alıntılar)
  tldr JSONB DEFAULT '[]'::jsonb,           -- ["madde 1", "madde 2", ...]
  body TEXT,                                -- ana içerik (HTML veya markdown)
  related_links JSONB DEFAULT '[]'::jsonb,  -- [{ label, url }, ...] iç bağlantılar
  faqs JSONB DEFAULT '[]'::jsonb,           -- [{ q, a }, ...]

  -- SEO
  meta_description TEXT,
  read_minutes INTEGER DEFAULT 5,

  -- Durum
  published BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_guides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS guides_updated_at_trigger ON guides;
CREATE TRIGGER guides_updated_at_trigger
BEFORE UPDATE ON guides
FOR EACH ROW EXECUTE FUNCTION update_guides_updated_at();

-- Indexler
CREATE INDEX IF NOT EXISTS idx_guides_slug ON guides(slug);
CREATE INDEX IF NOT EXISTS idx_guides_user ON guides(user_id);
CREATE INDEX IF NOT EXISTS idx_guides_category ON guides(category);
CREATE INDEX IF NOT EXISTS idx_guides_published ON guides(published) WHERE published = true;

-- RLS
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "guides_owner_full_access" ON guides;
CREATE POLICY "guides_owner_full_access" ON guides
FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "guides_public_read_published" ON guides;
CREATE POLICY "guides_public_read_published" ON guides
FOR SELECT USING (published = true);

-- Yorum
COMMENT ON TABLE guides IS 'ademaslan.com /rehberler/[slug] sayfalarını besleyen rehber/blog tablosu (bilgi, bölge, alıcı, soru-cevap). Site Yönetimi panelinden yönetilir.';
