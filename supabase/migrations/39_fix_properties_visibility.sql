-- FIX PROPERTIES VISIBILITY
-- Problem: Properties not showing for users
-- Solution: Simplify RLS policy to match other tables

-- First, let's check the current user info (run this in SQL Editor to diagnose)
-- SELECT
--   auth.uid() as current_user_id,
--   public.get_my_office_id() as my_office_id,
--   public.get_my_role() as my_role;

-- Check how many properties exist
-- SELECT COUNT(*) as total_properties FROM properties;
-- SELECT COUNT(*) as my_properties FROM properties WHERE user_id = auth.uid();
-- SELECT COUNT(*) as office_properties FROM properties WHERE office_id = public.get_my_office_id();

-- ============================================
-- FIX: Recreate properties RLS policies
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

-- SELECT: Office members can view all office properties OR own properties OR published properties
CREATE POLICY "properties_select_policy"
ON public.properties FOR SELECT
USING (
  -- Own properties
  user_id = auth.uid()
  OR
  -- Office properties (check office_id matches)
  office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid())
  OR
  -- Published properties (public access)
  COALESCE("publishedOnPersonalSite", false) = true
  OR
  COALESCE("publishedOnMarketplace", false) = true
);

-- INSERT: Users can insert properties for themselves
CREATE POLICY "properties_insert_policy"
ON public.properties FOR INSERT
WITH CHECK (
  auth.uid() = user_id
);

-- UPDATE: Owner or broker can update
CREATE POLICY "properties_update_policy"
ON public.properties FOR UPDATE
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('broker', 'ofis_broker', 'admin', 'owner')
    AND office_id = properties.office_id
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('broker', 'ofis_broker', 'admin', 'owner')
    AND office_id = properties.office_id
  )
);

-- DELETE: Owner or broker can delete
CREATE POLICY "properties_delete_policy"
ON public.properties FOR DELETE
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('broker', 'ofis_broker', 'admin', 'owner')
    AND office_id = properties.office_id
  )
);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
