
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Property, Customer, Site, Activity, Request, WebSiteConfig, UserProfile, Office, OfficePerformanceSettings, Sale, Subscription, PlanLimits } from '../types';
import { supabase } from '../services/supabaseClient';
import { getSubscription, getPlanLimits, checkPropertyLimit, checkCustomerLimit } from '../services/subscriptionService';
import toast from 'react-hot-toast';

import { Session } from '@supabase/supabase-js';

const PAGE_SIZE = 50;

interface DataContextType {
  session: Session | null;
  signOut: () => Promise<void>;
  properties: Property[];
  customers: Customer[];
  sites: Site[];
  activities: Activity[];
  requests: Request[];
  sales: Sale[];
  teamMembers: UserProfile[];
  webConfig: WebSiteConfig;
  userProfile: UserProfile;
  office: Office | null;
  loading: boolean;
  // Subscription
  subscription: Subscription | null;
  planLimits: PlanLimits | null;
  canAddProperty: () => Promise<{ allowed: boolean; message?: string }>;
  canAddCustomer: () => Promise<{ allowed: boolean; message?: string }>;
  getUsageStats: () => { propertyCount: number; customerCount: number; propertyLimit: number; customerLimit: number };
  // Pagination states
  hasMoreProperties: boolean;
  hasMoreCustomers: boolean;
  hasMoreActivities: boolean;
  loadingMore: boolean;
  // CRUD operations
  addProperty: (property: Property) => Promise<void>;
  updateProperty: (property: Property) => Promise<void>;
  addCustomer: (customer: Customer) => Promise<Customer>;
  updateCustomer: (customer: Customer) => Promise<void>;
  addSite: (site: Site) => Promise<void>;
  deleteSite: (id: string) => Promise<void>;
  addActivity: (activity: Activity) => Promise<void>;
  updateActivity: (activity: Activity) => Promise<void>;
  addRequest: (request: Request) => Promise<void>;
  updateRequest: (request: Request) => Promise<void>;
  addSale: (sale: Sale) => Promise<void>;
  updateWebConfig: (config: Partial<WebSiteConfig>, target?: 'personal' | 'office') => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  updateOfficeSettings: (settings: OfficePerformanceSettings) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  deleteRequest: (id: string) => Promise<void>;
  // Pagination functions
  loadMoreProperties: () => Promise<void>;
  loadMoreCustomers: () => Promise<void>;
  loadMoreActivities: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);

  // Subscription states
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [planLimits, setPlanLimits] = useState<PlanLimits | null>(null);

  // Pagination states
  const [hasMoreProperties, setHasMoreProperties] = useState(true);
  const [hasMoreCustomers, setHasMoreCustomers] = useState(true);
  const [hasMoreActivities, setHasMoreActivities] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Web Config is kept in LocalStorage for simplicity as it's browser-specific preference for the builder


  const [office, setOffice] = useState<Office | null>(null);
  const [webConfig, setWebConfig] = useState<WebSiteConfig>({
    domain: '',
    siteTitle: 'Emlak Ofisim',
    aboutText: 'Hizmetlerimiz hakkında...',
    primaryColor: '#0ea5e9',
    phone: '',
    email: '',
    isActive: false,
    layout: 'standard'
  });

  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: '', // Added id
    name: '',
    title: '',
    avatar: ''
  });

  // Auth Listener with timeout to prevent infinite loading
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    // Set a timeout to prevent infinite loading if Supabase doesn't respond
    const authTimeout = new Promise<null>((resolve) => {
      timeoutId = setTimeout(() => {
        console.warn('Supabase auth timeout - showing login screen');
        resolve(null);
      }, 10000); // 10 second timeout
    });

    // Race between getSession and timeout
    Promise.race([
      supabase.auth.getSession().then(({ data: { session } }) => session),
      authTimeout
    ]).then((session) => {
      clearTimeout(timeoutId);
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
      else {
        setUserProfile({ id: '', name: '', title: '', avatar: '' });
        setOffice(null);
      }
    });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, offices(*)')
        .eq('id', userId)
        .single();

      if (data) {
        if (!data.office_id) {
          console.warn(`USER PROFILE ALERT: User ${userId} (${data.full_name}) has no office_id assigned!`);
        }

        const profile: UserProfile = {
          id: data.id,
          name: data.full_name || data.email,
          title: data.title || 'Emlak Danışmanı',
          avatar: data.avatar_url || `https://ui-avatars.com/api/?name=${data.full_name}`,
          officeId: data.office_id,
          role: data.role || 'consultant',
          siteConfig: data.site_config
        };

        setUserProfile(profile);

        // Set Personal Web Config as default active
        if (data.site_config) {
          setWebConfig(data.site_config);
        }

        // Set Office Data if available
        if (data.offices) {
          setOffice({
            id: data.offices.id,
            name: data.offices.name,
            domain: data.offices.domain,
            ownerId: data.offices.owner_id,
            logoUrl: data.offices.logo_url,
            address: data.offices.address,
            phone: data.offices.phone,
            siteConfig: data.offices.site_config,
            performance_settings: data.offices.performance_settings
          });
        }

        // Fetch Subscription
        try {
          const sub = await getSubscription(userId);
          setSubscription(sub);

          // Get plan limits
          const plan = sub?.plan || 'free';
          const limits = await getPlanLimits(plan);
          setPlanLimits(limits);
        } catch (subError) {
          console.error('Error fetching subscription:', subError);
          // Default to free plan limits
          setPlanLimits({ plan: 'free', maxProperties: 20, maxCustomers: 50, priceMonthly: 0 });
        }
      } else if (error) {
        console.error('Error fetching profile data:', error);
      }
    } catch (error) {
      console.error('Exception in fetchUserProfile:', error);
    }
  };

  // Fetch all data from Supabase when session is available
  useEffect(() => {
    if (session) {
      fetchData();
    } else {
      // No session - stop loading so login screen can show
      setLoading(false);
    }
  }, [session]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch in parallel with pagination (limit to PAGE_SIZE)
      const [propsRes, custRes, sitesRes, actRes, reqRes, salesRes, teamRes] = await Promise.all([
        supabase.from('properties').select('*').order('created_at', { ascending: false }).limit(PAGE_SIZE),
        supabase.from('customers').select('*').order('created_at', { ascending: false }).limit(PAGE_SIZE),
        supabase.from('sites').select('*'),
        supabase.from('activities').select('*').order('date', { ascending: false }).limit(PAGE_SIZE),
        supabase.from('requests').select('*'),
        supabase.from('sales').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*') // RLS ensures we only see office members
      ]);

      if (propsRes.data) {
        setProperties(propsRes.data);
        setHasMoreProperties(propsRes.data.length === PAGE_SIZE);
      }
      if (custRes.data) {
        setCustomers(custRes.data);
        setHasMoreCustomers(custRes.data.length === PAGE_SIZE);
      }
      if (sitesRes.data) setSites(sitesRes.data);
      if (actRes.data) {
        setActivities(actRes.data);
        setHasMoreActivities(actRes.data.length === PAGE_SIZE);
      }
      if (reqRes.data) setRequests(reqRes.data);
      if (salesRes.data) setSales(salesRes.data);

      if (teamRes.data) {
        setTeamMembers(teamRes.data.map((p: any) => ({
          id: p.id,
          name: p.full_name,
          title: p.title || 'Danışman',
          avatar: p.avatar_url || `https://ui-avatars.com/api/?name=${p.full_name}`,
          email: p.email,
          officeId: p.office_id,
          role: p.role
        })));
      }

    } catch (error) {
      console.error("Error fetching data from Supabase:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Subscription Limit Checks ---

  const canAddProperty = async (): Promise<{ allowed: boolean; message?: string }> => {
    if (!session?.user.id) return { allowed: false, message: 'Oturum bulunamadı' };

    const result = await checkPropertyLimit(session.user.id, properties.length);
    return { allowed: result.allowed, message: result.message };
  };

  const canAddCustomer = async (): Promise<{ allowed: boolean; message?: string }> => {
    if (!session?.user.id) return { allowed: false, message: 'Oturum bulunamadı' };

    const result = await checkCustomerLimit(session.user.id, customers.length);
    return { allowed: result.allowed, message: result.message };
  };

  const getUsageStats = () => {
    const propertyLimit = planLimits?.maxProperties ?? 20;
    const customerLimit = planLimits?.maxCustomers ?? 50;

    return {
      propertyCount: properties.length,
      customerCount: customers.length,
      propertyLimit: propertyLimit === -1 ? Infinity : propertyLimit,
      customerLimit: customerLimit === -1 ? Infinity : customerLimit
    };
  };

  // --- Actions ---

  const addProperty = async (property: Property) => {
    // Check limit before adding
    const { allowed, message } = await canAddProperty();
    if (!allowed) {
      toast.error(message || 'Portföy limitinize ulaştınız. Pro plana yükseltin.');
      throw new Error('LIMIT_REACHED');
    }
    // Attach current user ID and Office ID
    const propertyWithUser = {
      ...property,
      user_id: session?.user.id,
      office_id: userProfile.officeId || property.office_id // Preserve existing or use current
    };

    if (!propertyWithUser.office_id) {
      console.error("CRITICAL: Attempting to add property without office_id!", propertyWithUser);
    }

    // Optimistic update
    setProperties((prev) => [propertyWithUser, ...prev]);

    const { error } = await supabase.from('properties').insert([propertyWithUser]);
    if (error) {
      console.error('Error adding property:', error);
      throw error;
    }
  };

  const updateProperty = async (updatedProperty: Property) => {
    setProperties((prev) => prev.map(p => p.id === updatedProperty.id ? updatedProperty : p));

    const { error } = await supabase.from('properties').update(updatedProperty).eq('id', updatedProperty.id);
    if (error) {
      console.error('Error updating property:', error);
      throw error;
    }
  };

  const addCustomer = async (customer: Customer): Promise<Customer> => {
    // Check limit before adding
    const { allowed, message } = await canAddCustomer();
    if (!allowed) {
      toast.error(message || 'Müşteri limitinize ulaştınız. Pro plana yükseltin.');
      throw new Error('LIMIT_REACHED');
    }

    // Generate ID if not provided
    const customerId = customer.id || crypto.randomUUID();

    // Attach current user ID and Office ID
    const customerWithUser: Customer = {
      ...customer,
      id: customerId,
      user_id: session?.user.id,
      office_id: userProfile.officeId || customer.office_id
    };

    if (!customerWithUser.office_id) {
      console.error("CRITICAL: Attempting to add customer without office_id!", customerWithUser);
    }

    setCustomers((prev) => [customerWithUser, ...prev]);
    const { error } = await supabase.from('customers').insert([customerWithUser]);
    if (error) {
      console.error('Error adding customer:', error);
      // Rollback optimistic update on error
      setCustomers((prev) => prev.filter(c => c.id !== customerId));
      throw error;
    }

    return customerWithUser;
  };

  const updateCustomer = async (customer: Customer) => {
    setCustomers((prev) => prev.map(c => c.id === customer.id ? customer : c));
    const { error } = await supabase.from('customers').update(customer).eq('id', customer.id);
    if (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  };

  const addSite = async (site: Site) => {
    setSites((prev) => [site, ...prev]);
    const { error } = await supabase.from('sites').insert([site]);
    if (error) {
      console.error('Error adding site:', error);
      throw error;
    }
  };

  const deleteSite = async (id: string) => {
    setSites((prev) => prev.filter((site) => site.id !== id));
    const { error } = await supabase.from('sites').delete().eq('id', id);
    if (error) {
      console.error('Error deleting site:', error);
      throw error;
    }
  };

  const addActivity = async (activity: Activity) => {
    // Generate ID if not provided
    const activityId = activity.id || crypto.randomUUID();

    // Attach current user ID
    const activityWithUser: Activity = {
      ...activity,
      id: activityId,
      user_id: session?.user.id,
      office_id: userProfile.officeId
    };

    setActivities((prev) => [activityWithUser, ...prev]);
    const { error } = await supabase.from('activities').insert([activityWithUser]);
    if (error) {
      console.error('Error adding activity:', error);
      // Rollback optimistic update on error
      setActivities((prev) => prev.filter(a => a.id !== activityId));
      throw error;
    }
  };

  const updateActivity = async (activity: Activity) => {
    setActivities((prev) => prev.map(a => a.id === activity.id ? activity : a));
    const { error } = await supabase.from('activities').update(activity).eq('id', activity.id);
    if (error) {
      console.error('Error updating activity:', error);
      throw error;
    }
  };

  const addRequest = async (request: Request) => {
    // Attach current user ID
    const requestWithUser = {
      ...request,
      user_id: session?.user.id,
      office_id: userProfile.officeId
    };

    setRequests((prev) => [requestWithUser, ...prev]);
    const { error } = await supabase.from('requests').insert([requestWithUser]);
    if (error) {
      console.error('Error adding request:', error);
      throw error;
    }
  };

  const updateRequest = async (request: Request) => {
    setRequests((prev) => prev.map(r => r.id === request.id ? request : r));
    const { error } = await supabase.from('requests').update(request).eq('id', request.id);
    if (error) {
      console.error('Error updating request:', error);
      throw error;
    }
  };

  const addSale = async (sale: Sale) => {
    // Transform camelCase to snake_case for DB
    const saleForDB = {
      id: sale.id,
      property_id: sale.propertyId,
      user_id: session?.user.id,
      office_id: userProfile.officeId,
      sale_price: sale.salePrice,
      sale_date: sale.saleDate,
      buyer_id: sale.buyerId,
      buyer_name: sale.buyerName,
      commission_rate: sale.commissionRate,
      commission_amount: sale.commissionAmount,
      expenses: sale.expenses,
      total_expenses: sale.totalExpenses,
      office_share_rate: sale.officeShareRate,
      consultant_share_rate: sale.consultantShareRate,
      office_share_amount: sale.officeShareAmount,
      consultant_share_amount: sale.consultantShareAmount,
      net_profit: sale.netProfit,
      notes: sale.notes
    };

    // Optimistic update
    setSales((prev) => [sale, ...prev]);

    const { error } = await supabase.from('sales').insert([saleForDB]);
    if (error) {
      console.error('Error adding sale:', error);
      // Rollback on error
      setSales((prev) => prev.filter(s => s.id !== sale.id));
      throw error;
    }
  };

  const updateWebConfig = async (config: Partial<WebSiteConfig>, target: 'personal' | 'office' = 'personal') => {
    const newConfig = { ...webConfig, ...config };
    setWebConfig(newConfig);

    if (target === 'personal' && session?.user.id) {
      await supabase.from('profiles').update({ site_config: newConfig }).eq('id', session.user.id);
    } else if (target === 'office' && office?.id) {
      await supabase.from('offices').update({ site_config: newConfig }).eq('id', office.id);
      setOffice({ ...office, siteConfig: newConfig });
    }
  };

  const updateUserProfile = async (profile: Partial<UserProfile>) => {
    const newProfile = { ...userProfile, ...profile };
    setUserProfile(newProfile);

    // Also update in Real DB if logged in
    if (session?.user.id) {
      const updates = {
        id: session.user.id,
        full_name: newProfile.name,
        title: newProfile.title,
        avatar_url: newProfile.avatar,
        site_config: newProfile.siteConfig,
        updated_at: new Date(),
      };
      await supabase.from('profiles').upsert(updates);
    }
  };

  const updateOfficeSettings = async (settings: OfficePerformanceSettings) => {
    if (!office) return;

    // Optimistic update
    setOffice({ ...office, performance_settings: settings });

    // DB update
    const { error } = await supabase.from('offices').update({
      performance_settings: settings
    }).eq('id', office.id);

    if (error) {
      console.error('Error updating office settings:', error);
      // Rollback
      setOffice(office);
      throw error;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProperties([]);
    setCustomers([]);
  };

  const deleteProperty = async (id: string) => {
    setProperties((prev) => prev.filter((p) => p.id !== id));
    const { error } = await supabase.from('properties').delete().eq('id', id);
    if (error) {
      console.error('Error deleting property:', error);
      throw error;
    }
  };

  const deleteCustomer = async (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  };

  const deleteActivity = async (id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
    const { error } = await supabase.from('activities').delete().eq('id', id);
    if (error) {
      console.error('Error deleting activity:', error);
      throw error;
    }
  };

  const deleteRequest = async (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    const { error } = await supabase.from('requests').delete().eq('id', id);
    if (error) {
      console.error('Error deleting request:', error);
      throw error;
    }
  };

  // --- Pagination Functions ---
  const loadMoreProperties = async () => {
    if (!hasMoreProperties || loadingMore) return;
    setLoadingMore(true);
    try {
      const { data } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false })
        .range(properties.length, properties.length + PAGE_SIZE - 1);

      if (data) {
        setProperties(prev => [...prev, ...data]);
        setHasMoreProperties(data.length === PAGE_SIZE);
      }
    } catch (error) {
      console.error('Error loading more properties:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const loadMoreCustomers = async () => {
    if (!hasMoreCustomers || loadingMore) return;
    setLoadingMore(true);
    try {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })
        .range(customers.length, customers.length + PAGE_SIZE - 1);

      if (data) {
        setCustomers(prev => [...prev, ...data]);
        setHasMoreCustomers(data.length === PAGE_SIZE);
      }
    } catch (error) {
      console.error('Error loading more customers:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const loadMoreActivities = async () => {
    if (!hasMoreActivities || loadingMore) return;
    setLoadingMore(true);
    try {
      const { data } = await supabase
        .from('activities')
        .select('*')
        .order('date', { ascending: false })
        .range(activities.length, activities.length + PAGE_SIZE - 1);

      if (data) {
        setActivities(prev => [...prev, ...data]);
        setHasMoreActivities(data.length === PAGE_SIZE);
      }
    } catch (error) {
      console.error('Error loading more activities:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <DataContext.Provider value={{
      session, signOut,
      properties, customers, sites, activities, requests, sales, teamMembers, webConfig, userProfile, office, loading,
      subscription, planLimits, canAddProperty, canAddCustomer, getUsageStats,
      hasMoreProperties, hasMoreCustomers, hasMoreActivities, loadingMore,
      addProperty, updateProperty, deleteProperty, addCustomer, updateCustomer, deleteCustomer,
      addSite, deleteSite, addActivity, updateActivity, deleteActivity, addRequest, updateRequest, deleteRequest,
      addSale, updateWebConfig, updateUserProfile, updateOfficeSettings,
      loadMoreProperties, loadMoreCustomers, loadMoreActivities
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
