import { supabase } from './supabaseClient';
import { Subscription, PlanLimits, PlanType, AdminUser } from '../types';

// Plan limitleri cache
let planLimitsCache: PlanLimits[] | null = null;

/**
 * Tüm plan limitlerini getir
 */
export async function getAllPlanLimits(): Promise<PlanLimits[]> {
  if (planLimitsCache) {
    return planLimitsCache;
  }

  const { data, error } = await supabase
    .from('plan_limits')
    .select('*');

  if (error) {
    console.error('Plan limits fetch error:', error);
    // Fallback değerler
    return [
      { plan: 'free', maxProperties: 20, maxCustomers: 50, priceMonthly: 0 },
      { plan: 'pro', maxProperties: -1, maxCustomers: -1, priceMonthly: 199 }
    ];
  }

  planLimitsCache = (data || []).map(p => ({
    plan: p.plan as PlanType,
    maxProperties: p.max_properties,
    maxCustomers: p.max_customers,
    priceMonthly: p.price_monthly,
    description: p.description
  }));

  return planLimitsCache;
}

/**
 * Belirli bir planın limitlerini getir
 */
export async function getPlanLimits(plan: PlanType): Promise<PlanLimits> {
  const allLimits = await getAllPlanLimits();
  const found = allLimits.find(p => p.plan === plan);

  if (!found) {
    // Fallback: free plan
    return { plan: 'free', maxProperties: 20, maxCustomers: 50, priceMonthly: 0 };
  }

  return found;
}

/**
 * Kullanıcının aboneliğini getir
 */
export async function getSubscription(userId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Subscription fetch error:', error);
    return null;
  }

  if (!data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    officeId: data.office_id,
    plan: data.plan as PlanType,
    status: data.status,
    startedAt: data.started_at,
    expiresAt: data.expires_at,
    adminNotes: data.admin_notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

/**
 * Portföy limiti kontrolü
 */
export async function checkPropertyLimit(
  userId: string,
  currentCount: number
): Promise<{ allowed: boolean; remaining: number; limit: number; message?: string }> {
  const subscription = await getSubscription(userId);
  const plan = subscription?.plan || 'free';
  const limits = await getPlanLimits(plan);

  // -1 = sınırsız
  if (limits.maxProperties === -1) {
    return { allowed: true, remaining: -1, limit: -1 };
  }

  const remaining = limits.maxProperties - currentCount;

  if (currentCount >= limits.maxProperties) {
    return {
      allowed: false,
      remaining: 0,
      limit: limits.maxProperties,
      message: `Portföy limitinize (${limits.maxProperties}) ulaştınız. Pro plana yükselterek sınırsız portföy ekleyebilirsiniz.`
    };
  }

  return { allowed: true, remaining, limit: limits.maxProperties };
}

/**
 * Müşteri limiti kontrolü
 */
export async function checkCustomerLimit(
  userId: string,
  currentCount: number
): Promise<{ allowed: boolean; remaining: number; limit: number; message?: string }> {
  const subscription = await getSubscription(userId);
  const plan = subscription?.plan || 'free';
  const limits = await getPlanLimits(plan);

  // -1 = sınırsız
  if (limits.maxCustomers === -1) {
    return { allowed: true, remaining: -1, limit: -1 };
  }

  const remaining = limits.maxCustomers - currentCount;

  if (currentCount >= limits.maxCustomers) {
    return {
      allowed: false,
      remaining: 0,
      limit: limits.maxCustomers,
      message: `Müşteri limitinize (${limits.maxCustomers}) ulaştınız. Pro plana yükselterek sınırsız müşteri ekleyebilirsiniz.`
    };
  }

  return { allowed: true, remaining, limit: limits.maxCustomers };
}

/**
 * Abonelik oluştur (yeni kullanıcı için)
 */
export async function createSubscription(
  userId: string,
  plan: PlanType = 'free',
  officeId?: string
): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      office_id: officeId,
      plan,
      status: 'active'
    })
    .select()
    .single();

  if (error) {
    console.error('Subscription create error:', error);
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    officeId: data.office_id,
    plan: data.plan as PlanType,
    status: data.status,
    startedAt: data.started_at,
    expiresAt: data.expires_at,
    adminNotes: data.admin_notes
  };
}

// ==================== ADMIN FUNCTIONS ====================

/**
 * Admin kontrolü
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', userId)
    .single();

  return !error && !!data;
}

/**
 * Admin bilgisini getir
 */
export async function getAdminUser(userId: string): Promise<AdminUser | null> {
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    role: data.role
  };
}

/**
 * Tüm abonelikleri getir (admin)
 */
export async function getAllSubscriptions(): Promise<Subscription[]> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      *,
      profiles:user_id (full_name, email)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('All subscriptions fetch error:', error);
    return [];
  }

  return (data || []).map(s => ({
    id: s.id,
    userId: s.user_id,
    officeId: s.office_id,
    plan: s.plan as PlanType,
    status: s.status,
    startedAt: s.started_at,
    expiresAt: s.expires_at,
    adminNotes: s.admin_notes,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
    // @ts-ignore - joined data
    userName: s.profiles?.full_name,
    // @ts-ignore
    userEmail: s.profiles?.email
  }));
}

/**
 * Abonelik güncelle (admin)
 */
export async function updateSubscription(
  subscriptionId: string,
  updates: Partial<{
    plan: PlanType;
    status: string;
    expiresAt: string;
    adminNotes: string;
  }>
): Promise<boolean> {
  const { error } = await supabase
    .from('subscriptions')
    .update({
      plan: updates.plan,
      status: updates.status,
      expires_at: updates.expiresAt,
      admin_notes: updates.adminNotes,
      updated_at: new Date().toISOString()
    })
    .eq('id', subscriptionId);

  if (error) {
    console.error('Subscription update error:', error);
    return false;
  }

  return true;
}

/**
 * Tüm kullanıcıları getir (admin)
 */
export async function getAllUsers(): Promise<any[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      subscriptions (*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('All users fetch error:', error);
    return [];
  }

  return data || [];
}

/**
 * Kullanıcının planını değiştir (admin)
 */
export async function changeUserPlan(userId: string, newPlan: PlanType): Promise<boolean> {
  const { error } = await supabase
    .from('subscriptions')
    .update({
      plan: newPlan,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Plan change error:', error);
    return false;
  }

  // profiles tablosunu da güncelle
  await supabase
    .from('profiles')
    .update({ subscription_plan: newPlan })
    .eq('id', userId);

  return true;
}
