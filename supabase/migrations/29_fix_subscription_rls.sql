-- FIX SUBSCRIPTION SYSTEM RLS POLICIES
-- Bu migration sonsuz döngü ve erişim sorunlarını düzeltir

-- 1. admin_users tablosu için güvenli policy (sonsuz döngü düzeltmesi)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Anyone can check admin status" ON public.admin_users;

-- Herkes admin_users tablosunu okuyabilir (sadece user_id kontrolü için)
-- Bu sonsuz döngüyü önler
CREATE POLICY "Anyone can check admin status" ON public.admin_users
  FOR SELECT
  USING (true);

-- 2. subscriptions tablosu için düzeltilmiş policy
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can read own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Admin full access subscriptions" ON public.subscriptions;

-- Kullanıcı kendi subscription'ını görebilir
CREATE POLICY "Users can read own subscription" ON public.subscriptions
  FOR SELECT
  USING (
    user_id IS NOT NULL AND user_id = auth.uid()
  );

-- Admin tüm subscription'ları yönetebilir (sonsuz döngü olmadan)
CREATE POLICY "Admin full access subscriptions" ON public.subscriptions
  FOR ALL
  USING (
    auth.uid() IN (SELECT user_id FROM public.admin_users)
  );

-- 3. plan_limits herkes okuyabilir (zaten var ama emin olalım)
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read plan_limits" ON public.plan_limits;
CREATE POLICY "Anyone can read plan_limits" ON public.plan_limits
  FOR SELECT
  USING (true);

-- 4. Profiles tablosuna subscription_plan için güncelleme izni
DROP POLICY IF EXISTS "Users can update subscription_plan" ON public.profiles;

-- Mevcut "Manage Own Profile" policy zaten ALL izni veriyor, ekstra policy gerekmiyor

-- 5. Mevcut kullanıcılar için eksik subscription kayıtlarını oluştur
INSERT INTO public.subscriptions (user_id, plan, status)
SELECT p.id, COALESCE(p.subscription_plan, 'free'), 'active'
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscriptions s WHERE s.user_id = p.id
)
ON CONFLICT (user_id) DO NOTHING;

-- 6. Debug: Mevcut durumu kontrol et
DO $$
DECLARE
  profile_count INTEGER;
  subscription_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  SELECT COUNT(*) INTO subscription_count FROM public.subscriptions;

  RAISE NOTICE 'Profiles: %, Subscriptions: %', profile_count, subscription_count;
END $$;

-- Reload PostgREST schema
NOTIFY pgrst, 'reload schema';
