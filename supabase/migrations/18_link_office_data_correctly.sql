-- FIX: Link New Properties to Office & Ensure Visibility

-- 1. Identify Office ID
-- We know it is '6149d72f-63e0-40c6-84b2-d4008319a8bd'

-- 2. Force-Update Properties for known users
-- We assign the correct office_id to properties owned by Consultant or Broker
UPDATE public.properties
SET office_id = '6149d72f-63e0-40c6-84b2-d4008319a8bd'
WHERE user_id IN (
    'e6a7a5fa-3ea0-4581-85e2-f6d27031e431', -- Consultant (Test A2)
    (SELECT id FROM public.profiles WHERE email = 'teorey@gmail.com') -- Broker
);

-- 3. Also fix Customers (Same logic)
UPDATE public.customers
SET office_id = '6149d72f-63e0-40c6-84b2-d4008319a8bd'
WHERE user_id IN (
    'e6a7a5fa-3ea0-4581-85e2-f6d27031e431',
    (SELECT id FROM public.profiles WHERE email = 'teorey@gmail.com')
);

-- 4. Ensure RLS is definitely correct for bi-directional visibility
DROP POLICY IF EXISTS "View Office Properties" ON public.properties;
CREATE POLICY "View Office Properties" ON public.properties
    FOR SELECT
    USING (
        user_id = auth.uid() 
        OR 
        (office_id IS NOT NULL AND office_id = (SELECT office_id FROM public.profiles WHERE id = auth.uid()))
    );

NOTIFY pgrst, 'reload schema';
