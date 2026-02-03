-- STRICT PRIVACY RLS POLICIES
-- MÜŞTERİLER: Sadece sahibi görür (ofis arkadaşları bile göremez!)
-- AKTİVİTELER: Sadece sahibi görür
-- PORTFÖYLER: Ofis içinde paylaşılır (eşleştirme için)
-- TALEPLER: Ofis içinde paylaşılır (eşleştirme için)
-- Tarih: 2026-02-03

-- =====================================================
-- ADIM 1: RLS'İ AKTİF ET (kapalıysa)
-- =====================================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE offices ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ADIM 2: TÜM ESKİ POLİTİKALARI TEMİZLE
-- =====================================================

-- Customers
DROP POLICY IF EXISTS "customers_select" ON customers;
DROP POLICY IF EXISTS "customers_insert" ON customers;
DROP POLICY IF EXISTS "customers_update" ON customers;
DROP POLICY IF EXISTS "customers_delete" ON customers;
DROP POLICY IF EXISTS "customers_select_policy" ON customers;
DROP POLICY IF EXISTS "customers_insert_policy" ON customers;
DROP POLICY IF EXISTS "customers_update_policy" ON customers;
DROP POLICY IF EXISTS "customers_delete_policy" ON customers;
DROP POLICY IF EXISTS "customers_strict_owner_only" ON customers;
DROP POLICY IF EXISTS "Customers Select Own" ON customers;
DROP POLICY IF EXISTS "Customers Update Own" ON customers;
DROP POLICY IF EXISTS "Customers Delete Own" ON customers;
DROP POLICY IF EXISTS "Customers Insert Own" ON customers;

-- Activities
DROP POLICY IF EXISTS "activities_select" ON activities;
DROP POLICY IF EXISTS "activities_insert" ON activities;
DROP POLICY IF EXISTS "activities_update" ON activities;
DROP POLICY IF EXISTS "activities_delete" ON activities;
DROP POLICY IF EXISTS "activities_select_policy" ON activities;
DROP POLICY IF EXISTS "activities_insert_policy" ON activities;
DROP POLICY IF EXISTS "activities_update_policy" ON activities;
DROP POLICY IF EXISTS "activities_delete_policy" ON activities;
DROP POLICY IF EXISTS "Activities Select Own" ON activities;
DROP POLICY IF EXISTS "Activities Update Own" ON activities;
DROP POLICY IF EXISTS "Activities Delete Own" ON activities;
DROP POLICY IF EXISTS "Activities Insert Own" ON activities;

-- Properties
DROP POLICY IF EXISTS "properties_select" ON properties;
DROP POLICY IF EXISTS "properties_insert" ON properties;
DROP POLICY IF EXISTS "properties_update" ON properties;
DROP POLICY IF EXISTS "properties_delete" ON properties;
DROP POLICY IF EXISTS "properties_select_policy" ON properties;
DROP POLICY IF EXISTS "properties_insert_policy" ON properties;
DROP POLICY IF EXISTS "properties_update_policy" ON properties;
DROP POLICY IF EXISTS "properties_delete_policy" ON properties;
DROP POLICY IF EXISTS "View Office Properties" ON properties;
DROP POLICY IF EXISTS "Public can view published properties" ON properties;

-- Requests
DROP POLICY IF EXISTS "requests_select" ON requests;
DROP POLICY IF EXISTS "requests_insert" ON requests;
DROP POLICY IF EXISTS "requests_update" ON requests;
DROP POLICY IF EXISTS "requests_delete" ON requests;
DROP POLICY IF EXISTS "requests_select_policy" ON requests;
DROP POLICY IF EXISTS "requests_insert_policy" ON requests;
DROP POLICY IF EXISTS "requests_update_policy" ON requests;
DROP POLICY IF EXISTS "requests_delete_policy" ON requests;
DROP POLICY IF EXISTS "Requests Select Own" ON requests;
DROP POLICY IF EXISTS "Requests Update Own" ON requests;
DROP POLICY IF EXISTS "Requests Delete Own" ON requests;
DROP POLICY IF EXISTS "Requests Insert Own" ON requests;

-- Profiles
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_delete" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "Manage Own Profile" ON profiles;
DROP POLICY IF EXISTS "View Office Team" ON profiles;
DROP POLICY IF EXISTS "Public can read active site configs" ON profiles;

-- Sales
DROP POLICY IF EXISTS "sales_select" ON sales;
DROP POLICY IF EXISTS "sales_insert" ON sales;
DROP POLICY IF EXISTS "sales_update" ON sales;
DROP POLICY IF EXISTS "sales_delete" ON sales;
DROP POLICY IF EXISTS "sales_select_policy" ON sales;
DROP POLICY IF EXISTS "sales_insert_policy" ON sales;
DROP POLICY IF EXISTS "sales_update_policy" ON sales;
DROP POLICY IF EXISTS "sales_delete_policy" ON sales;

-- Offices
DROP POLICY IF EXISTS "offices_select" ON offices;
DROP POLICY IF EXISTS "offices_insert" ON offices;
DROP POLICY IF EXISTS "offices_update" ON offices;
DROP POLICY IF EXISTS "offices_delete" ON offices;
DROP POLICY IF EXISTS "offices_select_policy" ON offices;
DROP POLICY IF EXISTS "Public can read active office sites" ON offices;

