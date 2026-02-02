-- =====================================================
-- SAAS PHASE 1: FIX - Function Conflict Resolution
-- Önce mevcut çakışan fonksiyonları temizle
-- =====================================================

-- Drop existing functions that might conflict
DROP FUNCTION IF EXISTS public.get_user_office_id();
DROP FUNCTION IF EXISTS public.get_user_office_id(UUID);

-- Recreate with explicit signature
CREATE OR REPLACE FUNCTION public.get_user_office_id(uid UUID DEFAULT auth.uid())
RETURNS UUID AS $$
    SELECT office_id FROM public.profiles WHERE id = uid
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- =====================================================
-- NOW RUN THE MAIN MIGRATION (32_saas_phase1_database.sql)
-- But skip the function creation part
-- =====================================================

-- 1. OFİS DAVET LİNKLERİ TABLOSU
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
CREATE INDEX IF NOT EXISTS idx_office_invitations_office ON public.office_invitations(office_id);

ALTER TABLE public.office_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can validate invitation tokens" ON public.office_invitations;
CREATE POLICY "Anyone can validate invitation tokens"
ON public.office_invitations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Broker can manage office invitations" ON public.office_invitations;
CREATE POLICY "Broker can manage office invitations"
ON public.office_invitations FOR ALL
USING (
    created_by = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'broker'
        AND office_id = office_invitations.office_id
    )
);

-- 2. OFİS ÜYELİK GEÇMİŞİ TABLOSU
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
CREATE INDEX IF NOT EXISTS idx_membership_history_office ON public.office_membership_history(new_office_id);

ALTER TABLE public.office_membership_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own membership history" ON public.office_membership_history;
CREATE POLICY "Users can view own membership history"
ON public.office_membership_history FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Broker can view office membership history" ON public.office_membership_history;
CREATE POLICY "Broker can view office membership history"
ON public.office_membership_history FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'broker'
        AND (office_id = old_office_id OR office_id = new_office_id)
    )
);

DROP POLICY IF EXISTS "System can insert membership history" ON public.office_membership_history;
CREATE POLICY "System can insert membership history"
ON public.office_membership_history FOR INSERT WITH CHECK (true);

-- 3. BİLDİRİMLER TABLOSU
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
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE USING (user_id = auth.uid());

-- 4. EŞLEŞMELER TABLOSU
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

CREATE INDEX IF NOT EXISTS idx_matches_request ON public.matches(request_id);
CREATE INDEX IF NOT EXISTS idx_matches_property ON public.matches(property_id);
CREATE INDEX IF NOT EXISTS idx_matches_request_owner ON public.matches(request_owner_id);
CREATE INDEX IF NOT EXISTS idx_matches_property_owner ON public.matches(property_owner_id);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their matches" ON public.matches;
CREATE POLICY "Users can view their matches"
ON public.matches FOR SELECT
USING (request_owner_id = auth.uid() OR property_owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their matches" ON public.matches;
CREATE POLICY "Users can update their matches"
ON public.matches FOR UPDATE
USING (request_owner_id = auth.uid() OR property_owner_id = auth.uid());

DROP POLICY IF EXISTS "System can insert matches" ON public.matches;
CREATE POLICY "System can insert matches"
ON public.matches FOR INSERT WITH CHECK (true);

-- 5. PROFILES EK ALANLAR
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS joined_office_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS left_office_at TIMESTAMP WITH TIME ZONE;

-- 6. DİĞER YARDIMCI FONKSİYONLAR
DROP FUNCTION IF EXISTS public.is_broker_of_office(UUID);
DROP FUNCTION IF EXISTS public.is_broker_of_office(UUID, UUID);
CREATE OR REPLACE FUNCTION public.is_broker_of_office(check_office_id UUID, uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = uid AND role = 'broker' AND office_id = check_office_id
    )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

DROP FUNCTION IF EXISTS public.are_in_same_office(UUID, UUID);
CREATE OR REPLACE FUNCTION public.are_in_same_office(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles p1
        JOIN public.profiles p2 ON p1.office_id = p2.office_id
        WHERE p1.id = user1_id AND p2.id = user2_id AND p1.office_id IS NOT NULL
    )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- 7. TRIGGER
CREATE OR REPLACE FUNCTION public.update_office_join_date()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.office_id IS DISTINCT FROM NEW.office_id THEN
        IF NEW.office_id IS NOT NULL THEN
            NEW.joined_office_at = NOW();
            NEW.left_office_at = NULL;
        ELSE
            NEW.left_office_at = NOW();
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_office_join_date ON public.profiles;
CREATE TRIGGER trigger_update_office_join_date
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_office_join_date();

-- DONE!
SELECT 'SaaS Phase 1 migration completed successfully!' as status;
