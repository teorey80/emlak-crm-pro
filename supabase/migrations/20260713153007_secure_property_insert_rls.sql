-- Portföy yazma işlemleri yalnızca kimliği doğrulanmış kullanıcılar tarafından
-- ve kendi user_id değerleriyle yapılabilsin.

DROP POLICY IF EXISTS "anon_insert_properties" ON public.properties;
DROP POLICY IF EXISTS "properties_insert_policy" ON public.properties;

REVOKE INSERT, UPDATE, DELETE ON TABLE public.properties FROM anon;
GRANT SELECT ON TABLE public.properties TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.properties TO authenticated;

CREATE POLICY "properties_insert_policy"
ON public.properties
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

COMMENT ON POLICY "properties_insert_policy" ON public.properties IS
  'Authenticated users can only create properties owned by their own auth user.';
