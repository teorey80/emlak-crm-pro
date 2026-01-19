-- EMERGENCY FIX: Restore Property Visibility

-- 1. Modify View Policy to explicitly include OWNER even if office_id is missing
DROP POLICY IF EXISTS "View Office Properties" ON public.properties;

CREATE POLICY "View Office Properties" ON public.properties
    FOR SELECT
    USING (
        -- Always see your own
        user_id = auth.uid()
        OR 
        -- See office properties (if office_id is set)
        (office_id IS NOT NULL AND office_id IN (
            SELECT office_id FROM public.profiles WHERE id = auth.uid()
        ))
    );

-- 2. DATA REPAIR: Backfill missing office_id on properties
-- This connects your old properties to your current office.
UPDATE public.properties p
SET office_id = pr.office_id
FROM public.profiles pr
WHERE p.user_id = pr.id
AND p.office_id IS NULL;

NOTIFY pgrst, 'reload schema';
