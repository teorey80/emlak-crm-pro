-- FINAL STABILIZATION FIX
-- This script combines previous fixes to ensure:
-- 1. You can see your own Properties (even if office link was lost).
-- 2. You can see your own Profile and Team members.
-- 3. It repairs the data connections.

-- A. FIX PROPERTY VISIBILITY
DROP POLICY IF EXISTS "View Office Properties" ON public.properties;

CREATE POLICY "View Office Properties" ON public.properties
    FOR SELECT
    USING (
        -- 1. Always see properties YOU created
        user_id = auth.uid()
        OR 
        -- 2. See properties in your OFFICE (if linked)
        (office_id IS NOT NULL AND office_id IN (
            SELECT office_id FROM public.profiles WHERE id = auth.uid()
        ))
    );

-- B. REPAIR PROPERTY DATA (Backfill Office ID)
UPDATE public.properties p
SET office_id = pr.office_id
FROM public.profiles pr
WHERE p.user_id = pr.id
AND p.office_id IS NULL;


-- C. FIX PROFILE VISIBILITY (Avatar, Name, Team)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop potentially conflicting old policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Consultants can view their office" ON public.profiles;
DROP POLICY IF EXISTS "Manage Own Profile" ON public.profiles;
DROP POLICY IF EXISTS "View Office Team" ON public.profiles;

-- Allow users to manage their own profile
CREATE POLICY "Manage Own Profile" ON public.profiles
    FOR ALL
    USING (id = auth.uid());

-- Allow view of team members
CREATE POLICY "View Office Team" ON public.profiles
    FOR SELECT
    USING (
        office_id IS NOT NULL 
        AND 
        office_id IN (
            SELECT office_id FROM public.profiles WHERE id = auth.uid()
        )
    );

NOTIFY pgrst, 'reload schema';
