-- Migration: Analytics Goals Table
-- Tracks user/office performance targets and progress

-- 1. Create goals table for target tracking
CREATE TABLE IF NOT EXISTS public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  office_id uuid REFERENCES public.offices(id) ON DELETE CASCADE,

  -- Goal definition
  metric_type text NOT NULL CHECK (metric_type IN (
    'sales_count',
    'rental_count',
    'total_commission',
    'total_revenue',
    'new_properties',
    'new_customers',
    'activities_count',
    'showings_count'
  )),
  target_value numeric NOT NULL,
  actual_value numeric DEFAULT 0,

  -- Period
  period text NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  period_start date NOT NULL,
  period_end date NOT NULL,

  -- Automation
  auto_calculated boolean DEFAULT true,
  insight_text text,

  -- Status
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'expired')),

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT goals_valid_period CHECK (period_end >= period_start)
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_office_id ON public.goals(office_id);
CREATE INDEX IF NOT EXISTS idx_goals_period ON public.goals(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_goals_status ON public.goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_metric_type ON public.goals(metric_type);

-- 3. Enable RLS
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can insert their own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON public.goals;
DROP POLICY IF EXISTS "Brokers can view office goals" ON public.goals;
DROP POLICY IF EXISTS "Brokers can manage office goals" ON public.goals;

-- 5. RLS Policies - Users manage their own goals
CREATE POLICY "Users can view their own goals" ON public.goals
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals" ON public.goals
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" ON public.goals
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" ON public.goals
FOR DELETE USING (auth.uid() = user_id);

-- 6. RLS Policy - Brokers can view all office goals
CREATE POLICY "Brokers can view office goals" ON public.goals
FOR SELECT USING (
  office_id IN (
    SELECT id FROM public.offices WHERE owner_id = auth.uid()
  )
);

-- 7. RLS Policy - Brokers can manage office-level goals
CREATE POLICY "Brokers can manage office goals" ON public.goals
FOR ALL USING (
  office_id IN (
    SELECT id FROM public.offices WHERE owner_id = auth.uid()
  )
  AND user_id = auth.uid() -- Only their own goals, not consultant goals
);

-- 8. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS goals_updated_at ON public.goals;
CREATE TRIGGER goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW
  EXECUTE FUNCTION update_goals_updated_at();

-- Done
COMMENT ON TABLE public.goals IS 'Performance targets and goals for users and offices';
