-- Deterministic baseline for privacy + office visibility
-- Date: 2026-02-09
-- Goals:
-- 1) Customers/Activities are owner-only.
-- 2) Properties/Requests/Sales are office-visible (for matching and team stats).
-- 3) Team page works by repairing missing profile/office links.

BEGIN;

-- ------------------------------------------------------------------
-- Helper functions (security definer to avoid recursive RLS checks)
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_office_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT office_id
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- ------------------------------------------------------------------
-- Data repair: make sure every auth user has a profile
-- ------------------------------------------------------------------
INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
SELECT
  u.id,
  u.email,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1)
  ) AS full_name,
  CONCAT('https://ui-avatars.com/api/?name=', replace(COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)), ' ', '+')),
  'consultant'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- If a user owns an office, but profile.office_id is null, link it
UPDATE public.profiles p
SET office_id = o.id
FROM public.offices o
WHERE p.office_id IS NULL
  AND o.owner_id = p.id;

-- If there is exactly one office in the system, link remaining null profiles to it
DO $$
DECLARE
  v_count int;
  v_office uuid;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.offices;
  SELECT id INTO v_office
  FROM public.offices
  ORDER BY created_at NULLS LAST, id
  LIMIT 1;
  IF v_count = 1 THEN
    UPDATE public.profiles
    SET office_id = v_office
    WHERE office_id IS NULL;
  END IF;
END $$;

-- Backfill office_id in business tables from profile links
UPDATE public.properties pr
SET office_id = pf.office_id
FROM public.profiles pf
WHERE pr.office_id IS NULL
  AND pr.user_id = pf.id
  AND pf.office_id IS NOT NULL;

UPDATE public.customers c
SET office_id = pf.office_id
FROM public.profiles pf
WHERE c.office_id IS NULL
  AND c.user_id = pf.id
  AND pf.office_id IS NOT NULL;

UPDATE public.activities a
SET office_id = pf.office_id
FROM public.profiles pf
WHERE a.office_id IS NULL
  AND a.user_id = pf.id
  AND pf.office_id IS NOT NULL;

UPDATE public.requests r
SET office_id = pf.office_id
FROM public.profiles pf
WHERE r.office_id IS NULL
  AND r.user_id = pf.id
  AND pf.office_id IS NOT NULL;

UPDATE public.sales s
SET office_id = pf.office_id
FROM public.profiles pf
WHERE s.office_id IS NULL
  AND s.user_id = pf.id
  AND pf.office_id IS NOT NULL;

-- ------------------------------------------------------------------
-- Enable RLS
-- ------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offices ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------
-- Drop all existing policies on target tables (remove legacy conflicts)
-- ------------------------------------------------------------------
DO $$
DECLARE
  p RECORD;
BEGIN
  FOR p IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('profiles', 'properties', 'customers', 'activities', 'requests', 'sales', 'offices')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, p.tablename);
  END LOOP;
END $$;

-- ------------------------------------------------------------------
-- Profiles: own profile + same-office team visibility
-- ------------------------------------------------------------------
CREATE POLICY profiles_select_policy
ON public.profiles
FOR SELECT
USING (
  id = auth.uid()
  OR (office_id IS NOT NULL AND office_id = public.get_my_office_id())
);

CREATE POLICY profiles_insert_policy
ON public.profiles
FOR INSERT
WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update_policy
ON public.profiles
FOR UPDATE
USING (
  id = auth.uid()
  OR (
    public.get_my_role() = 'broker'
    AND office_id IS NOT NULL
    AND office_id = public.get_my_office_id()
  )
)
WITH CHECK (
  id = auth.uid()
  OR (
    public.get_my_role() = 'broker'
    AND office_id IS NOT NULL
    AND office_id = public.get_my_office_id()
  )
);

-- ------------------------------------------------------------------
-- Properties: office-visible, broker can manage office, owner can manage own
-- ------------------------------------------------------------------
CREATE POLICY properties_select_policy
ON public.properties
FOR SELECT
USING (
  user_id = auth.uid()
  OR (office_id IS NOT NULL AND office_id = public.get_my_office_id())
  OR COALESCE("publishedOnPersonalSite", false) = true
  OR COALESCE("publishedOnMarketplace", false) = true
);

