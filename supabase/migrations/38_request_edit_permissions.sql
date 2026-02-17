-- REQUEST EDIT PERMISSIONS
-- Danışmanlar: Tüm talepleri görebilir, sadece kendilerininkini düzenleyebilir
-- Broker: Tüm talepleri görebilir ve düzenleyebilir

-- 1. Drop existing request policies
DROP POLICY IF EXISTS "View Office Requests" ON public.requests;
DROP POLICY IF EXISTS "Manage Office Requests" ON public.requests;
DROP POLICY IF EXISTS "All users see all requests" ON public.requests;
DROP POLICY IF EXISTS "Users update only own requests" ON public.requests;
DROP POLICY IF EXISTS "Users insert own requests" ON public.requests;
DROP POLICY IF EXISTS "Users delete own requests" ON public.requests;

-- 2. SELECT: All office members can view all office requests
CREATE POLICY "Office members view all requests"
ON public.requests FOR SELECT
USING (
    office_id IN (
        SELECT office_id FROM public.profiles WHERE id = auth.uid()
    )
    OR user_id = auth.uid()
);

-- 3. INSERT: Users can create requests for their office
CREATE POLICY "Users can create requests"
ON public.requests FOR INSERT
WITH CHECK (
    auth.uid() = user_id
    OR
    office_id IN (
        SELECT office_id FROM public.profiles WHERE id = auth.uid()
    )
);

-- 4. UPDATE: Only owner OR broker can edit
CREATE POLICY "Only owner or broker can update requests"
ON public.requests FOR UPDATE
USING (
    user_id = auth.uid()
    OR
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('broker', 'ofis_broker', 'admin', 'owner')
        AND office_id = requests.office_id
    )
)
WITH CHECK (
    user_id = auth.uid()
    OR
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('broker', 'ofis_broker', 'admin', 'owner')
        AND office_id = requests.office_id
    )
);

-- 5. DELETE: Only owner OR broker can delete
CREATE POLICY "Only owner or broker can delete requests"
ON public.requests FOR DELETE
USING (
    user_id = auth.uid()
    OR
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('broker', 'ofis_broker', 'admin', 'owner')
        AND office_id = requests.office_id
    )
);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
