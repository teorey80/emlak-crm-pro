-- =====================================================
-- SAAS PHASE 1: DATABASE TABLES
-- Emlak CRM Pro - SaaS Dönüşümü Faz 1
-- Tarih: 2026-02-02
-- =====================================================

-- =====================================================
-- 1. OFİS DAVET LİNKLERİ TABLOSU
-- Broker'ın danışman davet etmesi için
-- =====================================================

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

-- Index for token lookup
CREATE INDEX IF NOT EXISTS idx_office_invitations_token ON public.office_invitations(token);
CREATE INDEX IF NOT EXISTS idx_office_invitations_office ON public.office_invitations(office_id);

-- RLS for office_invitations
ALTER TABLE public.office_invitations ENABLE ROW LEVEL SECURITY;

-- Everyone can read invitations (to validate tokens)
CREATE POLICY "Anyone can validate invitation tokens"
ON public.office_invitations FOR SELECT
USING (true);

-- Only broker can create/update invitations for their office
CREATE POLICY "Broker can manage office invitations"
ON public.office_invitations FOR ALL
USING (
    created_by = auth.uid()
    OR
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'broker'
        AND office_id = office_invitations.office_id
    )
);

-- =====================================================
-- 2. OFİS ÜYELİK GEÇMİŞİ TABLOSU
-- Audit log - kim ne zaman hangi ofise geçti
-- =====================================================

CREATE TABLE IF NOT EXISTS public.office_membership_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    old_office_id UUID REFERENCES public.offices(id) ON DELETE SET NULL,
    new_office_id UUID REFERENCES public.offices(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('joined', 'left', 'transferred', 'role_changed')),
    old_role TEXT,
    new_role TEXT,
    reason TEXT,
    performed_by UUID REFERENCES auth.users(id), -- who made the change (broker or self)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_membership_history_user ON public.office_membership_history(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_history_office ON public.office_membership_history(new_office_id);

-- RLS
ALTER TABLE public.office_membership_history ENABLE ROW LEVEL SECURITY;

-- User can see their own history
CREATE POLICY "Users can view own membership history"
ON public.office_membership_history FOR SELECT
USING (user_id = auth.uid());

-- Broker can see office history
CREATE POLICY "Broker can view office membership history"
ON public.office_membership_history FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'broker'
        AND (office_id = old_office_id OR office_id = new_office_id)
    )
);

-- System can insert (via function)
CREATE POLICY "System can insert membership history"
ON public.office_membership_history FOR INSERT
WITH CHECK (true);

-- =====================================================
-- 3. BİLDİRİMLER TABLOSU
-- Eşleşme, davet, vs. bildirimleri
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'match_found', 'portfolio_interest', 'team_joined', 'invitation_sent', etc.
    title TEXT NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}', -- Related entity IDs, scores, etc.
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(user_id, created_at DESC);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE
USING (user_id = auth.uid());

-- =====================================================
-- 4. EŞLEŞMELER TABLOSU
-- Talep-Portföy eşleşmeleri
-- =====================================================

CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id TEXT NOT NULL,
    property_id TEXT NOT NULL,
    request_owner_id UUID NOT NULL REFERENCES auth.users(id),
    property_owner_id UUID NOT NULL REFERENCES auth.users(id),
    score INTEGER CHECK (score >= 0 AND score <= 100), -- Match score 0-100
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'viewing_scheduled', 'offer_made', 'closed_won', 'closed_lost', 'cancelled')),
    notes TEXT,
    contacted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_matches_request ON public.matches(request_id);
CREATE INDEX IF NOT EXISTS idx_matches_property ON public.matches(property_id);
CREATE INDEX IF NOT EXISTS idx_matches_request_owner ON public.matches(request_owner_id);
CREATE INDEX IF NOT EXISTS idx_matches_property_owner ON public.matches(property_owner_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);

-- RLS
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Both parties can see matches they're involved in
CREATE POLICY "Users can view their matches"
ON public.matches FOR SELECT
USING (
    request_owner_id = auth.uid()
    OR property_owner_id = auth.uid()
);

-- Both parties can update matches they're involved in
CREATE POLICY "Users can update their matches"
ON public.matches FOR UPDATE
USING (
    request_owner_id = auth.uid()
    OR property_owner_id = auth.uid()
);

