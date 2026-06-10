-- =====================================================
-- Migration 38: Site Yönetimi — Proje İncelemeleri
-- =====================================================
-- ademaslan.com'daki /projeler/[slug] sayfalarını besleyen tablo.
-- CRM'in "Site Yönetimi → Proje İncelemeleri" panelinden yönetilir.
-- RLS:
--   - Sahibi (Adem) her zaman erişir
--   - Anonim kullanıcılar SADECE published=true olanları okur
-- Tarih: 2026-06-10

CREATE TABLE IF NOT EXISTS project_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- URL ve temel kimlik
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  developer TEXT,                  -- "Birleşim Grup", "Nef", "Emlak Konut"

  -- Lokasyon
  district TEXT,                   -- "Çekmeköy"
  neighborhood TEXT,               -- "Alemdağ Ormanı yanı"

  -- Temel veri
  status_tag TEXT DEFAULT 'hazir', -- 'hazir' | 'insaat' | 'yeni'
  delivery_date TEXT,              -- "2020 (Oturulan)", "Q2 2027"
  price_range TEXT,                -- "İletişim" veya "6,2–13 M ₺"
  unit_types TEXT,                 -- "1+1 · 2+1 · 3+1 · 4+1 · 5+1"
  dues_info TEXT,                  -- "Orta-üst bant" veya "2.400 ₺"

  -- Medya
  hero_image_url TEXT,
  gallery JSONB DEFAULT '[]'::jsonb,    -- [{ url, caption }, ...]
  video_url TEXT,                       -- YouTube embed URL veya watch URL

  -- İçerik bölümleri
  quick_answer TEXT,
  location_intro TEXT,
  distances JSONB DEFAULT '[]'::jsonb,
  units_table JSONB DEFAULT '[]'::jsonb,
  description TEXT,
  pros JSONB DEFAULT '[]'::jsonb,
  cons JSONB DEFAULT '[]'::jsonb,
  target_profile JSONB DEFAULT '[]'::jsonb,
  investment_notes TEXT,
  investment_stats JSONB DEFAULT '[]'::jsonb,
  payment_plan JSONB DEFAULT '[]'::jsonb,
  post_delivery TEXT,
  adem_opinion TEXT,
  faqs JSONB DEFAULT '[]'::jsonb,

  -- SEO
  meta_description TEXT,
  read_minutes INTEGER DEFAULT 10,

  -- Durum
  published BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_project_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS project_reviews_updated_at_trigger ON project_reviews;
CREATE TRIGGER project_reviews_updated_at_trigger
BEFORE UPDATE ON project_reviews
FOR EACH ROW EXECUTE FUNCTION update_project_reviews_updated_at();

-- Indexler
CREATE INDEX IF NOT EXISTS idx_project_reviews_slug ON project_reviews(slug);
CREATE INDEX IF NOT EXISTS idx_project_reviews_user ON project_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_project_reviews_published ON project_reviews(published) WHERE published = true;

-- RLS
ALTER TABLE project_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_reviews_owner_full_access" ON project_reviews;
CREATE POLICY "project_reviews_owner_full_access" ON project_reviews
FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "project_reviews_public_read_published" ON project_reviews;
CREATE POLICY "project_reviews_public_read_published" ON project_reviews
FOR SELECT USING (published = true);

-- Yorum
COMMENT ON TABLE project_reviews IS 'ademaslan.com /projeler/[slug] sayfalarını besleyen proje incelemeleri tablosu. Site Yönetimi panelinden yönetilir.';
