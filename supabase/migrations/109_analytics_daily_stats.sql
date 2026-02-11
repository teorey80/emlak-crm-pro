-- Migration: Analytics Daily Stats Table
-- Stores pre-calculated daily statistics for fast reporting queries

-- 1. Create daily_stats table for aggregated metrics
CREATE TABLE IF NOT EXISTS public.daily_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  office_id uuid REFERENCES public.offices(id) ON DELETE CASCADE,
  stat_date date NOT NULL,

  -- Activity counters
  total_activities integer DEFAULT 0,
  phone_calls integer DEFAULT 0,        -- Gelen + Giden Arama
  showings integer DEFAULT 0,           -- Yer Gösterimi
  appointments integer DEFAULT 0,       -- Ofis Toplantısı

  -- New records
  new_properties integer DEFAULT 0,
  new_customers integer DEFAULT 0,

  -- Results
  sales_closed integer DEFAULT 0,
  rentals_closed integer DEFAULT 0,
  deposits_taken integer DEFAULT 0,

  -- Revenue
  total_commission numeric DEFAULT 0,
  total_revenue numeric DEFAULT 0,

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT daily_stats_user_date_unique UNIQUE (user_id, stat_date)
);

-- 2. Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_id ON public.daily_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_office_id ON public.daily_stats(office_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_stat_date ON public.daily_stats(stat_date);
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON public.daily_stats(user_id, stat_date);

-- 3. Enable RLS
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own daily stats" ON public.daily_stats;
DROP POLICY IF EXISTS "Brokers can view office daily stats" ON public.daily_stats;
DROP POLICY IF EXISTS "System can insert daily stats" ON public.daily_stats;
DROP POLICY IF EXISTS "System can update daily stats" ON public.daily_stats;

-- 5. RLS Policies - Users see their own stats
CREATE POLICY "Users can view their own daily stats" ON public.daily_stats
FOR SELECT USING (auth.uid() = user_id);

-- 6. RLS Policy - Brokers can view all office stats
CREATE POLICY "Brokers can view office daily stats" ON public.daily_stats
FOR SELECT USING (
  office_id IN (
    SELECT id FROM public.offices WHERE owner_id = auth.uid()
  )
);

-- 7. RLS Policy - Allow insert for authenticated users (for edge function service role)
CREATE POLICY "Authenticated users can insert daily stats" ON public.daily_stats
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 8. RLS Policy - Allow update for authenticated users
CREATE POLICY "Authenticated users can update daily stats" ON public.daily_stats
FOR UPDATE USING (auth.uid() = user_id OR auth.uid() IN (
  SELECT owner_id FROM public.offices WHERE id = daily_stats.office_id
));

-- 9. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_daily_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS daily_stats_updated_at ON public.daily_stats;
CREATE TRIGGER daily_stats_updated_at
  BEFORE UPDATE ON public.daily_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_stats_updated_at();

-- Done
COMMENT ON TABLE public.daily_stats IS 'Pre-calculated daily statistics for analytics and reporting';
