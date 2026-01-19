-- ABSOLUTE FIX: Create Office, Link User, Recover Data
-- This script ensures you have an Office, and then moves ALL data into that Office.

DO $$
DECLARE
    target_email TEXT := 'teorey@gmail.com';
    target_user_id UUID;
    target_office_id UUID;
BEGIN
    -- 1. Find the User ID
    SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User % not found in auth.users', target_email;
    END IF;

    -- 2. Check/Get Office ID from Profile
    SELECT office_id INTO target_office_id FROM public.profiles WHERE id = target_user_id;

    -- 3. If No Office (NULL), CREATE ONE immediately
    IF target_office_id IS NULL THEN
        RAISE NOTICE 'Creating new Office for user...';
        
        INSERT INTO public.offices (name, owner_id)
        VALUES ('Ana Ofis', target_user_id)
        RETURNING id INTO target_office_id;

        -- Update Profile to link to this new office
        UPDATE public.profiles
        SET office_id = target_office_id, role = 'broker'
        WHERE id = target_user_id;
    END IF;

    RAISE NOTICE 'Using User ID: % and Office ID: %', target_user_id, target_office_id;

    -- 4. ASSIGN ALL DATA TO THIS USER & OFFICE
    -- This brings back Properties, Customers, Activities
    
    -- Properties
    UPDATE public.properties
    SET user_id = target_user_id, office_id = target_office_id
    WHERE true; -- Apply to ALL

    -- Customers
    UPDATE public.customers
    SET user_id = target_user_id, office_id = target_office_id
    WHERE true;

    -- Activities
    UPDATE public.activities
    SET user_id = target_user_id, office_id = target_office_id
    WHERE true;

    -- Requests
    UPDATE public.requests
    SET user_id = target_user_id, office_id = target_office_id
    WHERE true;

END $$;

-- 5. RELAX POLICIES (Safety Net)
-- Ensure Owners can ALWAYS see their data, even if office logic fails
DROP POLICY IF EXISTS "View Office Properties" ON public.properties;
CREATE POLICY "View Office Properties" ON public.properties
    FOR SELECT
    USING (
        user_id = auth.uid() -- Owner always sees
        OR 
        (office_id IS NOT NULL AND office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid()))
    );

DROP POLICY IF EXISTS "View Office Customers" ON public.customers;
CREATE POLICY "View Office Customers" ON public.customers
    FOR SELECT
    USING (
        user_id = auth.uid() -- Owner always sees
        OR 
        (office_id IS NOT NULL AND office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid()))
    );

NOTIFY pgrst, 'reload schema';
