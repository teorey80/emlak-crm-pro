-- Performance indexes for public site queries
-- Run this in Supabase SQL Editor

-- Composite index for user's active listings (most common public site query)
CREATE INDEX IF NOT EXISTS idx_properties_user_listing_status 
ON public.properties(user_id, listing_status);

-- Index for office-based active listings
CREATE INDEX IF NOT EXISTS idx_properties_office_listing_status 
ON public.properties(office_id, listing_status);

-- GIN indexes for JSONB site_config domain lookups (faster than btree for JSONB)
CREATE INDEX IF NOT EXISTS idx_profiles_site_config 
ON public.profiles USING gin (site_config);

CREATE INDEX IF NOT EXISTS idx_offices_site_config 
ON public.offices USING gin (site_config);

-- Analyze tables to update query planner statistics
ANALYZE public.properties;
ANALYZE public.profiles;
ANALYZE public.offices;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
