-- FOOLPROOF RECOVERY: Assign EVERYTHING to 'teorey@gmail.com'
-- This script avoids 'auth.uid()' entirely to prevent errors.

DO $$
DECLARE
    -- Find the specific user ID for this email
    target_user_id UUID;
    target_office_id UUID;
    target_email TEXT := 'teorey@gmail.com';
BEGIN
    -- 1. Get IDs from Profiles (or auth.users if needed, but profiles is safer for office link)
    SELECT id, office_id INTO target_user_id, target_office_id
    FROM public.profiles
    WHERE email = target_email
    LIMIT 1;

    -- Safety Check
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'CRITICIAL: User % not found! Cannot recover data.', target_email;
    END IF;

    RAISE NOTICE 'Recovering ALL data for User: %', target_user_id;

    -- 2. FORCE ASSIGN ALL PROPERTIES
    UPDATE public.properties
    SET 
        user_id = target_user_id,
        office_id = target_office_id
    WHERE true; -- Applies to EVERY single property in the DB

    -- 3. FORCE ASSIGN ALL CUSTOMERS
    UPDATE public.customers
    SET 
        user_id = target_user_id,
        office_id = target_office_id
    WHERE true; -- Applies to EVERY single customer

    -- 4. FORCE ASSIGN ALL ACTIVITIES
    UPDATE public.activities
    SET 
        user_id = target_user_id,
        office_id = target_office_id
    WHERE true;

    -- 5. FORCE ASSIGN ALL REQUESTS
    UPDATE public.requests
    SET 
        user_id = target_user_id,
        office_id = target_office_id
    WHERE true;

END $$;

-- 6. Ensure RLS is Enabled (Security ON)
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