-- System can insert matches
CREATE POLICY "System can insert matches"
ON public.matches FOR INSERT
WITH CHECK (true);

-- =====================================================
-- 5. PROFILES TABLOSU GÜNCELLEMELER
-- Ofis üyeliği için ek alanlar
-- =====================================================

-- Add new columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS joined_office_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS left_office_at TIMESTAMP WITH TIME ZONE;

-- =====================================================
-- 6. YARDIMCI FONKSİYONLAR
-- Dinamik ofis kontrolü için
-- =====================================================

-- Function to get user's current office ID
CREATE OR REPLACE FUNCTION public.get_user_office_id(uid UUID DEFAULT auth.uid())
RETURNS UUID AS $$
    SELECT office_id FROM public.profiles WHERE id = uid
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Function to check if user is broker of an office
CREATE OR REPLACE FUNCTION public.is_broker_of_office(office_id UUID, uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = uid
        AND role = 'broker'
        AND profiles.office_id = $1
    )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Function to check if two users are in the same office
CREATE OR REPLACE FUNCTION public.are_in_same_office(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles p1
        JOIN public.profiles p2 ON p1.office_id = p2.office_id
        WHERE p1.id = user1_id
        AND p2.id = user2_id
        AND p1.office_id IS NOT NULL
    )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- =====================================================
-- 7. DİNAMİK GÖRÜNÜRLÜK İÇİN RLS POLİTİKALARI
-- Portföyler: Sahip + aynı ofistekiler görür
-- =====================================================

-- Drop old property policies if they exist (to recreate)
DROP POLICY IF EXISTS "properties_dynamic_visibility" ON public.properties;

-- Portföy görünürlüğü - dinamik ofis bazlı
CREATE POLICY "properties_dynamic_visibility" ON public.properties
FOR SELECT USING (
    -- Kendi portföylerim
    user_id = auth.uid()
    OR
    -- Aynı ofisteki arkadaşların portföyleri (dinamik hesaplama)
    EXISTS (
        SELECT 1 FROM public.profiles owner_profile
        WHERE owner_profile.id = properties.user_id
        AND owner_profile.office_id IS NOT NULL
        AND owner_profile.office_id = get_user_office_id()
    )
    OR
    -- Yayınlanmış portföyler (public site için)
    COALESCE("publishedOnPersonalSite", false) = true
    OR
    COALESCE("publishedOnOfficeSite", false) = true
);

-- =====================================================
-- 8. MÜŞTERİ GİZLİLİĞİ - SADECE SAHİBİ GÖRÜR
-- =====================================================

-- Drop old customer policies
DROP POLICY IF EXISTS "customers_strict_privacy" ON public.customers;

-- Müşteriler sadece sahibi tarafından görülür
CREATE POLICY "customers_strict_privacy" ON public.customers
FOR SELECT USING (user_id = auth.uid());

-- =====================================================
-- 9. TALEPLER - OFİS İÇİ GÖRÜNÜR (eşleştirme için)
-- =====================================================

DROP POLICY IF EXISTS "requests_office_visibility" ON public.requests;

CREATE POLICY "requests_office_visibility" ON public.requests
FOR SELECT USING (
    -- Kendi taleplerim
    user_id = auth.uid()
    OR
    -- Aynı ofisteki arkadaşların talepleri
    EXISTS (
        SELECT 1 FROM public.profiles owner_profile
        WHERE owner_profile.id = requests.user_id
        AND owner_profile.office_id IS NOT NULL
        AND owner_profile.office_id = get_user_office_id()
    )
);

-- =====================================================
-- 10. TRIGGER: OFİS DEĞİŞİKLİĞİNDE TARİH GÜNCELLE
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_office_join_date()
RETURNS TRIGGER AS $$
BEGIN
    -- If office_id changed
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
    FOR EACH ROW
    EXECUTE FUNCTION public.update_office_join_date();

-- =====================================================
-- DONE!
-- =====================================================

COMMENT ON TABLE public.office_invitations IS 'Broker tarafından oluşturulan ofis davet linkleri';
COMMENT ON TABLE public.office_membership_history IS 'Kullanıcıların ofis geçiş geçmişi (audit log)';
COMMENT ON TABLE public.notifications IS 'Kullanıcı bildirimleri (eşleşme, davet, vs.)';
COMMENT ON TABLE public.matches IS 'Talep-Portföy eşleşmeleri';
