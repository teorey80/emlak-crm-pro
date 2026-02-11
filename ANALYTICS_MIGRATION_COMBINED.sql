-- =====================================================
-- COMBINED ANALYTICS MIGRATION
-- Copy and paste this entire file into Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PART 1: Daily Stats Table (109)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.daily_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  office_id uuid REFERENCES public.offices(id) ON DELETE CASCADE,
  stat_date date NOT NULL,
  total_activities integer DEFAULT 0,
  phone_calls integer DEFAULT 0,
  showings integer DEFAULT 0,
  appointments integer DEFAULT 0,
  new_properties integer DEFAULT 0,
  new_customers integer DEFAULT 0,
  sales_closed integer DEFAULT 0,
  rentals_closed integer DEFAULT 0,
  deposits_taken integer DEFAULT 0,
  total_commission numeric DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT daily_stats_user_date_unique UNIQUE (user_id, stat_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_stats_user_id ON public.daily_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_office_id ON public.daily_stats(office_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_stat_date ON public.daily_stats(stat_date);
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON public.daily_stats(user_id, stat_date);

ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own daily stats" ON public.daily_stats;
DROP POLICY IF EXISTS "Brokers can view office daily stats" ON public.daily_stats;
DROP POLICY IF EXISTS "Authenticated users can insert daily stats" ON public.daily_stats;
DROP POLICY IF EXISTS "Authenticated users can update daily stats" ON public.daily_stats;

CREATE POLICY "Users can view their own daily stats" ON public.daily_stats
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Brokers can view office daily stats" ON public.daily_stats
FOR SELECT USING (
  office_id IN (SELECT id FROM public.offices WHERE owner_id = auth.uid())
);

CREATE POLICY "Authenticated users can insert daily stats" ON public.daily_stats
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update daily stats" ON public.daily_stats
FOR UPDATE USING (auth.uid() = user_id OR auth.uid() IN (
  SELECT owner_id FROM public.offices WHERE id = daily_stats.office_id
));

-- =====================================================
-- PART 2: Goals Table (110)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  office_id uuid REFERENCES public.offices(id) ON DELETE CASCADE,
  metric_type text NOT NULL CHECK (metric_type IN (
    'sales_count', 'rental_count', 'total_commission', 'total_revenue',
    'new_properties', 'new_customers', 'activities_count', 'showings_count'
  )),
  target_value numeric NOT NULL,
  actual_value numeric DEFAULT 0,
  period text NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  period_start date NOT NULL,
  period_end date NOT NULL,
  auto_calculated boolean DEFAULT true,
  insight_text text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'expired')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT goals_valid_period CHECK (period_end >= period_start)
);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_office_id ON public.goals(office_id);
CREATE INDEX IF NOT EXISTS idx_goals_period ON public.goals(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_goals_status ON public.goals(status);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can insert their own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON public.goals;
DROP POLICY IF EXISTS "Brokers can view office goals" ON public.goals;

CREATE POLICY "Users can view their own goals" ON public.goals
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals" ON public.goals
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" ON public.goals
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" ON public.goals
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Brokers can view office goals" ON public.goals
FOR SELECT USING (
  office_id IN (SELECT id FROM public.offices WHERE owner_id = auth.uid())
);

-- =====================================================
-- PART 3: RPC Functions (111)
-- =====================================================

-- Function 1: get_activity_trend
DROP FUNCTION IF EXISTS get_activity_trend(uuid, uuid, date, date, text);
CREATE OR REPLACE FUNCTION get_activity_trend(
  p_user_id uuid DEFAULT NULL,
  p_office_id uuid DEFAULT NULL,
  p_start_date date DEFAULT (CURRENT_DATE - INTERVAL '30 days')::date,
  p_end_date date DEFAULT CURRENT_DATE,
  p_granularity text DEFAULT 'daily'
)
RETURNS TABLE (
  period_label text,
  period_start date,
  total_activities bigint,
  phone_calls bigint,
  showings bigint,
  appointments bigint,
  positive_outcomes bigint,
  negative_outcomes bigint
) AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT
      CASE p_granularity
        WHEN 'daily' THEN d::date
        WHEN 'weekly' THEN date_trunc('week', d)::date
        WHEN 'monthly' THEN date_trunc('month', d)::date
      END as period_date
    FROM generate_series(p_start_date, p_end_date, '1 day'::interval) d
    GROUP BY 1
  ),
  activity_data AS (
    SELECT
      CASE p_granularity
        WHEN 'daily' THEN a.date::date
        WHEN 'weekly' THEN date_trunc('week', a.date)::date
        WHEN 'monthly' THEN date_trunc('month', a.date)::date
      END as period_date,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE a.type IN ('Gelen Arama', 'Giden Arama')) as calls,
      COUNT(*) FILTER (WHERE a.type = 'Yer Gösterimi') as shows,
      COUNT(*) FILTER (WHERE a.type = 'Ofis Toplantısı') as appts,
      COUNT(*) FILTER (WHERE a.status = 'Olumlu') as positive,
      COUNT(*) FILTER (WHERE a.status = 'Olumsuz') as negative
    FROM public.activities a
    WHERE a.date >= p_start_date
      AND a.date <= p_end_date
      AND (p_user_id IS NULL OR a.user_id = p_user_id)
      AND (p_office_id IS NULL OR a.office_id = p_office_id)
    GROUP BY 1
  )
  SELECT
    CASE p_granularity
      WHEN 'daily' THEN to_char(ds.period_date, 'DD Mon')
      WHEN 'weekly' THEN 'Hafta ' || to_char(ds.period_date, 'WW')
      WHEN 'monthly' THEN to_char(ds.period_date, 'Mon YYYY')
    END as period_label,
    ds.period_date as period_start,
    COALESCE(ad.total, 0)::bigint as total_activities,
    COALESCE(ad.calls, 0)::bigint as phone_calls,
    COALESCE(ad.shows, 0)::bigint as showings,
    COALESCE(ad.appts, 0)::bigint as appointments,
    COALESCE(ad.positive, 0)::bigint as positive_outcomes,
    COALESCE(ad.negative, 0)::bigint as negative_outcomes
  FROM date_series ds
  LEFT JOIN activity_data ad ON ds.period_date = ad.period_date
  ORDER BY ds.period_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 2: get_conversion_funnel
