-- Fix subscriptions table RLS policies
-- Date: 2026-02-10
-- Issue: 500 error when querying subscriptions table

BEGIN;

-- Ensure subscriptions table has RLS enabled
ALTER TABLE IF EXISTS public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DO $$
DECLARE
  p RECORD;
BEGIN
  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'subscriptions'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.subscriptions', p.policyname);
  END LOOP;
END $$;

-- Create simple RLS policies for subscriptions
-- Users can view their own subscription
CREATE POLICY subscriptions_select_own
ON public.subscriptions
FOR SELECT
USING (user_id = auth.uid());

-- Users can view subscriptions for their office
CREATE POLICY subscriptions_select_office
ON public.subscriptions
FOR SELECT
USING (office_id = (SELECT office_id FROM public.profiles WHERE id = auth.uid() LIMIT 1));

-- Users can insert their own subscription
CREATE POLICY subscriptions_insert_own
ON public.subscriptions
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own subscription
CREATE POLICY subscriptions_update_own
ON public.subscriptions
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

COMMIT;

NOTIFY pgrst, 'reload schema';
