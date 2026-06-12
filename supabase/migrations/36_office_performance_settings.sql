-- OFFICE PERFORMANCE SETTINGS
-- Broker'ların danışman performans görünürlüğünü kontrol etmesi için
-- Tarih: 2026-02-03

-- 1. Offices tablosuna performance_settings JSONB kolonu ekle
ALTER TABLE offices ADD COLUMN IF NOT EXISTS performance_settings JSONB DEFAULT '{
  "showTeamPerformance": true,
  "showTeamSales": true,
  "showTeamCommissions": false,
  "showTeamTargets": true,
  "showPerformanceRanking": true
}'::jsonb;

-- 2. Mevcut ofislere varsayılan ayarları uygula
UPDATE offices
SET performance_settings = '{
  "showTeamPerformance": true,
  "showTeamSales": true,
  "showTeamCommissions": false,
  "showTeamTargets": true,
  "showPerformanceRanking": true
}'::jsonb
WHERE performance_settings IS NULL;

-- 3. Doğrulama
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'OFFICE PERFORMANCE SETTINGS EKLENDİ';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Ayarlar:';
  RAISE NOTICE '  - showTeamPerformance: Performans görünürlüğü';
  RAISE NOTICE '  - showTeamSales: Satış rakamları';
  RAISE NOTICE '  - showTeamCommissions: Komisyonlar';
  RAISE NOTICE '  - showTeamTargets: Hedef ilerleme';
  RAISE NOTICE '  - showPerformanceRanking: Sıralama';
  RAISE NOTICE '========================================';
END $$;

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
