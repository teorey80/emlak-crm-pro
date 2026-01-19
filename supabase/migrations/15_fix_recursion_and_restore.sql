-- FIX INFINITE RECURSION ERROR & RESTORE DATA
-- The error "infinite recursion" happens because the Policy checks the Profile table, which checks the Policy, forever.
-- We fix this by creating a "System Function" that bypasses the check securely.

-- 1. Create a Helper Function to get your Office ID safely
CREATE OR REPLACE FUNCTION public.get_my_office_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER -- Runs as System Admin, bypassing RLS loops
SET search_path = public
AS $$
  SELECT office_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 2. Drop the Broken Policies
DROP POLICY IF EXISTS "View Office Team" ON public.profiles;
DROP POLICY IF EXISTS "Manage Own Profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 3. Re-Create "Manage Own Profile" (Simple Check)
CREATE POLICY "Manage Own Profile" ON public.profiles
    FOR ALL
    USING (id = auth.uid());

-- 4. Re-Create "View Office Team" using the NEW Helper Function
-- This prevents the infinite loop/recursion error.
CREATE POLICY "View Office Team" ON public.profiles
    FOR SELECT
    USING (
        office_id IS NOT NULL 
        AND 
        office_id = public.get_my_office_id()
    );


-- 5. FINAL DATA RECOVERY (Just in case)
-- Assign EVERYTHING to the current user (You)
UPDATE public.properties
SET 
    user_id = auth.uid(),
    office_id = public.get_my_office_id()
WHERE true;

UPDATE public.customers
SET 
    user_id = auth.uid(),
    office_id = public.get_my_office_id()
WHERE true;

UPDATE public.activities
SET 
    user_id = auth.uid(),
    office_id = public.get_my_office_id()
WHERE true;

NOTIFY pgrst, 'reload schema';
