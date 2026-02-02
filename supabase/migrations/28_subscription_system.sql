-- SUBSCRIPTION SYSTEM FOR SAAS
-- Emlak CRM Pro - Abonelik ve Plan Yönetimi

-- 1. Plan limitleri tablosu (referans tablo)
CREATE TABLE IF NOT EXISTS public.plan_limits (
  plan TEXT PRIMARY KEY,
  max_properties INTEGER NOT NULL,
  max_customers INTEGER NOT NULL,
  price_monthly INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plan verileri ekle
INSERT INTO public.plan_limits (plan, max_properties, max_customers, price_monthly, description) VALUES
  ('free', 20, 50, 0, 'Ücretsiz Plan - 20 Portföy, 50 Müşteri'),
  ('pro', -1, -1, 199, 'Pro Plan - Sınırsız Kullanım')
ON CONFLICT (plan) DO UPDATE SET
  max_properties = EXCLUDED.max_properties,
  max_customers = EXCLUDED.max_customers,
  price_monthly = EXCLUDED.price_monthly,
  description = EXCLUDED.description;

-- 2. Subscriptions tablosu
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  office_id UUID REFERENCES public.offices(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' REFERENCES public.plan_limits(plan),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_user_subscription UNIQUE(user_id)
);

-- 3. Admin users tablosu
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Profiles tablosuna yeni alanlar
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_individual BOOLEAN DEFAULT false;

-- 5. RLS Politikaları

-- plan_limits için (herkes okuyabilir)
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read plan_limits" ON public.plan_limits;
CREATE POLICY "Anyone can read plan_limits" ON public.plan_limits
  FOR SELECT
  USING (true);

-- subscriptions için
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can manage all subscriptions" ON public.subscriptions
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );

-- admin_users için
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
CREATE POLICY "Admins can view admin_users" ON public.admin_users
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );

-- 6. Trigger: Yeni kullanıcı kaydında otomatik free subscription oluştur
CREATE OR REPLACE FUNCTION public.create_subscription_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_subscription ON public.profiles;
CREATE TRIGGER on_profile_created_subscription
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_subscription_for_new_user();

-- 7. Mevcut kullanıcılar için subscription oluştur
INSERT INTO public.subscriptions (user_id, plan, status)
SELECT id, 'free', 'active'
FROM public.profiles
WHERE id NOT IN (SELECT user_id FROM public.subscriptions WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- 8. İndeksler
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON public.subscriptions(plan);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
