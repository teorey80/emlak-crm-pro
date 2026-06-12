-- SEPARATE COMMISSION FIELDS FOR BUYER AND SELLER
-- Alıcıdan ve Satıcıdan ayrı ayrı komisyon takibi
-- Tarih: 2026-02-03

-- 1. Sales tablosuna yeni komisyon kolonları ekle
ALTER TABLE sales ADD COLUMN IF NOT EXISTS buyer_commission_amount NUMERIC DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS buyer_commission_rate NUMERIC DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS seller_commission_amount NUMERIC DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS seller_commission_rate NUMERIC DEFAULT 0;

-- 2. Mevcut verileri güncelle (eski commission_amount'u seller'a ata)
UPDATE sales
SET seller_commission_amount = COALESCE(commission_amount, 0),
    seller_commission_rate = COALESCE(commission_rate, 0),
    buyer_commission_amount = 0,
    buyer_commission_rate = 0
WHERE seller_commission_amount IS NULL OR seller_commission_amount = 0;

-- 3. Doğrulama
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count FROM sales WHERE seller_commission_amount > 0;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'AYRI KOMİSYON ALANLARI EKLENDİ';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Yeni alanlar:';
  RAISE NOTICE '  - buyer_commission_amount: Alıcıdan alınan tutar';
  RAISE NOTICE '  - buyer_commission_rate: Alıcı komisyon oranı';
  RAISE NOTICE '  - seller_commission_amount: Satıcıdan alınan tutar';
  RAISE NOTICE '  - seller_commission_rate: Satıcı komisyon oranı';
  RAISE NOTICE 'Güncellenen kayıt: %', updated_count;
  RAISE NOTICE '========================================';
END $$;

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
