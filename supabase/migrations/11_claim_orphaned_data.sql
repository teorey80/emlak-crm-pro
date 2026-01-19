-- EMERGENCY DATA RECOVERY: Claim Orphaned Properties
-- This script finds properties that belong to users who no longer exist (deleted accounts)
-- and assigns them to YOU (the person running this script).

-- 1. Claim Properties where the owner (user_id) is NOT found in the profiles table
-- This assumes that if a profile doesn't exist, the user was deleted.
UPDATE public.properties
SET 
    user_id = auth.uid(),
    office_id = (SELECT office_id FROM public.profiles WHERE id = auth.uid())
WHERE 
    user_id NOT IN (SELECT id FROM public.profiles);

-- 2. Also claim Customers
UPDATE public.customers
SET 
    user_id = auth.uid(),
    office_id = (SELECT office_id FROM public.profiles WHERE id = auth.uid())
WHERE 
    user_id NOT IN (SELECT id FROM public.profiles);

-- 3. Also claim Activities
UPDATE public.activities
SET 
    user_id = auth.uid(),
    office_id = (SELECT office_id FROM public.profiles WHERE id = auth.uid())
WHERE 
    user_id NOT IN (SELECT id FROM public.profiles);

-- 4. Also claim Requests
UPDATE public.requests
SET 
    user_id = auth.uid(),
    office_id = (SELECT office_id FROM public.profiles WHERE id = auth.uid())
WHERE 
    user_id NOT IN (SELECT id FROM public.profiles);

NOTIFY pgrst, 'reload schema';
