-- ============================================
-- EMLAK CRM PRO - KOMPLİ RLS RESET VE DÜZELTMESİ
-- ============================================
-- TÜM POLİTİKALARI SIFIRDAN OLUŞTURUR
-- ============================================

-- ========== 1. SUBSCRIPTIONS ==========
-- Tüm eski politikaları temizle
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'subscriptions' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.subscriptions', pol.policyname);
    END LOOP;
END $$;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Kullanıcı kendi aboneliğini görebilir
CREATE POLICY "sub_select_own" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Admin herkesin aboneliğini görebilir
CREATE POLICY "sub_select_admin" ON public.subscriptions
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Admin güncelleme yapabilir
CREATE POLICY "sub_update_admin" ON public.subscriptions
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Trigger için insert (authenticated users)
CREATE POLICY "sub_insert_trigger" ON public.subscriptions
  FOR INSERT WITH CHECK (true);

-- ========== 2. PROPERTIES ==========
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'properties' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.properties', pol.policyname);
    END LOOP;
END $$;

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Kullanıcı kendi + ofis emlaklerini görebilir
CREATE POLICY "prop_select" ON public.properties
  FOR SELECT USING (
    auth.uid() = user_id 
    OR office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid())
  );

-- Kullanıcı kendi emlağını ekleyebilir
CREATE POLICY "prop_insert" ON public.properties
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Kullanıcı kendi emlağını güncelleyebilir
CREATE POLICY "prop_update" ON public.properties
  FOR UPDATE USING (auth.uid() = user_id);

-- Kullanıcı kendi emlağını silebilir
CREATE POLICY "prop_delete" ON public.properties
  FOR DELETE USING (auth.uid() = user_id);

-- Broker ofis emlaklerini yönetebilir
CREATE POLICY "prop_broker_all" ON public.properties
  FOR ALL USING (
    office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid() AND role = 'broker')
  );

-- ========== 3. CUSTOMERS ==========
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'customers' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.customers', pol.policyname);
    END LOOP;
END $$;

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- SADECE KENDİ MÜŞTERİLERİNİ GÖREBİLİR (ofis arkadaşları göremez)
CREATE POLICY "cust_select_own" ON public.customers
  FOR SELECT USING (auth.uid() = user_id);

-- Kullanıcı kendi müşterisini ekleyebilir
CREATE POLICY "cust_insert" ON public.customers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Kullanıcı kendi müşterisini güncelleyebilir
CREATE POLICY "cust_update" ON public.customers
  FOR UPDATE USING (auth.uid() = user_id);

-- Kullanıcı kendi müşterisini silebilir
CREATE POLICY "cust_delete" ON public.customers
  FOR DELETE USING (auth.uid() = user_id);

-- Broker tüm ofis müşterilerini görebilir
CREATE POLICY "cust_broker_select" ON public.customers
  FOR SELECT USING (
    office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid() AND role = 'broker')
  );

-- ========== 4. PROFILES ==========
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Kendi profilini ve ofis arkadaşlarını görebilir
CREATE POLICY "profile_select" ON public.profiles
  FOR SELECT USING (
    id = auth.uid() 
    OR office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid())
  );

-- Kendi profilini güncelleyebilir
CREATE POLICY "profile_update" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Yeni profil oluşturabilir (auth trigger için)
CREATE POLICY "profile_insert" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- ========== 5. PLAN_LIMITS ==========
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'plan_limits' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.plan_limits', pol.policyname);
    END LOOP;
END $$;

ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir
CREATE POLICY "plan_limits_select" ON public.plan_limits
  FOR SELECT USING (true);

-- ========== 6. ADMIN_USERS ==========
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'admin_users' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.admin_users', pol.policyname);
    END LOOP;
END $$;

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Admin kendini görebilir
CREATE POLICY "admin_select" ON public.admin_users
  FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- ========== 7. ACTIVITIES ==========
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'activities' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.activities', pol.policyname);
    END LOOP;
END $$;

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activities_select" ON public.activities
  FOR SELECT USING (
    auth.uid() = user_id 
    OR office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "activities_insert" ON public.activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "activities_update" ON public.activities
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "activities_delete" ON public.activities
  FOR DELETE USING (auth.uid() = user_id);

-- ========== DOĞRULAMA ==========
SELECT 'Policies updated successfully' as status;

NOTIFY pgrst, 'reload schema';
