-- Comprehensive RLS and Index Fix
-- Date: 2026-02-10
-- Issues:
--   1. RLS policies with admin_users JOINs causing timeouts
--   2. Missing indexes causing seq_scans
--   3. subscriptions insert/update policies missing

-- ============================================
-- PART 1: INDEXES (Run first - these are safe)
-- ============================================

-- Properties indexes
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON public.properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_office_id ON public.properties(office_id);
CREATE INDEX IF NOT EXISTS idx_properties_listing_status ON public.properties(listing_status);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON public.properties(created_at DESC);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_office_id ON public.profiles(office_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Activities indexes
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_customer_id ON public.activities("customerId");
CREATE INDEX IF NOT EXISTS idx_activities_property_id ON public.activities("propertyId");
CREATE INDEX IF NOT EXISTS idx_activities_date ON public.activities(date DESC);

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_office_id ON public.customers(office_id);

-- Sales indexes
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON public.sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_office_id ON public.sales(office_id);
CREATE INDEX IF NOT EXISTS idx_sales_property_id ON public.sales(property_id);

-- Requests indexes
CREATE INDEX IF NOT EXISTS idx_requests_user_id ON public.requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_office_id ON public.requests(office_id);

-- Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_office_id ON public.subscriptions(office_id);

-- Offices indexes
CREATE INDEX IF NOT EXISTS idx_offices_owner_id ON public.offices(owner_id);

-- ============================================
-- PART 2: HELPER FUNCTIONS (Simple, no JOINs)
-- ============================================

-- Simple function to get current user's office_id
CREATE OR REPLACE FUNCTION public.get_my_office_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT office_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Simple function to get current user's role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- ============================================
-- PART 3: SUBSCRIPTIONS RLS (Complete)
-- ============================================

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop all existing subscriptions policies
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subscriptions'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.subscriptions', p.policyname);
  END LOOP;
END $$;

-- Simple subscriptions policies
CREATE POLICY subscriptions_select
ON public.subscriptions FOR SELECT
USING (user_id = auth.uid() OR office_id = public.get_my_office_id());

CREATE POLICY subscriptions_insert
ON public.subscriptions FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY subscriptions_update
ON public.subscriptions FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY subscriptions_delete
ON public.subscriptions FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- PART 4: PROPERTIES RLS (Simple, no admin_users)
-- ============================================

-- Drop all existing properties policies
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'properties'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.properties', p.policyname);
  END LOOP;
END $$;

CREATE POLICY properties_select
ON public.properties FOR SELECT
USING (
  user_id = auth.uid()
  OR office_id = public.get_my_office_id()
  OR COALESCE("publishedOnPersonalSite", false) = true
  OR COALESCE("publishedOnMarketplace", false) = true
);

CREATE POLICY properties_insert
ON public.properties FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY properties_update
ON public.properties FOR UPDATE
USING (user_id = auth.uid() OR (public.get_my_role() = 'broker' AND office_id = public.get_my_office_id()))
WITH CHECK (user_id = auth.uid() OR (public.get_my_role() = 'broker' AND office_id = public.get_my_office_id()));

CREATE POLICY properties_delete
ON public.properties FOR DELETE
USING (user_id = auth.uid() OR (public.get_my_role() = 'broker' AND office_id = public.get_my_office_id()));

-- ============================================
-- PART 5: PROFILES RLS (Simple)
-- ============================================

-- Drop all existing profiles policies
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', p.policyname);
  END LOOP;
END $$;

CREATE POLICY profiles_select
ON public.profiles FOR SELECT
USING (id = auth.uid() OR office_id = public.get_my_office_id());

CREATE POLICY profiles_insert
ON public.profiles FOR INSERT
WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update
ON public.profiles FOR UPDATE
USING (id = auth.uid() OR (public.get_my_role() = 'broker' AND office_id = public.get_my_office_id()))
WITH CHECK (id = auth.uid() OR (public.get_my_role() = 'broker' AND office_id = public.get_my_office_id()));

-- ============================================
-- PART 6: CUSTOMERS RLS (Owner only)
-- ============================================

-- Drop all existing customers policies
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'customers'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.customers', p.policyname);
  END LOOP;
END $$;

CREATE POLICY customers_select
ON public.customers FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY customers_insert
ON public.customers FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY customers_update
ON public.customers FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY customers_delete
ON public.customers FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- PART 7: ACTIVITIES RLS (Owner only)
-- ============================================

-- Drop all existing activities policies
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'activities'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.activities', p.policyname);
  END LOOP;
END $$;

CREATE POLICY activities_select
ON public.activities FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY activities_insert
ON public.activities FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY activities_update
ON public.activities FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY activities_delete
ON public.activities FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- PART 8: REQUESTS RLS (Office visible)
-- ============================================

-- Drop all existing requests policies
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'requests'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.requests', p.policyname);
  END LOOP;
END $$;

CREATE POLICY requests_select
ON public.requests FOR SELECT
USING (user_id = auth.uid() OR office_id = public.get_my_office_id());

CREATE POLICY requests_insert
ON public.requests FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY requests_update
ON public.requests FOR UPDATE
USING (user_id = auth.uid() OR (public.get_my_role() = 'broker' AND office_id = public.get_my_office_id()))
WITH CHECK (user_id = auth.uid() OR (public.get_my_role() = 'broker' AND office_id = public.get_my_office_id()));

CREATE POLICY requests_delete
ON public.requests FOR DELETE
USING (user_id = auth.uid() OR (public.get_my_role() = 'broker' AND office_id = public.get_my_office_id()));

-- ============================================
-- PART 9: SALES RLS (Office visible)
-- ============================================

-- Drop all existing sales policies
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sales'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.sales', p.policyname);
  END LOOP;
END $$;

CREATE POLICY sales_select
ON public.sales FOR SELECT
USING (user_id = auth.uid() OR office_id = public.get_my_office_id());

CREATE POLICY sales_insert
ON public.sales FOR INSERT
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY sales_update
ON public.sales FOR UPDATE
USING (user_id = auth.uid() OR (public.get_my_role() = 'broker' AND office_id = public.get_my_office_id()))
WITH CHECK (user_id = auth.uid() OR (public.get_my_role() = 'broker' AND office_id = public.get_my_office_id()));

CREATE POLICY sales_delete
ON public.sales FOR DELETE
USING (user_id = auth.uid() OR (public.get_my_role() = 'broker' AND office_id = public.get_my_office_id()));

-- ============================================
-- PART 10: OFFICES RLS (Simple)
-- ============================================

-- Drop all existing offices policies
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'offices'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.offices', p.policyname);
  END LOOP;
END $$;

CREATE POLICY offices_select
ON public.offices FOR SELECT
USING (id = public.get_my_office_id() OR owner_id = auth.uid());

CREATE POLICY offices_insert
ON public.offices FOR INSERT
WITH CHECK (owner_id = auth.uid());

CREATE POLICY offices_update
ON public.offices FOR UPDATE
USING (owner_id = auth.uid() OR (public.get_my_role() = 'broker' AND id = public.get_my_office_id()))
WITH CHECK (owner_id = auth.uid() OR (public.get_my_role() = 'broker' AND id = public.get_my_office_id()));

-- ============================================
-- DONE - Reload schema
-- ============================================

NOTIFY pgrst, 'reload schema';
