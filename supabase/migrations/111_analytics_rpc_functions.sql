-- Migration: Analytics RPC Functions
-- Server-side functions for analytics calculations

-- 1. Function: get_activity_trend
-- Returns time-based activity trend data
DROP FUNCTION IF EXISTS get_activity_trend(uuid, uuid, date, date, text);
CREATE OR REPLACE FUNCTION get_activity_trend(
  p_user_id uuid DEFAULT NULL,
  p_office_id uuid DEFAULT NULL,
  p_start_date date DEFAULT (CURRENT_DATE - INTERVAL '30 days')::date,
  p_end_date date DEFAULT CURRENT_DATE,
  p_granularity text DEFAULT 'daily' -- daily, weekly, monthly
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

-- 2. Function: get_conversion_funnel
-- Returns funnel metrics: Portfolio → Showings → Deposits → Sales
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
  -- Total active properties in period
  SELECT COUNT(*) INTO v_total_properties
  FROM public.properties p
  WHERE (p_user_id IS NULL OR p.user_id = p_user_id)
    AND (p_office_id IS NULL OR p.office_id = p_office_id)
    AND p.created_at::date >= p_start_date
    AND p.created_at::date <= p_end_date;

  -- Total showings
  SELECT COUNT(*) INTO v_showings
  FROM public.activities a
  WHERE a.type = 'Yer Gösterimi'
    AND a.date >= p_start_date
    AND a.date <= p_end_date
    AND (p_user_id IS NULL OR a.user_id = p_user_id)
    AND (p_office_id IS NULL OR a.office_id = p_office_id);

  -- Total deposits
  SELECT COUNT(*) INTO v_deposits
  FROM public.properties p
  WHERE p.listing_status = 'Kapora Alındı'
    AND p.deposit_date >= p_start_date
    AND p.deposit_date <= p_end_date
    AND (p_user_id IS NULL OR p.user_id = p_user_id)
    AND (p_office_id IS NULL OR p.office_id = p_office_id);

  -- Total sales
  SELECT COUNT(*) INTO v_sales
  FROM public.sales s
  WHERE s.transaction_type = 'sale'
    AND s.sale_date >= p_start_date
    AND s.sale_date <= p_end_date
    AND (p_user_id IS NULL OR s.user_id = p_user_id)
    AND (p_office_id IS NULL OR s.office_id = p_office_id);

  -- Total rentals
  SELECT COUNT(*) INTO v_rentals
  FROM public.sales s
  WHERE s.transaction_type = 'rental'
    AND s.sale_date >= p_start_date
    AND s.sale_date <= p_end_date
    AND (p_user_id IS NULL OR s.user_id = p_user_id)
    AND (p_office_id IS NULL OR s.office_id = p_office_id);

  -- Return funnel data
  RETURN QUERY
  SELECT
    'Portföy' as stage,
    1 as stage_order,
    v_total_properties as count,
    100.0 as percentage,
    100.0 as from_previous_percentage
  UNION ALL
  SELECT
    'Gösterim' as stage,
    2 as stage_order,
    v_showings as count,
    CASE WHEN v_total_properties > 0 THEN ROUND((v_showings::numeric / v_total_properties * 100), 1) ELSE 0 END as percentage,
    CASE WHEN v_total_properties > 0 THEN ROUND((v_showings::numeric / v_total_properties * 100), 1) ELSE 0 END as from_previous_percentage
  UNION ALL
  SELECT
    'Kapora' as stage,
    3 as stage_order,
    v_deposits as count,
    CASE WHEN v_total_properties > 0 THEN ROUND((v_deposits::numeric / v_total_properties * 100), 1) ELSE 0 END as percentage,
    CASE WHEN v_showings > 0 THEN ROUND((v_deposits::numeric / v_showings * 100), 1) ELSE 0 END as from_previous_percentage
  UNION ALL
  SELECT
    'Satış' as stage,
    4 as stage_order,
    v_sales as count,
    CASE WHEN v_total_properties > 0 THEN ROUND((v_sales::numeric / v_total_properties * 100), 1) ELSE 0 END as percentage,
    CASE WHEN v_deposits > 0 THEN ROUND((v_sales::numeric / v_deposits * 100), 1) ELSE 0 END as from_previous_percentage
  UNION ALL
  SELECT
    'Kiralama' as stage,
    5 as stage_order,
    v_rentals as count,
    CASE WHEN v_total_properties > 0 THEN ROUND((v_rentals::numeric / v_total_properties * 100), 1) ELSE 0 END as percentage,
    0 as from_previous_percentage -- Rentals are separate from sales funnel
  ORDER BY stage_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Function: get_performance_insights
-- Returns calculated performance metrics and insights
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

  -- Total properties created in period
  SELECT COUNT(*) INTO v_total_properties
  FROM public.properties p
  WHERE (p_user_id IS NULL OR p.user_id = p_user_id)
    AND (p_office_id IS NULL OR p.office_id = p_office_id)
    AND p.created_at::date >= p_start_date;

  -- Total sales
  SELECT COUNT(*), COALESCE(SUM(s.commission_amount), 0)
  INTO v_total_sales, v_total_commission
  FROM public.sales s
  WHERE s.transaction_type = 'sale'
    AND s.sale_date >= p_start_date
    AND s.sale_date <= p_end_date
    AND (p_user_id IS NULL OR s.user_id = p_user_id)
    AND (p_office_id IS NULL OR s.office_id = p_office_id);

  -- Total rentals
  SELECT COUNT(*) INTO v_total_rentals
  FROM public.sales s
  WHERE s.transaction_type = 'rental'
    AND s.sale_date >= p_start_date
    AND s.sale_date <= p_end_date
    AND (p_user_id IS NULL OR s.user_id = p_user_id)
    AND (p_office_id IS NULL OR s.office_id = p_office_id);

  -- Total activities
  SELECT COUNT(*) INTO v_total_activities
  FROM public.activities a
  WHERE a.date >= p_start_date
    AND a.date <= p_end_date
    AND (p_user_id IS NULL OR a.user_id = p_user_id)
    AND (p_office_id IS NULL OR a.office_id = p_office_id);

  -- Average sale duration (days from property creation to sale)
  SELECT COALESCE(AVG(s.sale_date - p.created_at::date), 0)
  INTO v_avg_sale_days
  FROM public.sales s
  JOIN public.properties p ON p.id = s.property_id
  WHERE s.transaction_type = 'sale'
    AND s.sale_date >= p_start_date
    AND s.sale_date <= p_end_date
    AND (p_user_id IS NULL OR s.user_id = p_user_id)
    AND (p_office_id IS NULL OR s.office_id = p_office_id);

  -- Best performing day of week
  SELECT to_char(a.date, 'Day'), COUNT(*)
  INTO v_best_day, v_best_day_count
  FROM public.activities a
  WHERE a.date >= p_start_date
    AND a.date <= p_end_date
    AND (p_user_id IS NULL OR a.user_id = p_user_id)
    AND (p_office_id IS NULL OR a.office_id = p_office_id)
  GROUP BY to_char(a.date, 'Day')
  ORDER BY 2 DESC
  LIMIT 1;

  -- Previous period comparison (same duration before start_date)
  SELECT COALESCE(SUM(s.commission_amount), 0), COUNT(*)
  INTO v_prev_commission, v_prev_sales
  FROM public.sales s
  WHERE s.sale_date >= (p_start_date - v_period_days)
    AND s.sale_date < p_start_date
    AND (p_user_id IS NULL OR s.user_id = p_user_id)
    AND (p_office_id IS NULL OR s.office_id = p_office_id);

  -- Calculate metrics
  v_conversion_rate := CASE
    WHEN v_total_properties > 0 THEN ROUND(((v_total_sales + v_total_rentals)::numeric / v_total_properties * 100), 1)
    ELSE 0
  END;

  v_activity_per_result := CASE
    WHEN (v_total_sales + v_total_rentals) > 0 THEN ROUND((v_total_activities::numeric / (v_total_sales + v_total_rentals)), 1)
    ELSE v_total_activities
  END;

  -- Return metrics
  RETURN QUERY
  SELECT
    'conversion_rate' as metric_name,
    v_conversion_rate as metric_value,
    '%' as metric_unit,
    0::numeric as change_from_previous,
    'Portföyden satış/kiralamaya dönüşüm oranı' as insight_text
  UNION ALL
  SELECT
    'activity_per_result' as metric_name,
    v_activity_per_result as metric_value,
    'aktivite' as metric_unit,
    0::numeric as change_from_previous,
    'Her satış/kiralama için ortalama aktivite sayısı' as insight_text
  UNION ALL
  SELECT
    'avg_sale_duration' as metric_name,
    ROUND(v_avg_sale_days, 0) as metric_value,
    'gün' as metric_unit,
    0::numeric as change_from_previous,
    'Portföye eklenmeden satışa kadar ortalama süre' as insight_text
  UNION ALL
  SELECT
    'best_day' as metric_name,
    v_best_day_count as metric_value,
    COALESCE(TRIM(v_best_day), 'N/A') as metric_unit,
    0::numeric as change_from_previous,
    'En verimli çalışma günü' as insight_text
  UNION ALL
  SELECT
    'period_commission' as metric_name,
    v_total_commission as metric_value,
    'TL' as metric_unit,
    CASE
      WHEN v_prev_commission > 0 THEN ROUND(((v_total_commission - v_prev_commission) / v_prev_commission * 100), 1)
      ELSE 0
    END as change_from_previous,
    'Dönem toplam komisyon' as insight_text
  UNION ALL
  SELECT
    'period_transactions' as metric_name,
    (v_total_sales + v_total_rentals)::numeric as metric_value,
    'işlem' as metric_unit,
    CASE
      WHEN v_prev_sales > 0 THEN ROUND((((v_total_sales + v_total_rentals) - v_prev_sales)::numeric / v_prev_sales * 100), 1)
      ELSE 0
    END as change_from_previous,
    'Dönem toplam satış ve kiralama' as insight_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function: get_goal_progress
-- Returns current progress for all active goals
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
  -- Update actual values before returning
  UPDATE public.goals g
  SET actual_value = (
    CASE g.metric_type
      WHEN 'sales_count' THEN (
        SELECT COUNT(*) FROM public.sales s
        WHERE s.transaction_type = 'sale'
          AND s.sale_date >= g.period_start
          AND s.sale_date <= g.period_end
          AND (g.user_id IS NULL OR s.user_id = g.user_id)
      )
      WHEN 'rental_count' THEN (
        SELECT COUNT(*) FROM public.sales s
        WHERE s.transaction_type = 'rental'
          AND s.sale_date >= g.period_start
          AND s.sale_date <= g.period_end
          AND (g.user_id IS NULL OR s.user_id = g.user_id)
      )
      WHEN 'total_commission' THEN (
        SELECT COALESCE(SUM(s.commission_amount), 0) FROM public.sales s
        WHERE s.sale_date >= g.period_start
          AND s.sale_date <= g.period_end
          AND (g.user_id IS NULL OR s.user_id = g.user_id)
      )
      WHEN 'new_properties' THEN (
        SELECT COUNT(*) FROM public.properties p
        WHERE p.created_at::date >= g.period_start
          AND p.created_at::date <= g.period_end
          AND (g.user_id IS NULL OR p.user_id = g.user_id)
      )
      WHEN 'new_customers' THEN (
        SELECT COUNT(*) FROM public.customers c
        WHERE c.created_at::date >= g.period_start
          AND c.created_at::date <= g.period_end
          AND (g.user_id IS NULL OR c.user_id = g.user_id)
      )
      WHEN 'activities_count' THEN (
        SELECT COUNT(*) FROM public.activities a
        WHERE a.date >= g.period_start
          AND a.date <= g.period_end
          AND (g.user_id IS NULL OR a.user_id = g.user_id)
      )
      WHEN 'showings_count' THEN (
        SELECT COUNT(*) FROM public.activities a
        WHERE a.type = 'Yer Gösterimi'
          AND a.date >= g.period_start
          AND a.date <= g.period_end
          AND (g.user_id IS NULL OR a.user_id = g.user_id)
      )
      ELSE g.actual_value
    END
  ),
  status = CASE
    WHEN g.period_end < CURRENT_DATE AND g.actual_value >= g.target_value THEN 'completed'
    WHEN g.period_end < CURRENT_DATE THEN 'expired'
    ELSE g.status
  END
  WHERE g.auto_calculated = true
    AND (p_user_id IS NULL OR g.user_id = p_user_id)
    AND (p_office_id IS NULL OR g.office_id = p_office_id);

  -- Return goal progress
  RETURN QUERY
  SELECT
    g.id as goal_id,
    g.metric_type,
    g.target_value,
    g.actual_value,
    CASE WHEN g.target_value > 0 THEN ROUND((g.actual_value / g.target_value * 100), 1) ELSE 0 END as progress_percentage,
    g.period,
    g.period_start,
    g.period_end,
    GREATEST(g.period_end - CURRENT_DATE, 0)::integer as days_remaining,
    CASE
      WHEN g.period_end <= CURRENT_DATE THEN g.actual_value >= g.target_value
      ELSE (
        -- Calculate if on track based on elapsed time
        (g.actual_value / NULLIF(g.target_value, 0)) >=
        ((CURRENT_DATE - g.period_start)::numeric / NULLIF((g.period_end - g.period_start), 0)::numeric)
      )
    END as on_track,
    g.status
  FROM public.goals g
  WHERE (p_user_id IS NULL OR g.user_id = p_user_id)
    AND (p_office_id IS NULL OR g.office_id = p_office_id)
    AND g.status IN ('active', 'completed')
  ORDER BY g.period_end ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_activity_trend TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversion_funnel TO authenticated;
GRANT EXECUTE ON FUNCTION get_performance_insights TO authenticated;
GRANT EXECUTE ON FUNCTION get_goal_progress TO authenticated;

-- Done
COMMENT ON FUNCTION get_activity_trend IS 'Returns time-based activity trend data for analytics';
COMMENT ON FUNCTION get_conversion_funnel IS 'Returns funnel metrics from portfolio to sales';
COMMENT ON FUNCTION get_performance_insights IS 'Returns calculated performance metrics and insights';
COMMENT ON FUNCTION get_goal_progress IS 'Returns current progress for all active goals';
