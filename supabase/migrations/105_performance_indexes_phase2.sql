-- Database performance indexes (phase 2)
-- Safe to run multiple times (IF NOT EXISTS)

BEGIN;

-- Properties: dashboard + list filters
CREATE INDEX IF NOT EXISTS idx_properties_user_id_created_at
  ON public.properties (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_properties_office_id_created_at
  ON public.properties (office_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_properties_office_listing_status_created_at
  ON public.properties (office_id, listing_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_properties_office_status_created_at
  ON public.properties (office_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_properties_status_created_at
  ON public.properties (status, created_at DESC);

-- Profiles: team list and auth/profile lookups
CREATE INDEX IF NOT EXISTS idx_profiles_office_id
  ON public.profiles (office_id);

CREATE INDEX IF NOT EXISTS idx_profiles_email
  ON public.profiles (email);

-- Requests / sales / activities / customers feeds
CREATE INDEX IF NOT EXISTS idx_requests_office_status
  ON public.requests (office_id, status);

CREATE INDEX IF NOT EXISTS idx_requests_user_status
  ON public.requests (user_id, status);

CREATE INDEX IF NOT EXISTS idx_sales_office_created_at
  ON public.sales (office_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sales_user_created_at
  ON public.sales (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activities_user_date
  ON public.activities (user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_customers_user_created_at
  ON public.customers (user_id, created_at DESC);

-- Notifications: bell list + unread count
CREATE INDEX IF NOT EXISTS idx_notifications_user_created_at
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_is_read_created_at
  ON public.notifications (user_id, is_read, created_at DESC);

COMMIT;

NOTIFY pgrst, 'reload schema';