CREATE POLICY properties_insert_policy
ON public.properties
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY properties_update_policy
ON public.properties
FOR UPDATE
USING (
  user_id = auth.uid()
  OR (
    public.get_my_role() = 'broker'
    AND office_id IS NOT NULL
    AND office_id = public.get_my_office_id()
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR (
    public.get_my_role() = 'broker'
    AND office_id IS NOT NULL
    AND office_id = public.get_my_office_id()
  )
);

CREATE POLICY properties_delete_policy
ON public.properties
FOR DELETE
USING (
  user_id = auth.uid()
  OR (
    public.get_my_role() = 'broker'
    AND office_id IS NOT NULL
    AND office_id = public.get_my_office_id()
  )
);

-- ------------------------------------------------------------------
-- Customers: strict owner-only privacy
-- ------------------------------------------------------------------
CREATE POLICY customers_owner_only_select
ON public.customers
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY customers_owner_only_insert
ON public.customers
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY customers_owner_only_update
ON public.customers
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY customers_owner_only_delete
ON public.customers
FOR DELETE
USING (user_id = auth.uid());

-- ------------------------------------------------------------------
-- Activities: strict owner-only privacy
-- ------------------------------------------------------------------
CREATE POLICY activities_owner_only_select
ON public.activities
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY activities_owner_only_insert
ON public.activities
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY activities_owner_only_update
ON public.activities
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY activities_owner_only_delete
ON public.activities
FOR DELETE
USING (user_id = auth.uid());

-- ------------------------------------------------------------------
-- Requests: office-visible (matching workflow)
-- ------------------------------------------------------------------
CREATE POLICY requests_select_policy
ON public.requests
FOR SELECT
USING (
  user_id = auth.uid()
  OR (office_id IS NOT NULL AND office_id = public.get_my_office_id())
);

CREATE POLICY requests_insert_policy
ON public.requests
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY requests_update_policy
ON public.requests
FOR UPDATE
USING (
  user_id = auth.uid()
  OR (
    public.get_my_role() = 'broker'
    AND office_id IS NOT NULL
    AND office_id = public.get_my_office_id()
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR (
    public.get_my_role() = 'broker'
    AND office_id IS NOT NULL
    AND office_id = public.get_my_office_id()
  )
);

CREATE POLICY requests_delete_policy
ON public.requests
FOR DELETE
USING (
  user_id = auth.uid()
  OR (
    public.get_my_role() = 'broker'
    AND office_id IS NOT NULL
    AND office_id = public.get_my_office_id()
  )
);

-- ------------------------------------------------------------------
-- Sales: office-visible (performance/statistics)
-- ------------------------------------------------------------------
CREATE POLICY sales_select_policy
ON public.sales
FOR SELECT
USING (
  user_id = auth.uid()
  OR (office_id IS NOT NULL AND office_id = public.get_my_office_id())
);

CREATE POLICY sales_insert_policy
ON public.sales
FOR INSERT
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY sales_update_policy
ON public.sales
FOR UPDATE
USING (
  user_id = auth.uid()
  OR (
    public.get_my_role() = 'broker'
    AND office_id IS NOT NULL
    AND office_id = public.get_my_office_id()
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR (
    public.get_my_role() = 'broker'
    AND office_id IS NOT NULL
    AND office_id = public.get_my_office_id()
  )
);

CREATE POLICY sales_delete_policy
ON public.sales
FOR DELETE
USING (
  user_id = auth.uid()
  OR (
    public.get_my_role() = 'broker'
    AND office_id IS NOT NULL
    AND office_id = public.get_my_office_id()
  )
);

-- ------------------------------------------------------------------
-- Offices: own office only
-- ------------------------------------------------------------------
CREATE POLICY offices_select_policy
ON public.offices
FOR SELECT
USING (
  id = public.get_my_office_id()
  OR owner_id = auth.uid()
);

CREATE POLICY offices_insert_policy
ON public.offices
FOR INSERT
WITH CHECK (owner_id = auth.uid());

CREATE POLICY offices_update_policy
ON public.offices
FOR UPDATE
USING (
  owner_id = auth.uid()
  OR (
    public.get_my_role() = 'broker'
    AND id = public.get_my_office_id()
  )
)
WITH CHECK (
  owner_id = auth.uid()
  OR (
    public.get_my_role() = 'broker'
    AND id = public.get_my_office_id()
  )
);

COMMIT;

NOTIFY pgrst, 'reload schema';