-- =====================================================
-- ADIM 3: YARDIMCI FONKSİYON
-- =====================================================

CREATE OR REPLACE FUNCTION get_my_office_id()
RETURNS UUID AS $$
  SELECT office_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- =====================================================
-- ADIM 4: MÜŞTERİLER - SADECE SAHİBİ GÖRÜR!
-- =====================================================

CREATE POLICY "customers_owner_only_select" ON customers
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "customers_owner_only_insert" ON customers
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "customers_owner_only_update" ON customers
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "customers_owner_only_delete" ON customers
FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- ADIM 5: AKTİVİTELER - SADECE SAHİBİ GÖRÜR!
-- =====================================================

CREATE POLICY "activities_owner_only_select" ON activities
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "activities_owner_only_insert" ON activities
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "activities_owner_only_update" ON activities
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "activities_owner_only_delete" ON activities
FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- ADIM 6: PORTFÖYLER - OFİS İÇİNDE PAYLAŞILIR
-- (Müşteri bilgisi hariç, sadece ilan bilgileri)
-- =====================================================

CREATE POLICY "properties_office_select" ON properties
FOR SELECT USING (
  -- Kendi portföylerim
  user_id = auth.uid()
  OR
  -- Aynı ofisteki portföyler
  office_id = get_my_office_id()
  OR
  -- Public site için yayınlanmış
  COALESCE("publishedOnPersonalSite", false) = true
  OR
  COALESCE("publishedOnMarketplace", false) = true
);

CREATE POLICY "properties_owner_insert" ON properties
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "properties_owner_update" ON properties
FOR UPDATE USING (
  user_id = auth.uid()
  OR
  office_id = get_my_office_id()
);

CREATE POLICY "properties_owner_delete" ON properties
FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- ADIM 7: TALEPLER - OFİS İÇİNDE PAYLAŞILIR (Eşleştirme için)
-- =====================================================

CREATE POLICY "requests_office_select" ON requests
FOR SELECT USING (
  user_id = auth.uid()
  OR
  office_id = get_my_office_id()
);

CREATE POLICY "requests_owner_insert" ON requests
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "requests_owner_update" ON requests
FOR UPDATE USING (
  user_id = auth.uid()
  OR
  office_id = get_my_office_id()
);

CREATE POLICY "requests_owner_delete" ON requests
FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- ADIM 8: PROFİLLER - Ofis arkadaşlarını gör
-- =====================================================

CREATE POLICY "profiles_select_policy" ON profiles
FOR SELECT USING (
  id = auth.uid()  -- Kendi profilim
  OR
  office_id = get_my_office_id()  -- Ofis arkadaşları
  OR
  (site_config IS NOT NULL AND (site_config->>'isActive')::boolean = true)  -- Public site
);

CREATE POLICY "profiles_insert_policy" ON profiles
FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_policy" ON profiles
FOR UPDATE USING (id = auth.uid());

-- =====================================================
-- ADIM 9: SATIŞLAR - Broker hepsini, danışman kendininkileri görür
-- =====================================================

CREATE POLICY "sales_select_policy" ON sales
FOR SELECT USING (
  user_id = auth.uid()
  OR
  -- Broker tüm ofis satışlarını görür
  (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'broker'
      AND office_id = (SELECT office_id FROM sales s2 WHERE s2.id = sales.id)
    )
  )
  OR
  office_id = get_my_office_id()
);

CREATE POLICY "sales_insert_policy" ON sales
FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "sales_update_policy" ON sales
FOR UPDATE USING (
  user_id = auth.uid()
  OR
  office_id = get_my_office_id()
);

CREATE POLICY "sales_delete_policy" ON sales
FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- ADIM 10: OFİSLER
-- =====================================================

CREATE POLICY "offices_select_policy" ON offices
FOR SELECT USING (
  id = get_my_office_id()
  OR
  owner_id = auth.uid()
  OR
  (site_config IS NOT NULL AND (site_config->>'isActive')::boolean = true)
);

CREATE POLICY "offices_insert_policy" ON offices
FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "offices_update_policy" ON offices
FOR UPDATE USING (
  owner_id = auth.uid()
  OR
  id = get_my_office_id()
);

-- =====================================================
-- ADIM 11: VERİFİKASYON
-- =====================================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename IN ('customers', 'activities', 'properties', 'requests', 'profiles', 'sales', 'offices');

  RAISE NOTICE '========================================';
  RAISE NOTICE 'STRICT PRIVACY RLS POLİTİKALARI UYGULANDI';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Toplam politika sayısı: %', policy_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Gizlilik Kuralları:';
  RAISE NOTICE '  - Müşteriler: SADECE SAHİBİ görür';
  RAISE NOTICE '  - Aktiviteler: SADECE SAHİBİ görür';
  RAISE NOTICE '  - Portföyler: Ofis içi paylaşılır';
  RAISE NOTICE '  - Talepler: Ofis içi paylaşılır';
  RAISE NOTICE '========================================';
END $$;

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
