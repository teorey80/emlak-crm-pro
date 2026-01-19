-- SAFE TO RUN AGAIN (Idempotent Script)
-- This script will check for existing tables/columns and only add them if missing.
-- Run this ENTIRE block in the Supabase SQL Editor.

-- 1. Create Offices Table (Safe)
CREATE TABLE IF NOT EXISTS public.offices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT UNIQUE,
    owner_id UUID REFERENCES auth.users(id),
    logo_url TEXT,
    address TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Update Profiles Table (Safe)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'office_id') THEN
        ALTER TABLE public.profiles ADD COLUMN office_id UUID REFERENCES public.offices(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'consultant' CHECK (role IN ('broker', 'consultant', 'staff'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_active') THEN
        ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 3. Update Properties Table (Safe)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'office_id') THEN
        ALTER TABLE public.properties ADD COLUMN office_id UUID REFERENCES public.offices(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'visibility') THEN
        ALTER TABLE public.properties ADD COLUMN visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'office_only'));
    END IF;
END $$;

-- 4. Enable RLS (Safe)
ALTER TABLE public.offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies (Drop first to avoid "already exists" error)
DROP POLICY IF EXISTS "Brokers can manage their office" ON public.offices;
CREATE POLICY "Brokers can manage their office" ON public.offices
    FOR ALL USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Consultants can view their office" ON public.offices;
CREATE POLICY "Consultants can view their office" ON public.offices
    FOR SELECT USING (id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users view office properties" ON public.properties;
CREATE POLICY "Users view office properties" ON public.properties
    FOR SELECT USING (office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Brokers manage office properties" ON public.properties;
CREATE POLICY "Brokers manage office properties" ON public.properties
    FOR ALL USING (office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid() AND role = 'broker'));
