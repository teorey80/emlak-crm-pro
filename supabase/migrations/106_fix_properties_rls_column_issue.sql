-- Fix RLS policy that references potentially non-existent columns
-- Date: 2026-02-10
-- Issue: properties_select_policy references "publishedOnPersonalSite" and "publishedOnMarketplace"
--        columns which may not exist, causing all property queries to fail

BEGIN;

-- First, ensure the columns exist (safe to run if already exists)
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS "publishedOnPersonalSite" boolean DEFAULT false;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS "publishedOnMarketplace" boolean DEFAULT false;

-- Drop the existing policy
DROP POLICY IF EXISTS properties_select_policy ON public.properties;

-- Recreate with safer column handling
-- Check if columns exist before referencing them in the USING clause
CREATE POLICY properties_select_policy
ON public.properties
FOR SELECT
USING (
  user_id = auth.uid()
  OR (office_id IS NOT NULL AND office_id = public.get_my_office_id())
  OR COALESCE("publishedOnPersonalSite", false) = true
  OR COALESCE("publishedOnMarketplace", false) = true
);

COMMIT;

NOTIFY pgrst, 'reload schema';
