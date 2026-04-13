-- ============================================
-- Müşteri Otomatik Pasifleştirme Sistemi
-- ============================================
-- customerType bazlı pasifleştirme süreleri:
--   - Kiracı Adayı: 1 ay (30 gün)
--   - Alıcı / Alıcı Adayı: 1 yıl (365 gün)
--   - Mal Sahibi: hiç pasife düşmez
--   - Diğer tipler: 60 gün (varsayılan)
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
    SELECT MAX(date::timestamp with time zone) INTO last_activity
    FROM activities
    WHERE "customerId" = customer_uuid::text
       OR customer_id = customer_uuid::text;

    IF last_activity IS NULL THEN
        SELECT COALESCE("createdAt"::timestamp with time zone, created_at) INTO customer_created
        FROM customers
        WHERE id = customer_uuid;
        RETURN customer_created;
    END IF;

    RETURN last_activity;
END;
$$ LANGUAGE plpgsql;

-- 2. customerType bazlı pasifleştirme süresini döndüren fonksiyon
CREATE OR REPLACE FUNCTION get_passivation_interval(cust_type TEXT)
RETURNS INTERVAL AS $$
BEGIN
    IF cust_type = 'Kiracı Adayı' THEN
        RETURN INTERVAL '30 days';
    ELSIF cust_type IN ('Alıcı', 'Alıcı Adayı') THEN
        RETURN INTERVAL '365 days';
    ELSIF cust_type = 'Mal Sahibi' THEN
        RETURN NULL;
    ELSE
        RETURN INTERVAL '60 days';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. Pasifleştirme fonksiyonu (customerType bazlı)
CREATE OR REPLACE FUNCTION auto_passivate_customers()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    WITH customers_to_passivate AS (
        SELECT c.id
        FROM customers c
        WHERE c.status != 'Pasif'
          AND c."customerType" != 'Mal Sahibi'
          AND get_passivation_interval(c."customerType") IS NOT NULL
          AND get_customer_last_activity(c.id) < NOW() - get_passivation_interval(c."customerType")
    )
    UPDATE customers
    SET status = 'Pasif',
        updated_at = NOW()
    WHERE id IN (SELECT id FROM customers_to_passivate);

    GET DIAGNOSTICS updated_count = ROW_COUNT;

    RAISE NOTICE 'Auto-passivated % customers', updated_count;

    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- 4. Günlük otomatik çalıştırma için cron job (pg_cron gerektirir)
SELECT cron.unschedule('auto-passivate-customers')
WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'auto-passivate-customers'
);

SELECT cron.schedule(
    'auto-passivate-customers',
    '0 0 * * *',
    $$SELECT auto_passivate_customers()$$
);

-- ============================================
-- ALTERNATIF: Manuel Çalıştırma
-- ============================================
-- SELECT auto_passivate_customers();
-- ============================================

-- 5. Test: Pasifleştirilecek müşterileri listele (DRY RUN)
-- SELECT
--     c.id,
--     c.name,
--     c."customerType",
--     c.status,
--     get_customer_last_activity(c.id) as last_activity,
--     get_passivation_interval(c."customerType") as passivation_threshold
-- FROM customers c
-- WHERE c.status != 'Pasif'
--   AND c."customerType" != 'Mal Sahibi'
--   AND get_passivation_interval(c."customerType") IS NOT NULL
--   AND get_customer_last_activity(c.id) < NOW() - get_passivation_interval(c."customerType");
