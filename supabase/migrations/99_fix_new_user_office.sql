-- FIX: Assign users without office to the default office
-- Run this in Supabase SQL Editor

-- 1. First, ensure we have the correct office ID
-- We'll use the one from the Broker (assuming the first user who created an office)
DO $$
DECLARE
    v_office_id UUID;
BEGIN
    -- Try to find an office ID from any existing office
    SELECT id INTO v_office_id FROM public.offices LIMIT 1;
    
    IF v_office_id IS NOT NULL THEN
        -- Link profiles without office_id to this office
        UPDATE public.profiles
        SET office_id = v_office_id
        WHERE office_id IS NULL;
        
        RAISE NOTICE 'Profiles updated with office_id: %', v_office_id;
        
        -- Also fix data linked to these users just in case
        UPDATE public.properties SET office_id = v_office_id WHERE office_id IS NULL AND user_id IN (SELECT id FROM public.profiles WHERE office_id = v_office_id);
        UPDATE public.customers SET office_id = v_office_id WHERE office_id IS NULL AND user_id IN (SELECT id FROM public.profiles WHERE office_id = v_office_id);
    ELSE
        RAISE WARNING 'No office found to link profiles to.';
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
