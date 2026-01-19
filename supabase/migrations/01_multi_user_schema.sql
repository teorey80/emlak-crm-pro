-- Multi-User Office System Migration

-- 1. Create Offices Table
CREATE TABLE IF NOT EXISTS public.offices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT UNIQUE, -- for office website (e.g., remax-joy.com)
    owner_id UUID REFERENCES auth.users(id), -- Broker
    logo_url TEXT,
    address TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Update Profiles Table (Links Users to Offices)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS office_id UUID REFERENCES public.offices(id),
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'consultant' CHECK (role IN ('broker', 'consultant', 'staff')),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 3. Update Properties Table (Links Listings to Offices)
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS office_id UUID REFERENCES public.offices(id),
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'office_only'));

-- 4. Enable RLS on Offices
ALTER TABLE public.offices ENABLE ROW LEVEL SECURITY;

-- Broker can view/edit their own office
CREATE POLICY "Brokers can manage their office" ON public.offices
    FOR ALL
    USING (auth.uid() = owner_id);

-- Consultants can view their office details
CREATE POLICY "Consultants can view their office" ON public.offices
    FOR SELECT
    USING (id IN (
        SELECT office_id FROM public.profiles WHERE id = auth.uid()
    ));

-- 5. Update Policies for Properties (The "Office Scope")
-- First, drop existing if needed (or we just add new ones and assume permissive)

-- "Office View": Users can see ALL properties in their office
CREATE POLICY "Users view office properties" ON public.properties
    FOR SELECT
    USING (office_id IN (
        SELECT office_id FROM public.profiles WHERE id = auth.uid()
    ));

-- "Broker Manage": Broker can manage ALL properties in their office
CREATE POLICY "Brokers manage office properties" ON public.properties
    FOR ALL
    USING (office_id IN (
        SELECT office_id FROM public.profiles WHERE id = auth.uid()
        AND role = 'broker'
    ));

-- 6. Enable RLS on Other Tables
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