DROP FUNCTION IF EXISTS get_conversion_funnel(uuid, uuid, date, date);
CREATE OR REPLACE FUNCTION get_conversion_funnel(
  p_user_id uuid DEFAULT NULL,
  p_office_id uuid DEFAULT NULL,
  p_start_date date DEFAULT (CURRENT_DATE - INTERVAL '30 days')::date,
  p_end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  stage text,
  stage_order integer,
  count bigint,
  percentage numeric,
  from_previous_percentage numeric
) AS $$
DECLARE
  v_total_properties bigint;
  v_showings bigint;
  v_deposits bigint;
  v_sales bigint;
  v_rentals bigint;
BEGIN
  SELECT COUNT(*) INTO v_total_properties
  FROM public.properties p
  WHERE (p_user_id IS NULL OR p.user_id = p_user_id)
    AND (p_office_id IS NULL OR p.office_id = p_office_id)
    AND p.created_at::date >= p_start_date
    AND p.created_at::date <= p_end_date;

  SELECT COUNT(*) INTO v_showings
  FROM public.activities a
  WHERE a.type = 'Yer Gösterimi'
    AND a.date >= p_start_date AND a.date <= p_end_date
    AND (p_user_id IS NULL OR a.user_id = p_user_id)
    AND (p_office_id IS NULL OR a.office_id = p_office_id);

  SELECT COUNT(*) INTO v_deposits
  FROM public.properties p
  WHERE p.listing_status = 'Kapora Alındı'
    AND p.deposit_date >= p_start_date AND p.deposit_date <= p_end_date
    AND (p_user_id IS NULL OR p.user_id = p_user_id)
    AND (p_office_id IS NULL OR p.office_id = p_office_id);

  SELECT COUNT(*) INTO v_sales
  FROM public.sales s
  WHERE s.transaction_type = 'sale'
    AND s.sale_date >= p_start_date AND s.sale_date <= p_end_date
    AND (p_user_id IS NULL OR s.user_id = p_user_id)
    AND (p_office_id IS NULL OR s.office_id = p_office_id);

  SELECT COUNT(*) INTO v_rentals
  FROM public.sales s
  WHERE s.transaction_type = 'rental'
    AND s.sale_date >= p_start_date AND s.sale_date <= p_end_date
    AND (p_user_id IS NULL OR s.user_id = p_user_id)
    AND (p_office_id IS NULL OR s.office_id = p_office_id);

  RETURN QUERY
  SELECT 'Portföy'::text, 1, v_total_properties, 100.0::numeric, 100.0::numeric
  UNION ALL
  SELECT 'Gösterim'::text, 2, v_showings,
    CASE WHEN v_total_properties > 0 THEN ROUND((v_showings::numeric / v_total_properties * 100), 1) ELSE 0 END,
    CASE WHEN v_total_properties > 0 THEN ROUND((v_showings::numeric / v_total_properties * 100), 1) ELSE 0 END
  UNION ALL
  SELECT 'Kapora'::text, 3, v_deposits,
    CASE WHEN v_total_properties > 0 THEN ROUND((v_deposits::numeric / v_total_properties * 100), 1) ELSE 0 END,
    CASE WHEN v_showings > 0 THEN ROUND((v_deposits::numeric / v_showings * 100), 1) ELSE 0 END
  UNION ALL
  SELECT 'Satış'::text, 4, v_sales,
    CASE WHEN v_total_properties > 0 THEN ROUND((v_sales::numeric / v_total_properties * 100), 1) ELSE 0 END,
    CASE WHEN v_deposits > 0 THEN ROUND((v_sales::numeric / v_deposits * 100), 1) ELSE 0 END
  UNION ALL
  SELECT 'Kiralama'::text, 5, v_rentals,
    CASE WHEN v_total_properties > 0 THEN ROUND((v_rentals::numeric / v_total_properties * 100), 1) ELSE 0 END,
    0::numeric
  ORDER BY 2;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 3: get_performance_insights
