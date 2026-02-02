-- COMPLETE RLS FIX
-- Bu migration tüm RLS sorunlarını düzeltir
-- Tarih: 2026-02-02

-- =====================================================
-- ADIM 1: MEVCUT DURUMU GÖSTER (DEBUG)
-- =====================================================

DO $$
DECLARE
  profile_count INTEGER;
  property_count INTEGER;
  customer_count INTEGER;
  activity_count INTEGER;
  request_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM profiles;
  SELECT COUNT(*) INTO property_count FROM properties;
  SELECT COUNT(*) INTO customer_count FROM customers;
  SELECT COUNT(*) INTO activity_count FROM activities;
  SELECT COUNT(*) INTO request_count FROM requests;

  RAISE NOTICE '=== MEVCUT VERİ DURUMU ===';
  RAISE NOTICE 'Profiles: %', profile_count;
  RAISE NOTICE 'Properties: %', property_count;
  RAISE NOTICE 'Customers: %', customer_count;
  RAISE NOTICE 'Activities: %', activity_count;
  RAISE NOTICE 'Requests: %', request_count;
END $$;

-- =====================================================
-- ADIM 2: TÜM ESKİ POLİTİKALARI TEMİZLE
-- =====================================================

-- Properties policies
DROP POLICY IF EXISTS "View Office Properties" ON properties;
DROP POLICY IF EXISTS "Properties Select Own" ON properties;
DROP POLICY IF EXISTS "Properties Update Own" ON properties;
DROP POLICY IF EXISTS "Properties Delete Own" ON properties;
DROP POLICY IF EXISTS "Properties Insert Own" ON properties;
DROP POLICY IF EXISTS "Public can view published properties" ON properties;
DROP POLICY IF EXISTS "Strict Private Properties" ON properties;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON properties;

-- Customers policies
DROP POLICY IF EXISTS "Customers Select Own" ON customers;
DROP POLICY IF EXISTS "Customers Update Own" ON customers;
DROP POLICY IF EXISTS "Customers Delete Own" ON customers;
DROP POLICY IF EXISTS "Customers Insert Own" ON customers;
DROP POLICY IF EXISTS "Strict Private Customers" ON customers;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON customers;

-- Activities policies
DROP POLICY IF EXISTS "Activities Select Own" ON activities;
DROP POLICY IF EXISTS "Activities Update Own" ON activities;
DROP POLICY IF EXISTS "Activities Delete Own" ON activities;
DROP POLICY IF EXISTS "Activities Insert Own" ON activities;
DROP POLICY IF EXISTS "Strict Private Activities" ON activities;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON activities;

-- Requests policies
DROP POLICY IF EXISTS "Requests Select Own" ON requests;
DROP POLICY IF EXISTS "Requests Update Own" ON requests;
DROP POLICY IF EXISTS "Requests Delete Own" ON requests;
DROP POLICY IF EXISTS "Requests Insert Own" ON requests;
DROP POLICY IF EXISTS "Strict Private Requests" ON requests;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON requests;

-- Profiles policies
DROP POLICY IF EXISTS "Manage Own Profile" ON profiles;
DROP POLICY IF EXISTS "View Office Team" ON profiles;
DROP POLICY IF EXISTS "Public can read active site configs" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Sales policies
DROP POLICY IF EXISTS "Sales Select Own" ON sales;
DROP POLICY IF EXISTS "Sales Insert Own" ON sales;
DROP POLICY IF EXISTS "Sales Update Own" ON sales;
DROP POLICY IF EXISTS "Sales Delete Own" ON sales;

-- Sites policies
DROP POLICY IF EXISTS "Sites Select Own" ON sites;
DROP POLICY IF EXISTS "Sites Insert Own" ON sites;
DROP POLICY IF EXISTS "Sites Update Own" ON sites;
DROP POLICY IF EXISTS "Sites Delete Own" ON sites;

-- =====================================================
-- ADIM 3: RLS'İ AKTİF ET
-- =====================================================

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ADIM 4: YENİ ESNEK POLİTİKALAR OLUŞTUR
-- Her tablo için: user_id VEYA office_id eşleşmesi
-- =====================================================

-- PROFILES: Kendi profilini yönet + ofis arkadaşlarını gör
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (
  id = auth.uid()  -- Kendi profilim
  OR
  office_id IN (SELECT office_id FROM profiles WHERE id = auth.uid())  -- Ofis arkadaşları
  OR
  (site_config IS NOT NULL AND (site_config->>'isActive')::boolean = true)  -- Public site için
);

CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (
  id = auth.uid()
);

CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (
  id = auth.uid()
);

