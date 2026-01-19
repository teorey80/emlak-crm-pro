-- DIAGNOSTIC SCRIPT: CHECK USER LINKAGE
DO $$
DECLARE
    u1_email TEXT := 'teorey@gmail.com';
    u2_email TEXT := 'a2ticarihesap@gmail.com';
    u1_id UUID;
    u2_id UUID;
    u1_office UUID;
    u2_office UUID;
    u1_role TEXT;
    u2_role TEXT;
BEGIN
    -- Get User 1 (Broker)
    SELECT id, office_id, role INTO u1_id, u1_office, u1_role FROM public.profiles WHERE email = u1_email;
    
    -- Get User 2 (New)
    SELECT id, office_id, role INTO u2_id, u2_office, u2_role FROM public.profiles WHERE email = u2_email;

    RAISE NOTICE '--- DIAGNOSTIC RESULT ---';
    RAISE NOTICE 'BROKER (%): ID=%, Office=%, Role=%', u1_email, u1_id, u1_office, u1_role;
    RAISE NOTICE 'NEW (%): ID=%, Office=%, Role=%', u2_email, u2_id, u2_office, u2_role;
    RAISE NOTICE 'MATCH?: %', (u1_office = u2_office);

    -- Check if Office Exists
    PERFORM id FROM public.offices WHERE id = u1_office;
    IF FOUND THEN
        RAISE NOTICE 'Broker Office EXISTS in offices table.';
    ELSE
        RAISE NOTICE 'WARNING: Broker Office ID % NOT FOUND in offices table!', u1_office;
    END IF;

    -- Check Permissions (Simulated)
    -- Just reporting counts
    DECLARE
        prop_count INT;
    BEGIN
        SELECT COUNT(*) INTO prop_count FROM public.properties WHERE office_id = u1_office;
        RAISE NOTICE 'Properties in Broker Office: %', prop_count;
    END;

END $$;
