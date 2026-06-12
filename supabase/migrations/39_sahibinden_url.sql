-- =====================================================
-- 39: project_reviews — sahibinden ilan listesi linki
-- =====================================================
-- Panelde girilen sahibinden.com proje ilan listesi URL'si.
-- "sahibinden-ilan-takip" zamanlanmış görevi her hafta bu linki
-- okuyup ilan istatistiklerini investment_stats alanına yazar.
-- NOT: Bu migration 11.06.2026'da Supabase MCP ile prod'a uygulandı.

ALTER TABLE project_reviews ADD COLUMN IF NOT EXISTS sahibinden_url text;

COMMENT ON COLUMN project_reviews.sahibinden_url IS
  'Sahibinden.com proje ilan listesi URL''si — haftalık otomatik fiyat takibi bu linki kullanır';
