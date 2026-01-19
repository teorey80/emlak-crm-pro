-- FIX PROFILES RLS: Allow users to Join Office and View Team
-- This script ensures users can update their own office_id and see their colleagues.

-- 1. Enable RLS (Ensure it's on)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing potentially restrictive policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Consultants can view their office" ON public.profiles; -- Old name

-- 3. Policy: MANAGE OWN PROFILE
-- Users must be able to:
-- INSERT (Trigger usually does this, but safe to allow)
-- UPDATE (To set office_id, role, avatar, name)
-- SELECT (To see own data)
CREATE POLICY "Manage Own Profile" ON public.profiles
    FOR ALL
    USING (id = auth.uid());

-- 4. Policy: VIEW OFFICE MEMBERS
-- Users can see other profiles IF they are in the same office.
-- This allows the "Ekibim" (Team) page to work.
CREATE POLICY "View Office Team" ON public.profiles
    FOR SELECT
    USING (
        -- User can see profile IF:
        -- 1. It is their own profile (covered above, but redundant is fine)
        -- 2. OR the target profile is in the same office
        office_id IS NOT NULL 
        AND 
        office_id IN (
            SELECT office_id FROM public.profiles WHERE id = auth.uid()
        )
    );

NOTIFY pgrst, 'reload schema';
