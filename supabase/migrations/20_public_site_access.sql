-- PUBLIC SITE ACCESS FIX
-- Allows anonymous users to read site_config from profiles and offices
-- Required for public website DNS routing to work

-- 1. Allow anonymous read of profiles with active site_config (for public site domain check)
DROP POLICY IF EXISTS "Public can read active site configs" ON public.profiles;
CREATE POLICY "Public can read active site configs" ON public.profiles
    FOR SELECT
    USING (
        site_config IS NOT NULL 
        AND (site_config->>'isActive')::boolean = true
    );

-- 2. Allow anonymous read of offices with active site_config  
DROP POLICY IF EXISTS "Public can read active office sites" ON public.offices;
CREATE POLICY "Public can read active office sites" ON public.offices
    FOR SELECT
    USING (
        site_config IS NOT NULL 
        AND (site_config->>'isActive')::boolean = true
    );

-- 3. Allow anonymous read of published properties for public site display
DROP POLICY IF EXISTS "Public can view published properties" ON public.properties;
CREATE POLICY "Public can view published properties" ON public.properties
    FOR SELECT
    USING (
        "publishedOnPersonalSite" = true 
        OR "publishedOnMarketplace" = true
    );

NOTIFY pgrst, 'reload schema';

