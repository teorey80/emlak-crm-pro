-- SECURE RLS POLICIES
-- Güvenli veri izolasyonu: Her kullanıcı sadece kendi/ofisinin verilerini görür
-- Tarih: 2026-02-02

-- =====================================================
-- ÖNEMLİ: Bu migration RLS'i AÇIK tutar ve güvenli politikalar oluşturur
-- =====================================================

-- =====================================================
-- ADIM 1: RLS'İ AKTİF ET (eğer kapalıysa)
-- =====================================================

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ADIM 2: TÜM ESKİ POLİTİKALARI TEMİZLE
-- =====================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  -- Drop all existing policies on our tables
  FOR r IN (
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN ('properties', 'customers', 'activities', 'requests',
                      'profiles', 'sales', 'sites', 'offices',
                      'subscriptions', 'plan_limits', 'admin_users')
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- =====================================================
-- ADIM 3: YARDIMCI FONKSİYON - Kullanıcının office_id'sini al
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_office_id()
RETURNS UUID AS $$
  SELECT office_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- =====================================================
-- ADIM 4: PROFILES POLİTİKALARI
-- =====================================================

-- SELECT: Kendi profili + ofis arkadaşları + public site profilleri
CREATE POLICY "profiles_select_policy" ON profiles FOR SELECT USING (
  id = auth.uid()  -- Kendi profilim
  OR
  (office_id IS NOT NULL AND office_id = get_user_office_id())  -- Ofis arkadaşları
  OR
  (site_config IS NOT NULL AND (site_config->>'isActive')::boolean = true)  -- Public site
);

-- INSERT: Sadece kendi ID'si ile
CREATE POLICY "profiles_insert_policy" ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- UPDATE: Sadece kendi profili
CREATE POLICY "profiles_update_policy" ON profiles FOR UPDATE
  USING (id = auth.uid());

-- DELETE: Sadece kendi profili (genelde kullanılmaz)
CREATE POLICY "profiles_delete_policy" ON profiles FOR DELETE
  USING (id = auth.uid());

-- =====================================================
-- ADIM 5: PROPERTIES POLİTİKALARI
-- =====================================================

-- SELECT: Kendi kayıtları + ofis kayıtları + public
CREATE POLICY "properties_select_policy" ON properties FOR SELECT USING (
  user_id = auth.uid()  -- Benim kayıtlarım
  OR
  (office_id IS NOT NULL AND office_id = get_user_office_id())  -- Ofis kayıtları
  OR
  COALESCE("publishedOnPersonalSite", false) = true  -- Public site
  OR
  COALESCE("publishedOnMarketplace", false) = true  -- Marketplace
);

-- INSERT: user_id kendisi olmalı
CREATE POLICY "properties_insert_policy" ON properties FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Kendi kayıtları veya ofis kayıtları
CREATE POLICY "properties_update_policy" ON properties FOR UPDATE USING (
  user_id = auth.uid()
  OR
  (office_id IS NOT NULL AND office_id = get_user_office_id())
);

-- DELETE: Kendi kayıtları veya ofis kayıtları
CREATE POLICY "properties_delete_policy" ON properties FOR DELETE USING (
  user_id = auth.uid()
  OR
  (office_id IS NOT NULL AND office_id = get_user_office_id())
);

-- =====================================================
-- ADIM 6: CUSTOMERS POLİTİKALARI
-- =====================================================

CREATE POLICY "customers_select_policy" ON customers FOR SELECT USING (
  user_id = auth.uid()
  OR
  (office_id IS NOT NULL AND office_id = get_user_office_id())
);

CREATE POLICY "customers_insert_policy" ON customers FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "customers_update_policy" ON customers FOR UPDATE USING (
  user_id = auth.uid()
  OR
  (office_id IS NOT NULL AND office_id = get_user_office_id())
);

CREATE POLICY "customers_delete_policy" ON customers FOR DELETE USING (
  user_id = auth.uid()
  OR
  (office_id IS NOT NULL AND office_id = get_user_office_id())
);

-- =====================================================
-- ADIM 7: ACTIVITIES POLİTİKALARI
-- =====================================================

CREATE POLICY "activities_select_policy" ON activities FOR SELECT USING (
  user_id = auth.uid()
  OR
  (office_id IS NOT NULL AND office_id = get_user_office_id())
);

CREATE POLICY "activities_insert_policy" ON activities FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "activities_update_policy" ON activities FOR UPDATE USING (
  user_id = auth.uid()
  OR
  (office_id IS NOT NULL AND office_id = get_user_office_id())
);

CREATE POLICY "activities_delete_policy" ON activities FOR DELETE USING (
  user_id = auth.uid()
  OR
  (office_id IS NOT NULL AND office_id = get_user_office_id())
);

-- =====================================================
-- ADIM 8: REQUESTS POLİTİKALARI
-- =====================================================

CREATE POLICY "requests_select_policy" ON requests FOR SELECT USING (
  user_id = auth.uid()
  OR
  (office_id IS NOT NULL AND office_id = get_user_office_id())
);

CREATE POLICY "requests_insert_policy" ON requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "requests_update_policy" ON requests FOR UPDATE USING (
  user_id = auth.uid()
  OR
  (office_id IS NOT NULL AND office_id = get_user_office_id())
);

CREATE POLICY "requests_delete_policy" ON requests FOR DELETE USING (
  user_id = auth.uid()
  OR
  (office_id IS NOT NULL AND office_id = get_user_office_id())
);

-- =====================================================
-- ADIM 9: SALES POLİTİKALARI
-- =====================================================

CREATE POLICY "sales_select_policy" ON sales FOR SELECT USING (
  user_id = auth.uid()
  OR
  (office_id IS NOT NULL AND office_id = get_user_office_id())
);

CREATE POLICY "sales_insert_policy" ON sales FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "sales_update_policy" ON sales FOR UPDATE USING (
  user_id = auth.uid()
  OR
  (office_id IS NOT NULL AND office_id = get_user_office_id())
);

CREATE POLICY "sales_delete_policy" ON sales FOR DELETE USING (
  user_id = auth.uid()
  OR
  (office_id IS NOT NULL AND office_id = get_user_office_id())
);

-- =====================================================
-- ADIM 10: SITES POLİTİKALARI (Konut Siteleri)
-- =====================================================

CREATE POLICY "sites_select_policy" ON sites FOR SELECT USING (
  user_id = auth.uid()
  OR
  (office_id IS NOT NULL AND office_id = get_user_office_id())
  OR
  user_id IS NULL  -- Genel siteler
);

CREATE POLICY "sites_insert_policy" ON sites FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "sites_update_policy" ON sites FOR UPDATE USING (
  user_id = auth.uid()
  OR
  (office_id IS NOT NULL AND office_id = get_user_office_id())
  OR
  user_id IS NULL
);

CREATE POLICY "sites_delete_policy" ON sites FOR DELETE USING (
  user_id = auth.uid()
  OR
  (office_id IS NOT NULL AND office_id = get_user_office_id())
);

-- =====================================================
-- ADIM 11: OFFICES POLİTİKALARI
-- =====================================================

CREATE POLICY "offices_select_policy" ON offices FOR SELECT USING (
  id = get_user_office_id()  -- Kendi ofisin
  OR
  owner_id = auth.uid()  -- Sahibi olduğun ofis
  OR
  (site_config IS NOT NULL AND (site_config->>'isActive')::boolean = true)  -- Public site
);

CREATE POLICY "offices_insert_policy" ON offices FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "offices_update_policy" ON offices FOR UPDATE USING (
  owner_id = auth.uid()
  OR
  (id = get_user_office_id() AND EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'broker'
  ))
);

