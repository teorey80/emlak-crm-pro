-- FIX: Link Test User & Fix Registration Permission Issues

-- 1. MANUAL FIX for 'Test A2' (a2ticarihesap@gmail.com)
-- We assign them to your office directly.
UPDATE public.profiles
SET 
  office_id = '6149d72f-63e0-40c6-84b2-d4008319a8bd', -- Your Broker Office ID
  role = 'consultant'
WHERE id = 'e6a7a5fa-3ea0-4581-85e2-f6d27031e431';   -- Test A2 User ID

-- 2. SYSTEM FIX: Allow Reading Office Names
-- New users need to read office names to verify invite links.
DROP POLICY IF EXISTS "Allow Reading Offices" ON public.offices;
CREATE POLICY "Allow Reading Offices" ON public.offices
FOR SELECT
TO authenticated
USING (true);

-- 3. SYSTEM FIX: Allow Self-Update of Office ID (Joining)
-- Ensure users can update their own profile to join an office.
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 4. ROBUST FIX: RPC Function for Joining
-- To avoid RLS complexity in frontend, we add a function.
CREATE OR REPLACE FUNCTION public.join_office_secure(target_office_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET 
    office_id = target_office_id,
    role = 'consultant'
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Force Refresh to ensure caches are cleared
NOTIFY pgrst, 'reload schema';
