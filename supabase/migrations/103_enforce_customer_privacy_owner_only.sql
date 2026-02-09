-- Enforce strict customer privacy per consultant (owner-only visibility)
-- Date: 2026-02-08

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS user_id uuid;

ALTER TABLE public.customers
  ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'customers'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.customers', p.policyname);
  END LOOP;
END $$;

CREATE POLICY customers_owner_only_select
ON public.customers
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY customers_owner_only_insert
ON public.customers
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY customers_owner_only_update
ON public.customers
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY customers_owner_only_delete
ON public.customers
FOR DELETE
USING (user_id = auth.uid());
