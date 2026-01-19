-- Speed up property queries by adding indexes
-- Run this in Supabase SQL Editor

-- Index for querying properties by user_id (most common query)
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON public.properties(user_id);

-- Index for querying properties by office_id
CREATE INDEX IF NOT EXISTS idx_properties_office_id ON public.properties(office_id);

-- Index for querying profiles by office_id (for finding office members)
CREATE INDEX IF NOT EXISTS idx_profiles_office_id ON public.profiles(office_id);

-- Composite index for sorting by created_at
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON public.properties(created_at DESC);

-- Analyze tables to update query planner statistics
ANALYZE public.properties;
ANALYZE public.profiles;

-- Optionally increase statement timeout for this session (comment out if not needed)
-- SET statement_timeout = '30s';

NOTIFY pgrst, 'reload schema';