CREATE POLICY "offices_delete_policy" ON offices FOR DELETE USING (
  owner_id = auth.uid()
);

-- =====================================================
-- ADIM 12: SUBSCRIPTIONS POLİTİKALARI
-- =====================================================

CREATE POLICY "subscriptions_select_policy" ON subscriptions FOR SELECT USING (
  user_id = auth.uid()
  OR
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

CREATE POLICY "subscriptions_admin_all" ON subscriptions FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

-- =====================================================
-- ADIM 13: PLAN_LIMITS - Herkes okuyabilir
-- =====================================================

CREATE POLICY "plan_limits_select_policy" ON plan_limits FOR SELECT USING (true);

-- =====================================================
-- ADIM 14: ADMIN_USERS - Herkes okuyabilir (admin kontrolü için)
-- =====================================================

CREATE POLICY "admin_users_select_policy" ON admin_users FOR SELECT USING (true);

CREATE POLICY "admin_users_admin_all" ON admin_users FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

-- =====================================================
-- ADIM 15: PERFORMANS İÇİN INDEX'LER
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_office_id ON properties(office_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_office_id ON customers(office_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_office_id ON activities(office_id);
CREATE INDEX IF NOT EXISTS idx_requests_user_id ON requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_office_id ON requests(office_id);
CREATE INDEX IF NOT EXISTS idx_profiles_office_id ON profiles(office_id);

-- =====================================================
-- SONUÇ KONTROLÜ
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=== RLS POLİTİKALARI BAŞARIYLA OLUŞTURULDU ===';
  RAISE NOTICE 'Her kullanıcı sadece kendi ve ofisinin verilerini görebilir.';
  RAISE NOTICE 'Public site özellikleri çalışmaya devam eder.';
END $$;

-- PostgREST schema'yı yenile
NOTIFY pgrst, 'reload schema';