DROP FUNCTION IF EXISTS get_performance_insights(uuid, uuid, date, date);
CREATE OR REPLACE FUNCTION get_performance_insights(
  p_user_id uuid DEFAULT NULL,
  p_office_id uuid DEFAULT NULL,
  p_start_date date DEFAULT (CURRENT_DATE - INTERVAL '30 days')::date,
  p_end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  metric_name text,
  metric_value numeric,
  metric_unit text,
  change_from_previous numeric,
  insight_text text
) AS $$
DECLARE
  v_total_properties bigint;
  v_total_sales bigint;
  v_total_rentals bigint;
  v_total_activities bigint;
  v_total_commission numeric;
  v_avg_sale_days numeric;
  v_best_day text;
  v_best_day_count bigint;
  v_conversion_rate numeric;
  v_activity_per_result numeric;
  v_prev_commission numeric;
  v_prev_sales bigint;
  v_period_days integer;
BEGIN
  v_period_days := p_end_date - p_start_date + 1;

  SELECT COUNT(*) INTO v_total_properties
  FROM public.properties p
  WHERE (p_user_id IS NULL OR p.user_id = p_user_id)
    AND (p_office_id IS NULL OR p.office_id = p_office_id)
    AND p.created_at::date >= p_start_date;

  SELECT COUNT(*), COALESCE(SUM(s.commission_amount), 0)
  INTO v_total_sales, v_total_commission
  FROM public.sales s
  WHERE s.transaction_type = 'sale'
    AND s.sale_date >= p_start_date AND s.sale_date <= p_end_date
    AND (p_user_id IS NULL OR s.user_id = p_user_id)
    AND (p_office_id IS NULL OR s.office_id = p_office_id);

  SELECT COUNT(*) INTO v_total_rentals
  FROM public.sales s
  WHERE s.transaction_type = 'rental'
    AND s.sale_date >= p_start_date AND s.sale_date <= p_end_date
    AND (p_user_id IS NULL OR s.user_id = p_user_id)
    AND (p_office_id IS NULL OR s.office_id = p_office_id);

  SELECT COUNT(*) INTO v_total_activities
  FROM public.activities a
  WHERE a.date >= p_start_date AND a.date <= p_end_date
    AND (p_user_id IS NULL OR a.user_id = p_user_id)
    AND (p_office_id IS NULL OR a.office_id = p_office_id);

  SELECT COALESCE(AVG(s.sale_date - p.created_at::date), 0)
  INTO v_avg_sale_days
  FROM public.sales s
  JOIN public.properties p ON p.id = s.property_id
  WHERE s.transaction_type = 'sale'
    AND s.sale_date >= p_start_date AND s.sale_date <= p_end_date
    AND (p_user_id IS NULL OR s.user_id = p_user_id)
    AND (p_office_id IS NULL OR s.office_id = p_office_id);

  SELECT to_char(a.date, 'Day'), COUNT(*)
  INTO v_best_day, v_best_day_count
  FROM public.activities a
  WHERE a.date >= p_start_date AND a.date <= p_end_date
    AND (p_user_id IS NULL OR a.user_id = p_user_id)
    AND (p_office_id IS NULL OR a.office_id = p_office_id)
  GROUP BY to_char(a.date, 'Day')
  ORDER BY 2 DESC LIMIT 1;

  SELECT COALESCE(SUM(s.commission_amount), 0), COUNT(*)
  INTO v_prev_commission, v_prev_sales
  FROM public.sales s
  WHERE s.sale_date >= (p_start_date - v_period_days) AND s.sale_date < p_start_date
    AND (p_user_id IS NULL OR s.user_id = p_user_id)
    AND (p_office_id IS NULL OR s.office_id = p_office_id);

  v_conversion_rate := CASE WHEN v_total_properties > 0
    THEN ROUND(((v_total_sales + v_total_rentals)::numeric / v_total_properties * 100), 1) ELSE 0 END;

  v_activity_per_result := CASE WHEN (v_total_sales + v_total_rentals) > 0
    THEN ROUND((v_total_activities::numeric / (v_total_sales + v_total_rentals)), 1) ELSE v_total_activities END;

  RETURN QUERY
  SELECT 'conversion_rate'::text, v_conversion_rate, '%'::text, 0::numeric, 'Portföyden satış/kiralamaya dönüşüm oranı'::text
  UNION ALL
  SELECT 'activity_per_result'::text, v_activity_per_result, 'aktivite'::text, 0::numeric, 'Her satış/kiralama için ortalama aktivite'::text
  UNION ALL
  SELECT 'avg_sale_duration'::text, ROUND(v_avg_sale_days, 0), 'gün'::text, 0::numeric, 'Portföye eklenmeden satışa kadar süre'::text
  UNION ALL
  SELECT 'best_day'::text, COALESCE(v_best_day_count, 0)::numeric, COALESCE(TRIM(v_best_day), 'N/A')::text, 0::numeric, 'En verimli çalışma günü'::text
  UNION ALL
  SELECT 'period_commission'::text, v_total_commission, 'TL'::text,
    CASE WHEN v_prev_commission > 0 THEN ROUND(((v_total_commission - v_prev_commission) / v_prev_commission * 100), 1) ELSE 0 END,
    'Dönem toplam komisyon'::text
  UNION ALL
  SELECT 'period_transactions'::text, (v_total_sales + v_total_rentals)::numeric, 'işlem'::text,
    CASE WHEN v_prev_sales > 0 THEN ROUND((((v_total_sales + v_total_rentals) - v_prev_sales)::numeric / v_prev_sales * 100), 1) ELSE 0 END,
    'Dönem toplam satış ve kiralama'::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 4: get_goal_progress
