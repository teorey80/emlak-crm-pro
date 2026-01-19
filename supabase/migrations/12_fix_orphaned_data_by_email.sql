-- EMERGENCY RECOVERY BY EMAIL
-- This script finds the user ID for 'teorey@gmail.com' and assigns all orphaned data to them.

DO $$
DECLARE
    target_user_id UUID;
    target_office_id UUID;
    target_email TEXT := 'teorey@gmail.com';
BEGIN
    -- 1. Get the User ID and Office ID for the email
    SELECT id, office_id INTO target_user_id, target_office_id
    FROM public.profiles
    WHERE email = target_email
    LIMIT 1;

    -- If user not found, raise an error
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found in profiles table!', target_email;
    END IF;

    RAISE NOTICE 'Recovering data for User ID: % (Office: %)', target_user_id, target_office_id;

    -- 2. Recover Properties (where user_id is NULL or belongs to deleted user)
    -- We assume any property NOT linked to an existing profile belongs to this user now.
    UPDATE public.properties
    SET 
        user_id = target_user_id,
        office_id = target_office_id
    WHERE 
        user_id IS NULL 
        OR user_id NOT IN (SELECT id FROM public.profiles);

    -- 3. Recover Customers
    UPDATE public.customers
    SET 
        user_id = target_user_id,
        office_id = target_office_id
    WHERE 
        user_id IS NULL 
        OR user_id NOT IN (SELECT id FROM public.profiles);

    -- 4. Recover Activities
    UPDATE public.activities
    SET 
        user_id = target_user_id,
        office_id = target_office_id
    WHERE 
        user_id IS NULL 
        OR user_id NOT IN (SELECT id FROM public.profiles);

    -- 5. Recover Requests
    UPDATE public.requests
    SET 
        user_id = target_user_id,
        office_id = target_office_id
    WHERE 
        user_id IS NULL 
        OR user_id NOT IN (SELECT id FROM public.profiles);

END $$;

NOTIFY pgrst, 'reload schema';
