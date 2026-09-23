-- crm_search_tags uses an empty search_path. The office lookup invoked by
-- existing RLS policies must therefore qualify the profiles table itself.
-- CREATE OR REPLACE preserves the function's owner and existing grants.
CREATE OR REPLACE FUNCTION public.get_user_office_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT office_id FROM public.profiles WHERE id = auth.uid()
$$;