-- PROPERTIES: Kendi kayıtlarım + ofis kayıtları
CREATE POLICY "properties_select" ON properties FOR SELECT USING (
  user_id = auth.uid()  -- Benim oluşturduklarım
  OR
  office_id IN (SELECT office_id FROM profiles WHERE id = auth.uid())  -- Ofis kayıtları
  OR
  (COALESCE("publishedOnPersonalSite", false) = true)  -- Public site için
  OR
  (COALESCE("publishedOnMarketplace", false) = true)  -- Marketplace için
);

CREATE POLICY "properties_insert" ON properties FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

CREATE POLICY "properties_update" ON properties FOR UPDATE USING (
  user_id = auth.uid()
  OR
  office_id IN (SELECT office_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "properties_delete" ON properties FOR DELETE USING (
  user_id = auth.uid()
  OR
  office_id IN (SELECT office_id FROM profiles WHERE id = auth.uid())
);

-- CUSTOMERS: Kendi kayıtlarım + ofis kayıtları
CREATE POLICY "customers_select" ON customers FOR SELECT USING (
  user_id = auth.uid()
  OR
  office_id IN (SELECT office_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "customers_insert" ON customers FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

CREATE POLICY "customers_update" ON customers FOR UPDATE USING (
  user_id = auth.uid()
  OR
  office_id IN (SELECT office_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "customers_delete" ON customers FOR DELETE USING (
  user_id = auth.uid()
  OR
  office_id IN (SELECT office_id FROM profiles WHERE id = auth.uid())
);

-- ACTIVITIES: Kendi kayıtlarım + ofis kayıtları
CREATE POLICY "activities_select" ON activities FOR SELECT USING (
  user_id = auth.uid()
  OR
  office_id IN (SELECT office_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "activities_insert" ON activities FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

CREATE POLICY "activities_update" ON activities FOR UPDATE USING (
  user_id = auth.uid()
  OR
  office_id IN (SELECT office_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "activities_delete" ON activities FOR DELETE USING (
  user_id = auth.uid()
  OR
  office_id IN (SELECT office_id FROM profiles WHERE id = auth.uid())
);

-- REQUESTS: Kendi kayıtlarım + ofis kayıtları
CREATE POLICY "requests_select" ON requests FOR SELECT USING (
  user_id = auth.uid()
  OR
  office_id IN (SELECT office_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "requests_insert" ON requests FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

CREATE POLICY "requests_update" ON requests FOR UPDATE USING (
  user_id = auth.uid()
  OR
  office_id IN (SELECT office_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "requests_delete" ON requests FOR DELETE USING (
  user_id = auth.uid()
  OR
  office_id IN (SELECT office_id FROM profiles WHERE id = auth.uid())
);

-- SALES: Ofis bazlı erişim
CREATE POLICY "sales_select" ON sales FOR SELECT USING (
  user_id = auth.uid()
  OR
  office_id IN (SELECT office_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "sales_insert" ON sales FOR INSERT WITH CHECK (
  user_id = auth.uid() OR user_id IS NULL
);

CREATE POLICY "sales_update" ON sales FOR UPDATE USING (
  user_id = auth.uid()
  OR
  office_id IN (SELECT office_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "sales_delete" ON sales FOR DELETE USING (
  user_id = auth.uid()
  OR
  office_id IN (SELECT office_id FROM profiles WHERE id = auth.uid())
);

-- SITES: Ofis bazlı erişim
CREATE POLICY "sites_select" ON sites FOR SELECT USING (
  user_id = auth.uid()
  OR
  office_id IN (SELECT office_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "sites_insert" ON sites FOR INSERT WITH CHECK (
  user_id = auth.uid() OR user_id IS NULL
);

CREATE POLICY "sites_update" ON sites FOR UPDATE USING (true);
CREATE POLICY "sites_delete" ON sites FOR DELETE USING (true);

-- =====================================================
-- ADIM 5: VERİ ONARIMI - user_id ve office_id eşleştir
-- =====================================================

-- Properties: Eğer user_id auth.users'da varsa ve office_id eksikse, profiles'dan al
UPDATE properties p
SET office_id = pr.office_id
FROM profiles pr
WHERE p.user_id::text = pr.id::text
AND p.office_id IS NULL
AND pr.office_id IS NOT NULL;

-- Customers: Aynı düzeltme
UPDATE customers c
SET office_id = pr.office_id
FROM profiles pr
WHERE c.user_id::text = pr.id::text
AND c.office_id IS NULL
AND pr.office_id IS NOT NULL;

-- Activities: Aynı düzeltme
UPDATE activities a
SET office_id = pr.office_id
FROM profiles pr
WHERE a.user_id::text = pr.id::text
AND a.office_id IS NULL
AND pr.office_id IS NOT NULL;

-- Requests: Aynı düzeltme
UPDATE requests r
SET office_id = pr.office_id
FROM profiles pr
WHERE r.user_id::text = pr.id::text
AND r.office_id IS NULL
AND pr.office_id IS NOT NULL;

-- =====================================================
-- ADIM 6: BİREYSEL KULLANICILAR İÇİN OFİS OLUŞTUR
-- Eğer kullanıcının office_id'si yoksa, kendine özel bir ofis oluştur
-- =====================================================

-- Bireysel kullanıcılar için otomatik ofis oluşturma
INSERT INTO offices (id, name, owner_id, created_at)
SELECT
  gen_random_uuid(),
  p.full_name || ' Ofisi',
  p.id,
  NOW()
FROM profiles p
WHERE p.office_id IS NULL
AND NOT EXISTS (SELECT 1 FROM offices o WHERE o.owner_id = p.id)
ON CONFLICT DO NOTHING;

-- Oluşturulan ofisleri kullanıcılara ata
UPDATE profiles p
SET office_id = o.id
FROM offices o
WHERE o.owner_id = p.id
AND p.office_id IS NULL;

-- =====================================================
-- ADIM 7: SUBSCRIPTION TABLOLARI
-- =====================================================

-- plan_limits herkes okuyabilir
ALTER TABLE plan_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read plan_limits" ON plan_limits;
CREATE POLICY "Anyone can read plan_limits" ON plan_limits FOR SELECT USING (true);

-- subscriptions - kullanıcı kendi kaydını görebilir
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Admin full access subscriptions" ON subscriptions;

CREATE POLICY "subscriptions_select" ON subscriptions FOR SELECT USING (
  user_id = auth.uid()
  OR
  auth.uid() IN (SELECT user_id FROM admin_users)
);

CREATE POLICY "subscriptions_all_admin" ON subscriptions FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM admin_users)
);

-- admin_users - herkes okuyabilir (admin kontrolü için)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can check admin status" ON admin_users;
CREATE POLICY "admin_users_select" ON admin_users FOR SELECT USING (true);

-- =====================================================
-- ADIM 8: OFFICES tablosu
-- =====================================================

ALTER TABLE offices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "offices_select" ON offices;
DROP POLICY IF EXISTS "offices_update" ON offices;
DROP POLICY IF EXISTS "Public can read active office sites" ON offices;

CREATE POLICY "offices_select" ON offices FOR SELECT USING (
  id IN (SELECT office_id FROM profiles WHERE id = auth.uid())
  OR
  owner_id = auth.uid()
  OR
  (site_config IS NOT NULL AND (site_config->>'isActive')::boolean = true)
);

CREATE POLICY "offices_update" ON offices FOR UPDATE USING (
  owner_id = auth.uid()
  OR
  id IN (SELECT office_id FROM profiles WHERE id = auth.uid() AND role = 'broker')
);

CREATE POLICY "offices_insert" ON offices FOR INSERT WITH CHECK (
  owner_id = auth.uid()
);

-- =====================================================
-- ADIM 9: SON DURUM KONTROLÜ
-- =====================================================

DO $$
DECLARE
  orphan_properties INTEGER;
  orphan_customers INTEGER;
  users_without_office INTEGER;
  users_without_subscription INTEGER;
BEGIN
  -- Sahipsiz (user_id profiles'da yok) kayıtları say
  SELECT COUNT(*) INTO orphan_properties
  FROM properties p
  WHERE NOT EXISTS (SELECT 1 FROM profiles pr WHERE pr.id::text = p.user_id::text);

  SELECT COUNT(*) INTO orphan_customers
  FROM customers c
  WHERE NOT EXISTS (SELECT 1 FROM profiles pr WHERE pr.id::text = c.user_id::text);

  SELECT COUNT(*) INTO users_without_office
  FROM profiles WHERE office_id IS NULL;

  SELECT COUNT(*) INTO users_without_subscription
  FROM profiles p
  WHERE NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = p.id);

  RAISE NOTICE '=== ONARIM SONRASI DURUM ===';
  RAISE NOTICE 'Sahipsiz Properties: %', orphan_properties;
  RAISE NOTICE 'Sahipsiz Customers: %', orphan_customers;
  RAISE NOTICE 'Ofissiz Kullanıcılar: %', users_without_office;
  RAISE NOTICE 'Subscription''sız Kullanıcılar: %', users_without_subscription;

  IF orphan_properties > 0 THEN
    RAISE WARNING 'DİKKAT: % adet property''nin user_id''si geçersiz!', orphan_properties;
  END IF;
END $$;

-- =====================================================
-- ADIM 10: Eksik subscription'ları oluştur
-- =====================================================

INSERT INTO subscriptions (user_id, plan, status)
SELECT p.id, 'free', 'active'
FROM profiles p
WHERE NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = p.id)
ON CONFLICT (user_id) DO NOTHING;

-- PostgREST schema'yı yenile
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- BİTTİ - Artık veriler görünür olmalı
-- =====================================================
