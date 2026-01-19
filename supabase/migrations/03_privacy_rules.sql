-- PRIVACY UPDATE: Enforce "Private Customer List" Rule
-- Run this script to update RLS policies.

-- 1. Customers Table: Strict Privacy
-- User can ONLY see customers they created.
DROP POLICY IF EXISTS "Public Profile" ON public.customers; -- Cleaning up old permissive policies if any
DROP POLICY IF EXISTS "Enable read access for all users" ON public.customers;

-- Enable RLS (Should be already on, but safe to repeat)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- NEW POLICY: "Only Owner Sees Customer"
DROP POLICY IF EXISTS "Private Customer Access" ON public.customers;
CREATE POLICY "Private Customer Access" ON public.customers
    FOR ALL
    USING (user_id = auth.uid()); -- Only the creator can See/Edit/Delete

-- 2. Activities: Mixed Privacy (Optional, but let's stick to user request "kimse kimseyi görmesin")
-- If activity is linked to a Property, maybe shared? 
-- User said "kimse kimsenin müşteri bilgisini görmemeli".
-- So Activities linked to customers should also be private?
-- Let's make Activities private to the creator for now to be safe.

DROP POLICY IF EXISTS "Activity Access" ON public.activities;
CREATE POLICY "Activity Access" ON public.activities
    FOR ALL
    USING (user_id = auth.uid());

-- 3. Requests: Same logic
DROP POLICY IF EXISTS "Request Access" ON public.requests;
CREATE POLICY "Request Access" ON public.requests
    FOR ALL
    USING (user_id = auth.uid());

-- 4. Properties: Shared Visibility (Already set in previous migration, but let's reaffirm)
-- "Users view office properties" policy handles Visibility.
-- Privacy of "contact info" is handled in frontend masking as requested.
