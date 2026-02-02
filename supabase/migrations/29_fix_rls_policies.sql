-- ============================================
-- EMLAK CRM PRO - KRİTİK RLS DÜZELTMELERİ
-- ============================================
-- Bu SQL'i Supabase SQL Editor'da çalıştırın
-- ============================================

-- 1. SUBSCRIPTIONS TABLOSU RLS DÜZELTMESİ
-- Kullanıcılar kendi aboneliklerini okuyabilmeli
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscriptions;
CREATE POLICY "Users can insert own subscription" ON public.subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin her şeyi yönetebilir
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can manage all subscriptions" ON public.subscriptions
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );

-- 2. PROPERTIES TABLOSU RLS DÜZELTMESİ
-- Kullanıcılar hem kendi hem ofis emlaklerini görmeli
DROP POLICY IF EXISTS "Users can view office properties" ON public.properties;
CREATE POLICY "Users can view office properties" ON public.properties
  FOR SELECT
  USING (
    user_id = auth.uid() 
    OR office_id = (SELECT office_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert properties" ON public.properties;
CREATE POLICY "Users can insert properties" ON public.properties
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND office_id = (SELECT office_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own properties" ON public.properties;
CREATE POLICY "Users can update own properties" ON public.properties
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own properties" ON public.properties;
CREATE POLICY "Users can delete own properties" ON public.properties
  FOR DELETE
  USING (user_id = auth.uid());

-- Broker tüm ofis emlaklerini yönetebilir
DROP POLICY IF EXISTS "Brokers can manage office properties" ON public.properties;
CREATE POLICY "Brokers can manage office properties" ON public.properties
  FOR ALL
  USING (
    office_id = (SELECT office_id FROM public.profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'broker'
    )
  );

-- 3. PROFILES TABLOSU - Kendi profili ve ofis arkadaşlarını görme
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT
  USING (
    id = auth.uid() 
    OR office_id = (SELECT office_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 4. CUSTOMERS TABLOSU 
DROP POLICY IF EXISTS "Users can view own customers" ON public.customers;
CREATE POLICY "Users can view own customers" ON public.customers
  FOR SELECT
  USING (
    user_id = auth.uid() 
    OR office_id = (SELECT office_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can manage own customers" ON public.customers;
CREATE POLICY "Users can manage own customers" ON public.customers
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 5. PLAN_LIMITS - Herkes okuyabilir
DROP POLICY IF EXISTS "Anyone can read plan_limits" ON public.plan_limits;
CREATE POLICY "Anyone can read plan_limits" ON public.plan_limits
  FOR SELECT
  USING (true);

-- 6. DOĞRULAMA SORGULARI
-- Şu kullanıcıların durumunu kontrol et:
SELECT 
  p.email,
  p.full_name,
  p.office_id,
  p.role,
  p.subscription_plan as profile_plan,
  s.plan as subscription_plan,
  s.status as subscription_status
FROM profiles p
LEFT JOIN subscriptions s ON p.id = s.user_id
WHERE p.email IN ('teorey@gmail.com', 'esraekrekli@gmail.com');

-- Emlakların durumu:
SELECT 
  COUNT(*) as toplam_emlak,
  office_id,
  user_id
FROM properties
GROUP BY office_id, user_id;

-- 7. NOTIFY POSGREST
NOTIFY pgrst, 'reload schema';
