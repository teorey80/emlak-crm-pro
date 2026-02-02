-- =====================================================
-- SAAS PHASE 1: ONLY NEW TABLES (No function changes)
-- Mevcut fonksiyonları değiştirmeden sadece tablolar
-- =====================================================

-- 1. OFİS DAVET LİNKLERİ
CREATE TABLE IF NOT EXISTS public.office_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id UUID NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'consultant' CHECK (role IN ('consultant', 'broker')),
    expires_at TIMESTAMP WITH TIME ZONE,
    max_uses INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_office_invitations_token ON public.office_invitations(token);
ALTER TABLE public.office_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invitation_select" ON public.office_invitations FOR SELECT USING (true);
CREATE POLICY "invitation_insert" ON public.office_invitations FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "invitation_update" ON public.office_invitations FOR UPDATE USING (created_by = auth.uid());

-- 2. OFİS ÜYELİK GEÇMİŞİ
CREATE TABLE IF NOT EXISTS public.office_membership_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    old_office_id UUID REFERENCES public.offices(id) ON DELETE SET NULL,
    new_office_id UUID REFERENCES public.offices(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('joined', 'left', 'transferred', 'role_changed')),
    old_role TEXT,
    new_role TEXT,
    reason TEXT,
    performed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_membership_history_user ON public.office_membership_history(user_id);
ALTER TABLE public.office_membership_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "membership_history_select" ON public.office_membership_history FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "membership_history_insert" ON public.office_membership_history FOR INSERT WITH CHECK (true);

-- 3. BİLDİRİMLER
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notifications_delete" ON public.notifications FOR DELETE USING (user_id = auth.uid());

-- 4. EŞLEŞMELER
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id TEXT NOT NULL,
    property_id TEXT NOT NULL,
    request_owner_id UUID NOT NULL REFERENCES auth.users(id),
    property_owner_id UUID NOT NULL REFERENCES auth.users(id),
    score INTEGER CHECK (score >= 0 AND score <= 100),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'viewing_scheduled', 'offer_made', 'closed_won', 'closed_lost', 'cancelled')),
    notes TEXT,
    contacted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matches_request_owner ON public.matches(request_owner_id);
CREATE INDEX IF NOT EXISTS idx_matches_property_owner ON public.matches(property_owner_id);
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "matches_select" ON public.matches FOR SELECT USING (request_owner_id = auth.uid() OR property_owner_id = auth.uid());
CREATE POLICY "matches_update" ON public.matches FOR UPDATE USING (request_owner_id = auth.uid() OR property_owner_id = auth.uid());
CREATE POLICY "matches_insert" ON public.matches FOR INSERT WITH CHECK (true);

-- 5. PROFILES EK ALANLAR
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS joined_office_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS invited_by UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS left_office_at TIMESTAMP WITH TIME ZONE;

-- DONE!
SELECT 'SaaS Phase 1 tables created successfully!' as status;
