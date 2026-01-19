-- SECURITY CLEANUP AND STRICT ENFORCEMENT
-- This script drops all previous permissive policies and applies strict multi-user rules.

-- 1. CUSTOMERS: STRICT PRIVATE ACCESS
-- Drop potentially conflicting policies from previous migrations
DROP POLICY IF EXISTS "Public Profile" ON public.customers;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.customers;
DROP POLICY IF EXISTS "Private Customer Access" ON public.customers;
DROP POLICY IF EXISTS "Users can view customers in their office" ON public.customers;

-- Apply STRICT Policy: Users only see what they created
DROP POLICY IF EXISTS "Strict Private Customers" ON public.customers;
CREATE POLICY "Strict Private Customers" ON public.customers
    FOR ALL
    USING (user_id = auth.uid());

-- 2. PROPERTIES: OFFICE-WIDE VISIBILITY
-- Drop existing policies
DROP POLICY IF EXISTS "Users view office properties" ON public.properties;
DROP POLICY IF EXISTS "Brokers manage office properties" ON public.properties;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.properties;
DROP POLICY IF EXISTS "View Office Properties" ON public.properties;
DROP POLICY IF EXISTS "Manage Office Properties" ON public.properties;

-- Policy A: VIEW (Select)
-- Users can see ALL properties that belong to their OFFICE.
CREATE POLICY "View Office Properties" ON public.properties
    FOR SELECT
    USING (
        office_id IN (
            SELECT office_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Policy B: MANAGE (Insert/Update/Delete)
-- Option 1: Brokers can manage ALL in office.
-- Option 2: Consultants can manage ONLY their own.
CREATE POLICY "Manage Office Properties" ON public.properties
    FOR ALL
    USING (
        -- User is the owner (creator) of the property
        user_id = auth.uid() 
        OR 
        -- User is a Broker in the same office
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'broker' 
            AND office_id = public.properties.office_id
        )
    );

-- 3. ACTIVITIES & REQUESTS: PRIVATE (Follows Customer Privacy)
DROP POLICY IF EXISTS "Activity Access" ON public.activities;
DROP POLICY IF EXISTS "Strict Private Activities" ON public.activities;
CREATE POLICY "Strict Private Activities" ON public.activities
    FOR ALL
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Request Access" ON public.requests;
DROP POLICY IF EXISTS "Strict Private Requests" ON public.requests;
CREATE POLICY "Strict Private Requests" ON public.requests
    FOR ALL
    USING (user_id = auth.uid());

NOTIFY pgrst, 'reload schema';
