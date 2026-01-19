-- NUCLEAR PRIVACY FIX: Drop ALL policies and re-apply STRICT rules
-- This script dynamically finds and drops ALL policies on key tables to ensure NO leaks remain.

DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. DROP ALL POLICIES ON CUSTOMERS
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'customers' AND schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.customers', r.policyname);
    END LOOP;

    -- 2. DROP ALL POLICIES ON PROPERTIES
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'properties' AND schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.properties', r.policyname);
    END LOOP;

    -- 3. DROP ALL POLICIES ON ACTIVITIES
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'activities' AND schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.activities', r.policyname);
    END LOOP;

    -- 4. DROP ALL POLICIES ON REQUESTS
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'requests' AND schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.requests', r.policyname);
    END LOOP;
END $$;

-- NOW RE-APPLY STRICT POLICIES

-- 1. CUSTOMERS: STRICT PRIVATE ACCESS
-- Users can ONLY see/edit customers they created.
CREATE POLICY "Strict Private Customers" ON public.customers
    FOR ALL
    USING (user_id = auth.uid());

-- 2. PROPERTIES: OFFICE-WIDE VISIBILITY
-- View: All users in the office can VIEW.
CREATE POLICY "View Office Properties" ON public.properties
    FOR SELECT
    USING (
        office_id IN (
            SELECT office_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Manage: Only Owner or Broker can MANAGE (Edit/Delete).
CREATE POLICY "Manage Office Properties" ON public.properties
    FOR ALL
    USING (
        -- User is the owner (creator)
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

-- 3. ACTIVITIES: PRIVATE
CREATE POLICY "Strict Private Activities" ON public.activities
    FOR ALL
    USING (user_id = auth.uid());

-- 4. REQUESTS: PRIVATE
CREATE POLICY "Strict Private Requests" ON public.requests
    FOR ALL
    USING (user_id = auth.uid());

NOTIFY pgrst, 'reload schema';
