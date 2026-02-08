-- Fix activities RLS policies that block valid inserts from app
-- Date: 2026-02-08

-- 1) Ensure columns used by policies exist
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS office_id uuid;

-- 2) Default user_id to current auth user for safer inserts
ALTER TABLE public.activities
  ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 3) Drop all existing policies on activities to avoid legacy conflicts
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'activities'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.activities', p.policyname);
  END LOOP;
END $$;

-- 4) Recreate deterministic policies
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY activities_select_owner_or_office
ON public.activities
FOR SELECT
USING (
  user_id = auth.uid()
  OR (
    office_id IS NOT NULL
    AND office_id = (
      SELECT office_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY activities_insert_owner_only
ON public.activities
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY activities_update_owner_or_office
ON public.activities
FOR UPDATE
USING (
  user_id = auth.uid()
  OR (
    office_id IS NOT NULL
    AND office_id = (
      SELECT office_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY activities_delete_owner_only
ON public.activities
FOR DELETE
USING (user_id = auth.uid());
