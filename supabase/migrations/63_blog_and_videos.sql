-- Migration: Blog yazıları ve YouTube videoları tabloları
-- Tarih: 2026-03-14

-- ─── Blog Yazıları ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  office_id uuid,
  title text NOT NULL,
  slug text,
  summary text,
  content text,
  cover_image_url text,
  tags text[] DEFAULT '{}',
  published boolean DEFAULT false,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Slug otomatik güncelleme
CREATE OR REPLACE FUNCTION update_blog_post_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(replace(regexp_replace(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'), ' ', '-'));
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_post_before_insert_update
  BEFORE INSERT OR UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_blog_post_slug();

-- RLS: Sadece kendi yazılarını görebilir/değiştirebilir
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_posts_owner" ON public.blog_posts
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "blog_posts_public_read" ON public.blog_posts
  FOR SELECT USING (published = true);

-- ─── YouTube Videoları ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.youtube_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  office_id uuid,
  title text NOT NULL,
  youtube_url text NOT NULL,
  youtube_id text,                    -- URL'den çıkarılan video ID
  description text,
  published boolean DEFAULT false,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.youtube_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "youtube_videos_owner" ON public.youtube_videos
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "youtube_videos_public_read" ON public.youtube_videos
  FOR SELECT USING (published = true);

-- ─── İndeksler ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_blog_posts_user_id ON public.blog_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts(published);
CREATE INDEX IF NOT EXISTS idx_youtube_videos_user_id ON public.youtube_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_youtube_videos_display_order ON public.youtube_videos(display_order);
