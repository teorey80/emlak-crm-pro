-- FINAL RECOVERY: Assign Data & Secure App
-- This script does two things:
-- 1. Takes ALL listings in the database and gives them to YOU (so they don't disappear).
-- 2. Turns security checks (RLS) back ON.

BEGIN;

-- 1. Assign ALL Properties to You
-- We use auth.uid() which is the ID of the user running the command in SQL Editor
UPDATE public.properties
SET 
    user_id = auth.uid(),
    -- Attempt to keep existing office_id, or fall back to your current office
    office_id = COALESCE(office_id, (SELECT office_id FROM public.profiles WHERE id = auth.uid()))
WHERE true; -- Update ALL rows

-- 2. Assign ALL Customers to You
UPDATE public.customers
SET 
    user_id = auth.uid(),
    office_id = COALESCE(office_id, (SELECT office_id FROM public.profiles WHERE id = auth.uid()))
WHERE true;

-- 3. Re-Enable Security (RLS)
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

COMMIT;

NOTIFY pgrst, 'reload schema';
