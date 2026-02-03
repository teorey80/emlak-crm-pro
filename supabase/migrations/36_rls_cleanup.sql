-- RLS CLEANUP & FIX
-- Sorun: Eski politikalar (customers_select_policy vb.) silinmediği için "OR" mantığıyla veriyi sızdırıyor.
-- Çözüm: Çakışan tüm eski politikaları ismen sil ve sadece strictly owner politikasını bırak.

-- =====================================================
-- 1. CUSTOMERS TEMİZLİK
-- =====================================================

-- Önce eski politikaları kaldır
DROP POLICY IF EXISTS "customers_select_policy" ON customers;
DROP POLICY IF EXISTS "customers_insert_policy" ON customers;
DROP POLICY IF EXISTS "customers_update_policy" ON customers;
DROP POLICY IF EXISTS "customers_delete_policy" ON customers;

-- Varsa diğer olası eski isimleri de kaldır
DROP POLICY IF EXISTS "customers_select" ON customers;
DROP POLICY IF EXISTS "customers_office_select" ON customers;
DROP POLICY IF EXISTS "Customers Select Own" ON customers;
DROP POLICY IF EXISTS "View Office Customers" ON customers;

-- Bizim doğru politikamızın var olduğundan emin ol (Yoksa oluştur)
-- (Zaten 35 nolu migration ile oluşturulduysa hata vermez, 'IF NOT EXISTS' policy için native desteklenmeyebilir, bu yüzden drop-create yaparız)

DROP POLICY IF EXISTS "customers_owner_only_select" ON customers;
CREATE POLICY "customers_owner_only_select" ON customers
FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "customers_owner_only_insert" ON customers;
CREATE POLICY "customers_owner_only_insert" ON customers
FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "customers_owner_only_update" ON customers;
CREATE POLICY "customers_owner_only_update" ON customers
FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "customers_owner_only_delete" ON customers;
CREATE POLICY "customers_owner_only_delete" ON customers
FOR DELETE USING (user_id = auth.uid());


-- =====================================================
-- 2. ACTIVITIES TEMİZLİK
-- =====================================================

DROP POLICY IF EXISTS "activities_select_policy" ON activities;
DROP POLICY IF EXISTS "activities_insert_policy" ON activities;
DROP POLICY IF EXISTS "activities_update_policy" ON activities;
DROP POLICY IF EXISTS "activities_delete_policy" ON activities;

DROP POLICY IF EXISTS "activities_select" ON activities;
DROP POLICY IF EXISTS "activities_office_select" ON activities;

-- Doğru politikaları yeniden oluştur
DROP POLICY IF EXISTS "activities_owner_only_select" ON activities;
CREATE POLICY "activities_owner_only_select" ON activities
FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "activities_owner_only_insert" ON activities;
CREATE POLICY "activities_owner_only_insert" ON activities
FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "activities_owner_only_update" ON activities;
CREATE POLICY "activities_owner_only_update" ON activities
FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "activities_owner_only_delete" ON activities;
CREATE POLICY "activities_owner_only_delete" ON activities
FOR DELETE USING (user_id = auth.uid());

-- Doğrulama mesajı
DO $$
BEGIN
  RAISE NOTICE 'Eski RLS politikaları temizlendi ve Strict kurallar tekrar uygulandı.';
END $$;
