-- ============================================
-- Müşteri Otomatik Pasifleştirme Sistemi
-- ============================================
-- Bu migration, 60 gün aktivite olmayan müşterileri
-- otomatik olarak "Pasif" durumuna geçirir.
--
-- KULLANIM:
-- 1. Bu SQL'i Supabase SQL Editor'da çalıştırın
-- 2. pg_cron extension'ını etkinleştirmek için
--    Supabase Dashboard > Database > Extensions > pg_cron'u etkinleştirin
-- ============================================

-- 1. Müşteri son aktivite tarihini hesaplayan fonksiyon
CREATE OR REPLACE FUNCTION get_customer_last_activity(customer_uuid UUID)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
    last_activity TIMESTAMP WITH TIME ZONE;
    customer_created TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get the most recent activity date for this customer
    SELECT MAX(date::timestamp with time zone) INTO last_activity
    FROM activities
    WHERE "customerId" = customer_uuid::text
       OR customer_id = customer_uuid::text;

    -- If no activities, use customer creation date
    IF last_activity IS NULL THEN
        SELECT COALESCE("createdAt"::timestamp with time zone, created_at) INTO customer_created
        FROM customers
        WHERE id = customer_uuid;
        RETURN customer_created;
    END IF;

    RETURN last_activity;
END;
$$ LANGUAGE plpgsql;

-- 2. Pasifleştirme fonksiyonu
CREATE OR REPLACE FUNCTION auto_passivate_customers()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Update customers who:
    -- 1. Are not already Pasif
    -- 2. Have no activity in the last 60 days
    WITH customers_to_passivate AS (
        SELECT c.id
        FROM customers c
        WHERE c.status != 'Pasif'
          AND get_customer_last_activity(c.id) < NOW() - INTERVAL '60 days'
    )
    UPDATE customers
    SET status = 'Pasif',
        updated_at = NOW()
    WHERE id IN (SELECT id FROM customers_to_passivate);

    GET DIAGNOSTICS updated_count = ROW_COUNT;

    -- Log the operation
    RAISE NOTICE 'Auto-passivated % customers', updated_count;

    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- 3. Günlük otomatik çalıştırma için cron job (pg_cron gerektirir)
-- Not: Supabase'de pg_cron extension'ını etkinleştirmeniz gerekir
-- Dashboard > Database > Extensions > pg_cron

-- Önce eski job'ı kaldır (varsa)
SELECT cron.unschedule('auto-passivate-customers')
WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'auto-passivate-customers'
);

-- Her gün gece yarısı (00:00 UTC) çalışacak job
SELECT cron.schedule(
    'auto-passivate-customers',  -- job name
    '0 0 * * *',                  -- cron expression: midnight every day
    $$SELECT auto_passivate_customers()$$
);

-- ============================================
-- ALTERNATIF: Manuel Çalıştırma
-- ============================================
-- Eğer pg_cron kullanmak istemezseniz,
-- aşağıdaki sorguyu manuel olarak çalıştırabilirsiniz:
--
-- SELECT auto_passivate_customers();
-- ============================================

-- 4. Test: Şu an pasifleştirilmesi gereken müşterileri listele (DRY RUN)
-- SELECT
--     c.id,
--     c.name,
--     c.status,
--     get_customer_last_activity(c.id) as last_activity,
--     NOW() - get_customer_last_activity(c.id) as days_since_activity
-- FROM customers c
-- WHERE c.status != 'Pasif'
--   AND get_customer_last_activity(c.id) < NOW() - INTERVAL '60 days';
