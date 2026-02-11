/**
 * Analytics Service
 * Provides methods for fetching analytics data and managing goals
 */

import { supabase } from './supabaseClient';
import type {
  Goal,
  GoalMetricType,
  GoalPeriod,
  ActivityTrendData,
  ConversionFunnelData,
  PerformanceInsight,
  GoalProgress,
} from '../types';

// ==================== RPC Functions ====================

/**
 * Get activity trend data over time
 */
export async function getActivityTrend(
  userId?: string,
  officeId?: string,
  startDate?: string,
  endDate?: string,
  granularity: 'daily' | 'weekly' | 'monthly' = 'daily'
): Promise<ActivityTrendData[]> {
  const { data, error } = await supabase.rpc('get_activity_trend', {
    p_user_id: userId || null,
    p_office_id: officeId || null,
    p_start_date: startDate || null,
    p_end_date: endDate || null,
    p_granularity: granularity,
  });

  if (error) {
    console.error('Error fetching activity trend:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get conversion funnel data
 */
export async function getConversionFunnel(
  userId?: string,
  officeId?: string,
  startDate?: string,
  endDate?: string
): Promise<ConversionFunnelData[]> {
  const { data, error } = await supabase.rpc('get_conversion_funnel', {
    p_user_id: userId || null,
    p_office_id: officeId || null,
    p_start_date: startDate || null,
    p_end_date: endDate || null,
  });

  if (error) {
    console.error('Error fetching conversion funnel:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get performance insights
 */
export async function getPerformanceInsights(
  userId?: string,
  officeId?: string,
  startDate?: string,
  endDate?: string
): Promise<PerformanceInsight[]> {
  const { data, error } = await supabase.rpc('get_performance_insights', {
    p_user_id: userId || null,
    p_office_id: officeId || null,
    p_start_date: startDate || null,
    p_end_date: endDate || null,
  });

  if (error) {
    console.error('Error fetching performance insights:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get goal progress for active goals
 */
export async function getGoalProgress(
  userId?: string,
  officeId?: string
): Promise<GoalProgress[]> {
  const { data, error } = await supabase.rpc('get_goal_progress', {
    p_user_id: userId || null,
    p_office_id: officeId || null,
  });

  if (error) {
    console.error('Error fetching goal progress:', error);
    throw error;
  }

  return data || [];
}

// ==================== Goal CRUD Operations ====================

/**
 * Create a new goal
 */
export async function createGoal(goal: {
  userId: string;
  officeId?: string;
  metricType: GoalMetricType;
  targetValue: number;
  period: GoalPeriod;
  periodStart: string;
  periodEnd: string;
  autoCalculated?: boolean;
}): Promise<Goal> {
  const { data, error } = await supabase
    .from('goals')
    .insert({
      user_id: goal.userId,
      office_id: goal.officeId || null,
      metric_type: goal.metricType,
      target_value: goal.targetValue,
      period: goal.period,
      period_start: goal.periodStart,
      period_end: goal.periodEnd,
      auto_calculated: goal.autoCalculated ?? true,
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating goal:', error);
    throw error;
  }

  return mapDbGoalToGoal(data);
}

/**
 * Update goal progress (for manual goals)
 */
export async function updateGoalProgress(
  goalId: string,
  actualValue: number
): Promise<Goal> {
  const { data, error } = await supabase
    .from('goals')
    .update({
      actual_value: actualValue,
      updated_at: new Date().toISOString(),
    })
    .eq('id', goalId)
    .select()
    .single();

  if (error) {
    console.error('Error updating goal progress:', error);
    throw error;
  }

  return mapDbGoalToGoal(data);
}

/**
 * Update goal status
 */
export async function updateGoalStatus(
  goalId: string,
  status: 'active' | 'completed' | 'cancelled'
): Promise<Goal> {
  const { data, error } = await supabase
    .from('goals')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', goalId)
    .select()
    .single();

  if (error) {
    console.error('Error updating goal status:', error);
    throw error;
  }

  return mapDbGoalToGoal(data);
}

/**
 * Delete a goal
 */
export async function deleteGoal(goalId: string): Promise<void> {
  const { error } = await supabase.from('goals').delete().eq('id', goalId);

  if (error) {
    console.error('Error deleting goal:', error);
    throw error;
  }
}

/**
 * Get all goals for a user
 */
export async function getUserGoals(userId: string): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('period_end', { ascending: true });

  if (error) {
    console.error('Error fetching user goals:', error);
    throw error;
  }

  return (data || []).map(mapDbGoalToGoal);
}

// ==================== Helper Functions ====================

/**
 * Map database goal record to Goal interface
 */
function mapDbGoalToGoal(dbGoal: any): Goal {
  return {
    id: dbGoal.id,
    userId: dbGoal.user_id,
    user_id: dbGoal.user_id,
    officeId: dbGoal.office_id,
    office_id: dbGoal.office_id,
    metricType: dbGoal.metric_type,
    metric_type: dbGoal.metric_type,
    targetValue: dbGoal.target_value,
    target_value: dbGoal.target_value,
    actualValue: dbGoal.actual_value || 0,
    actual_value: dbGoal.actual_value,
    period: dbGoal.period,
    periodStart: dbGoal.period_start,
    period_start: dbGoal.period_start,
    periodEnd: dbGoal.period_end,
    period_end: dbGoal.period_end,
    autoCalculated: dbGoal.auto_calculated,
    auto_calculated: dbGoal.auto_calculated,
    insightText: dbGoal.insight_text,
    insight_text: dbGoal.insight_text,
    status: dbGoal.status,
    createdAt: dbGoal.created_at,
    created_at: dbGoal.created_at,
    updatedAt: dbGoal.updated_at,
    updated_at: dbGoal.updated_at,
  };
}

/**
 * Get date range for a period
 */
export function getPeriodDateRange(period: GoalPeriod): {
  start: string;
  end: string;
} {
  const now = new Date();
  let start: Date;
  let end: Date;

  switch (period) {
    case 'daily':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(start);
      end.setDate(end.getDate() + 1);
      end.setMilliseconds(-1);
      break;

    case 'weekly':
      const dayOfWeek = now.getDay();
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday start
      start = new Date(now.getFullYear(), now.getMonth(), diff);
      end = new Date(start);
      end.setDate(end.getDate() + 7);
      end.setMilliseconds(-1);
      break;

    case 'monthly':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;

    case 'quarterly':
      const quarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), quarter * 3, 1);
      end = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
      break;

    case 'yearly':
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
      break;

    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

/**
 * Get metric type display name in Turkish
 */
export function getMetricTypeLabel(metricType: GoalMetricType): string {
  const labels: Record<GoalMetricType, string> = {
    sales_count: 'Satış Adedi',
    rental_count: 'Kiralama Adedi',
    total_commission: 'Toplam Komisyon',
    total_revenue: 'Toplam Ciro',
    new_properties: 'Yeni Portföy',
    new_customers: 'Yeni Müşteri',
    activities_count: 'Aktivite Sayısı',
    showings_count: 'Gösterim Sayısı',
  };
  return labels[metricType] || metricType;
}

/**
 * Get period display name in Turkish
 */
export function getPeriodLabel(period: GoalPeriod): string {
  const labels: Record<GoalPeriod, string> = {
    daily: 'Günlük',
    weekly: 'Haftalık',
    monthly: 'Aylık',
    quarterly: 'Çeyreklik',
    yearly: 'Yıllık',
  };
  return labels[period] || period;
}

/**
 * Format number for display
 */
export function formatMetricValue(
  value: number,
  metricType: GoalMetricType
): string {
  if (metricType === 'total_commission' || metricType === 'total_revenue') {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
  return new Intl.NumberFormat('tr-TR').format(value);
}