DROP FUNCTION IF EXISTS get_goal_progress(uuid, uuid);
CREATE OR REPLACE FUNCTION get_goal_progress(
  p_user_id uuid DEFAULT NULL,
  p_office_id uuid DEFAULT NULL
)
RETURNS TABLE (
  goal_id uuid,
  metric_type text,
  target_value numeric,
  actual_value numeric,
  progress_percentage numeric,
  period text,
  period_start date,
  period_end date,
  days_remaining integer,
  on_track boolean,
  status text
) AS $$
BEGIN
  UPDATE public.goals g
  SET actual_value = (
    CASE g.metric_type
      WHEN 'sales_count' THEN (SELECT COUNT(*) FROM public.sales s WHERE s.transaction_type = 'sale' AND s.sale_date >= g.period_start AND s.sale_date <= g.period_end AND (g.user_id IS NULL OR s.user_id = g.user_id))
      WHEN 'rental_count' THEN (SELECT COUNT(*) FROM public.sales s WHERE s.transaction_type = 'rental' AND s.sale_date >= g.period_start AND s.sale_date <= g.period_end AND (g.user_id IS NULL OR s.user_id = g.user_id))
      WHEN 'total_commission' THEN (SELECT COALESCE(SUM(s.commission_amount), 0) FROM public.sales s WHERE s.sale_date >= g.period_start AND s.sale_date <= g.period_end AND (g.user_id IS NULL OR s.user_id = g.user_id))
      WHEN 'new_properties' THEN (SELECT COUNT(*) FROM public.properties p WHERE p.created_at::date >= g.period_start AND p.created_at::date <= g.period_end AND (g.user_id IS NULL OR p.user_id = g.user_id))
      WHEN 'new_customers' THEN (SELECT COUNT(*) FROM public.customers c WHERE c.created_at::date >= g.period_start AND c.created_at::date <= g.period_end AND (g.user_id IS NULL OR c.user_id = g.user_id))
      WHEN 'activities_count' THEN (SELECT COUNT(*) FROM public.activities a WHERE a.date >= g.period_start AND a.date <= g.period_end AND (g.user_id IS NULL OR a.user_id = g.user_id))
      WHEN 'showings_count' THEN (SELECT COUNT(*) FROM public.activities a WHERE a.type = 'Yer Gösterimi' AND a.date >= g.period_start AND a.date <= g.period_end AND (g.user_id IS NULL OR a.user_id = g.user_id))
      ELSE g.actual_value
    END
  ),
  status = CASE WHEN g.period_end < CURRENT_DATE AND g.actual_value >= g.target_value THEN 'completed' WHEN g.period_end < CURRENT_DATE THEN 'expired' ELSE g.status END
  WHERE g.auto_calculated = true
    AND (p_user_id IS NULL OR g.user_id = p_user_id)
    AND (p_office_id IS NULL OR g.office_id = p_office_id);

  RETURN QUERY
  SELECT
    g.id as goal_id, g.metric_type, g.target_value, g.actual_value,
    CASE WHEN g.target_value > 0 THEN ROUND((g.actual_value / g.target_value * 100), 1) ELSE 0 END as progress_percentage,
    g.period, g.period_start, g.period_end,
    GREATEST(g.period_end - CURRENT_DATE, 0)::integer as days_remaining,
    CASE WHEN g.period_end <= CURRENT_DATE THEN g.actual_value >= g.target_value
      ELSE ((g.actual_value / NULLIF(g.target_value, 0)) >= ((CURRENT_DATE - g.period_start)::numeric / NULLIF((g.period_end - g.period_start), 0)::numeric))
    END as on_track,
    g.status
  FROM public.goals g
  WHERE (p_user_id IS NULL OR g.user_id = p_user_id)
    AND (p_office_id IS NULL OR g.office_id = p_office_id)
    AND g.status IN ('active', 'completed')
  ORDER BY g.period_end ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_activity_trend TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversion_funnel TO authenticated;
GRANT EXECUTE ON FUNCTION get_performance_insights TO authenticated;
GRANT EXECUTE ON FUNCTION get_goal_progress TO authenticated;

-- =====================================================
-- DONE! All analytics functions are now available.
-- =====================================================
