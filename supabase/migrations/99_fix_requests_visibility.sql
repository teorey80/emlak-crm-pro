-- FINAL REPAIR FOR REQUESTS VISIBILITY
-- Run this in Supabase SQL Editor

-- 1. Ensure Columns Exist
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS office_id UUID REFERENCES public.offices(id);

-- 2. Link Existing Requests to Office/User if empty
-- We associate with the first found office for now, or use the creator's office
UPDATE public.requests r
SET office_id = p.office_id
FROM public.profiles p
WHERE r.user_id = p.id AND r.office_id IS NULL;

-- 3. Update RLS Policies for Requests
-- Drop old private policy
DROP POLICY IF EXISTS "Strict Private Requests" ON public.requests;
DROP POLICY IF EXISTS "Users can manage their own requests" ON public.requests;

-- Create Office-Wide View Policy (Same as properties)
CREATE POLICY "View Office Requests" ON public.requests
    FOR SELECT
    USING (
        office_id IN (
            SELECT office_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Create Management Policy (Owner or Broker)
CREATE POLICY "Manage Office Requests" ON public.requests
    FOR ALL
    USING (
        user_id = auth.uid() 
        OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'broker' 
            AND office_id = public.requests.office_id
        )
    );

-- 4. Critical Fix: Update existing data to match the broker's office if needed
DO $$
DECLARE
    v_office_id UUID;
BEGIN
    SELECT office_id INTO v_office_id FROM public.profiles WHERE email = 'teorey@gmail.com' LIMIT 1;
    IF v_office_id IS NOT NULL THEN
        UPDATE public.requests SET office_id = v_office_id WHERE office_id IS NULL;
        RAISE NOTICE 'Requests updated with office_id: %', v_office_id;
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
