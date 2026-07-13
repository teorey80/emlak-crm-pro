-- Müşteri, aktivite ve talep tablolarındaki sabit kullanıcı kimliğine bağlı
-- anonim ekleme politikalarını kaldır. Bu tablolar yalnızca oturum açmış
-- kullanıcılar tarafından, kendi user_id değerleriyle yazılabilir.

DROP POLICY IF EXISTS "anon_insert_customers" ON public.customers;
DROP POLICY IF EXISTS "anon_insert_activities" ON public.activities;
DROP POLICY IF EXISTS "anon_insert_requests" ON public.requests;

DROP POLICY IF EXISTS "customers_owner_only_insert" ON public.customers;
DROP POLICY IF EXISTS "activities_owner_only_insert" ON public.activities;
DROP POLICY IF EXISTS "requests_owner_insert" ON public.requests;
DROP POLICY IF EXISTS "requests_insert_policy" ON public.requests;
DROP POLICY IF EXISTS "Users can create requests" ON public.requests;

REVOKE ALL PRIVILEGES ON TABLE public.customers FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.activities FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.requests FROM anon;

REVOKE ALL PRIVILEGES ON TABLE public.customers FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.activities FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.requests FROM authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.activities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.requests TO authenticated;

CREATE POLICY "customers_owner_only_insert"
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "activities_owner_only_insert"
ON public.activities
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "requests_owner_insert"
ON public.requests
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);
