-- FIX INSERT POLICIES FOR CUSTOMERS AND ACTIVITIES
-- The current policies use USING clause but INSERT operations require WITH CHECK clause

-- 1. CUSTOMERS: Drop and recreate with proper INSERT support
DROP POLICY IF EXISTS "Strict Private Customers" ON public.customers;

-- SELECT/UPDATE/DELETE: User can only access their own customers
CREATE POLICY "Customers Select Own" ON public.customers
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Customers Update Own" ON public.customers
    FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Customers Delete Own" ON public.customers
    FOR DELETE
    USING (user_id = auth.uid());

-- INSERT: User can insert if they set user_id to their own ID
CREATE POLICY "Customers Insert Own" ON public.customers
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- 2. ACTIVITIES: Drop and recreate with proper INSERT support
DROP POLICY IF EXISTS "Strict Private Activities" ON public.activities;

-- SELECT/UPDATE/DELETE: User can only access their own activities
CREATE POLICY "Activities Select Own" ON public.activities
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Activities Update Own" ON public.activities
    FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Activities Delete Own" ON public.activities
    FOR DELETE
    USING (user_id = auth.uid());

-- INSERT: User can insert if they set user_id to their own ID
CREATE POLICY "Activities Insert Own" ON public.activities
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- 3. REQUESTS: Drop and recreate with proper INSERT support
DROP POLICY IF EXISTS "Strict Private Requests" ON public.requests;

-- SELECT/UPDATE/DELETE: User can only access their own requests
CREATE POLICY "Requests Select Own" ON public.requests
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Requests Update Own" ON public.requests
    FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Requests Delete Own" ON public.requests
    FOR DELETE
    USING (user_id = auth.uid());

-- INSERT: User can insert if they set user_id to their own ID
CREATE POLICY "Requests Insert Own" ON public.requests
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

NOTIFY pgrst, 'reload schema';
