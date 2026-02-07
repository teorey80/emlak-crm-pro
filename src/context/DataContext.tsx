
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Property, Customer, Site, Activity, Request, WebSiteConfig, UserProfile, Office, OfficePerformanceSettings, Sale, Subscription, PlanLimits } from '../types';
import { supabase } from '../services/supabaseClient';
import { getSubscription, getPlanLimits, checkPropertyLimit, checkCustomerLimit } from '../services/subscriptionService';
import toast from 'react-hot-toast';

import { Session } from '@supabase/supabase-js';

const PAGE_SIZE = 20; // Reduced from 50 for better performance
const PROPERTY_LIST_SELECT = 'id,title,price,currency,location,type,status,rooms,area,bathrooms,heating,coordinates,city,district,neighborhood,address,user_id,office_id,owner_id,owner_name,listing_status,sold_date,rented_date,deposit_amount,deposit_date,deposit_buyer_id,inactive_reason,created_at';

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
  updateSale: (sale: Sale) => Promise<void>;
  deleteSale: (saleId: string, propertyId: string) => Promise<void>;
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

  const sanitizePropertyPayload = (payload: Record<string, any>) => {
    const numericFields = new Set([
      'price',
      'area',
      'grossArea',
      'netArea',
      'openArea',
      'buildingAge',
      'currentFloor',
      'floorCount',
      'bathrooms',
      'dues',
      'deposit',
      'kaks',
      'gabari'
    ]);

    const result: Record<string, any> = { ...payload };

    Object.keys(result).forEach((key) => {
      if (result[key] === '') {
        delete result[key];
      }
    });

    numericFields.forEach((field) => {
      if (!(field in result)) return;
      const value = result[field];
      if (value === null || value === undefined) {
        delete result[field];
        return;
      }
      if (typeof value === 'number') {
        if (Number.isNaN(value)) delete result[field];
        return;
      }
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) {
          delete result[field];
          return;
        }
        const normalized = Number(trimmed.replace(',', '.'));
        if (Number.isNaN(normalized)) {
          delete result[field];
        } else {
          result[field] = normalized;
        }
      }
    });

    return result;
  };

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

  const normalizeActivity = (activity: any): Activity => {
    const normalized: Activity = {
      ...activity,
      customerId: activity.customerId ?? activity.customer_id ?? '',
      customerName: activity.customerName ?? activity.customer_name ?? '',
      propertyId: activity.propertyId ?? activity.property_id,
      propertyTitle: activity.propertyTitle ?? activity.property_title
    };

    const description = normalized.description || '';
    const isPropertyAuto = (normalized.type === 'Tapu İşlemi' || normalized.type === 'Kira Kontratı')
      && /işlemi tamamlandı|kontratı tamamlandı/i.test(description);

    if (isPropertyAuto) {
      normalized.customerId = '';
      normalized.customerName = normalized.customerName || '';
    }

    return normalized;
  };

  const normalizeSale = (sale: any): Sale => ({
    ...sale,
    propertyId: sale.propertyId ?? sale.property_id,
    property_id: sale.property_id ?? sale.propertyId,
    transactionType: sale.transactionType ?? sale.transaction_type ?? 'sale',
    transaction_type: sale.transaction_type ?? sale.transactionType,
    salePrice: sale.salePrice ?? sale.sale_price ?? 0,
    sale_price: sale.sale_price ?? sale.salePrice,
    saleDate: sale.saleDate ?? sale.sale_date ?? '',
    sale_date: sale.sale_date ?? sale.saleDate,
    buyerId: sale.buyerId ?? sale.buyer_id ?? '',
    buyer_id: sale.buyer_id ?? sale.buyerId,
    buyerName: sale.buyerName ?? sale.buyer_name ?? '',
    buyer_name: sale.buyer_name ?? sale.buyerName,
    monthlyRent: sale.monthlyRent ?? sale.monthly_rent,
    monthly_rent: sale.monthly_rent ?? sale.monthlyRent,
    depositAmount: sale.depositAmount ?? sale.deposit_amount,
    deposit_amount: sale.deposit_amount ?? sale.depositAmount,
    leaseDuration: sale.leaseDuration ?? sale.lease_duration,
    lease_duration: sale.lease_duration ?? sale.leaseDuration,
    leaseEndDate: sale.leaseEndDate ?? sale.lease_end_date,
    lease_end_date: sale.lease_end_date ?? sale.leaseEndDate,
    commissionRate: sale.commissionRate ?? sale.commission_rate ?? 0,
    commission_rate: sale.commission_rate ?? sale.commissionRate,
    commissionAmount: sale.commissionAmount ?? sale.commission_amount ?? 0,
    commission_amount: sale.commission_amount ?? sale.commissionAmount,
    buyerCommissionAmount: sale.buyerCommissionAmount ?? sale.buyer_commission_amount ?? 0,
    buyer_commission_amount: sale.buyer_commission_amount ?? sale.buyerCommissionAmount,
    buyerCommissionRate: sale.buyerCommissionRate ?? sale.buyer_commission_rate ?? 0,
    buyer_commission_rate: sale.buyer_commission_rate ?? sale.buyerCommissionRate,
    sellerCommissionAmount: sale.sellerCommissionAmount ?? sale.seller_commission_amount ?? 0,
    seller_commission_amount: sale.seller_commission_amount ?? sale.sellerCommissionAmount,
    sellerCommissionRate: sale.sellerCommissionRate ?? sale.seller_commission_rate ?? 0,
    seller_commission_rate: sale.seller_commission_rate ?? sale.sellerCommissionRate,
    totalExpenses: sale.totalExpenses ?? sale.total_expenses ?? 0,
    total_expenses: sale.total_expenses ?? sale.totalExpenses,
    officeShareRate: sale.officeShareRate ?? sale.office_share_rate ?? 50,
    office_share_rate: sale.office_share_rate ?? sale.officeShareRate,
    consultantShareRate: sale.consultantShareRate ?? sale.consultant_share_rate ?? 50,
    consultant_share_rate: sale.consultant_share_rate ?? sale.consultantShareRate,
    officeShareAmount: sale.officeShareAmount ?? sale.office_share_amount ?? 0,
    office_share_amount: sale.office_share_amount ?? sale.officeShareAmount,
    consultantShareAmount: sale.consultantShareAmount ?? sale.consultant_share_amount ?? 0,
    consultant_share_amount: sale.consultant_share_amount ?? sale.consultantShareAmount,
    netProfit: sale.netProfit ?? sale.net_profit ?? 0,
    net_profit: sale.net_profit ?? sale.netProfit,
    propertyOwnerShareRate: sale.propertyOwnerShareRate ?? sale.property_owner_share_rate,
    property_owner_share_rate: sale.property_owner_share_rate ?? sale.propertyOwnerShareRate,
    hasPartnerOffice: sale.hasPartnerOffice ?? sale.has_partner_office,
    has_partner_office: sale.has_partner_office ?? sale.hasPartnerOffice,
    partnerOfficeName: sale.partnerOfficeName ?? sale.partner_office_name,
    partner_office_name: sale.partner_office_name ?? sale.partnerOfficeName,
    partnerOfficeContact: sale.partnerOfficeContact ?? sale.partner_office_contact,
    partner_office_contact: sale.partner_office_contact ?? sale.partnerOfficeContact,
    partnerShareType: sale.partnerShareType ?? sale.partner_share_type,
    partner_share_type: sale.partner_share_type ?? sale.partnerShareType,
    partnerShareAmount: sale.partnerShareAmount ?? sale.partner_share_amount,
    partner_share_amount: sale.partner_share_amount ?? sale.partnerShareAmount,
    partnerShareRate: sale.partnerShareRate ?? sale.partner_share_rate,
    partner_share_rate: sale.partner_share_rate ?? sale.partnerShareRate
  });

  const mergeActivitiesWithSales = (activityData: Activity[], salesData: Sale[], props: Property[]) => {
    const existingKeys = new Set(
      activityData.map((activity) => {
        const propertyId = activity.propertyId ?? '';
        const customerId = activity.customerId ?? '';
        return `${activity.type}|${activity.date}|${propertyId}|${customerId}`;
      })
    );

    const existingLooseKeys = new Set(
      activityData.map((activity) => {
        const propertyId = activity.propertyId ?? '';
        const customerId = activity.customerId ?? '';
        return `${activity.type}|${propertyId}|${customerId}`;
      })
    );

    const derivedActivities: Activity[] = [];

    salesData.forEach((sale) => {
      const transactionType = sale.transactionType || sale.transaction_type || 'sale';
      const activityType: Activity['type'] = transactionType === 'rental' ? 'Kira Kontratı' : 'Tapu İşlemi';
      const saleDate = sale.saleDate || sale.sale_date;
      if (!saleDate) return;

      const propertyId = sale.propertyId || sale.property_id;
      if (!propertyId) return;

      const property = props.find((p) => p.id === propertyId);
      const currency = property?.currency || '₺';
      const formatMoney = (amount: number) => `${amount.toLocaleString('tr-TR')} ${currency}`;
      const rentInfo = sale.monthlyRent
        ? `Aylık kira: ${formatMoney(sale.monthlyRent)}`
        : `Komisyon: ${formatMoney(sale.salePrice || 0)}`;

      const buyerId = sale.buyerId || sale.buyer_id || '';
      const buyerName = sale.buyerName || sale.buyer_name || 'Alıcı';
      const ownerId = property?.ownerId || (property as any)?.owner_id;
      const ownerName = property?.ownerName || (property as any)?.owner_name || 'Satıcı';

      if (buyerId) {
        const key = `${activityType}|${saleDate}|${propertyId}|${buyerId}`;
        const looseKey = `${activityType}|${propertyId}|${buyerId}`;
        if (!existingKeys.has(key) && !existingLooseKeys.has(looseKey)) {
          existingKeys.add(key);
          existingLooseKeys.add(looseKey);
          derivedActivities.push({
            id: `auto_sale_${sale.id}_buyer`,
            type: activityType,
            customerId: buyerId,
            customerName: buyerName,
            propertyId,
            propertyTitle: sale.propertyTitle || property?.title || 'Mülk',
            date: saleDate,
            description: transactionType === 'rental'
              ? `Kira kontratı yapıldı (KİRACI). ${rentInfo}`
              : `Satış işlemi gerçekleştirildi (ALAN). Fiyat: ${formatMoney(sale.salePrice || 0)}`,
            status: 'Tamamlandı',
            user_id: sale.user_id,
            office_id: sale.office_id
          });
        }
      }

      if (ownerId) {
        const key = `${activityType}|${saleDate}|${propertyId}|${ownerId}`;
        const looseKey = `${activityType}|${propertyId}|${ownerId}`;
        if (!existingKeys.has(key) && !existingLooseKeys.has(looseKey)) {
          existingKeys.add(key);
          existingLooseKeys.add(looseKey);
          derivedActivities.push({
            id: `auto_sale_${sale.id}_seller`,
            type: activityType,
            customerId: ownerId,
            customerName: ownerName,
            propertyId,
            propertyTitle: sale.propertyTitle || property?.title || 'Mülk',
            date: saleDate,
            description: transactionType === 'rental'
              ? `Kira kontratı yapıldı (KİRAYA VEREN). Kiracı: ${buyerName}. ${rentInfo}`
              : `Satış işlemi gerçekleştirildi (SATAN). Alıcı: ${buyerName}. Fiyat: ${formatMoney(sale.salePrice || 0)}`,
            status: 'Tamamlandı',
            user_id: sale.user_id,
            office_id: sale.office_id
          });
        }
      }

      const propertyKey = `${activityType}|${saleDate}|${propertyId}|`;
      const propertyLooseKey = `${activityType}|${propertyId}|`;
      if (!existingKeys.has(propertyKey) && !existingLooseKeys.has(propertyLooseKey)) {
        existingKeys.add(propertyKey);
        existingLooseKeys.add(propertyLooseKey);
        derivedActivities.push({
          id: `auto_sale_${sale.id}_property`,
          type: activityType,
          customerId: '',
          customerName: 'Portföy',
          propertyId,
          propertyTitle: sale.propertyTitle || property?.title || 'Mülk',
          date: saleDate,
          description: transactionType === 'rental'
            ? `Kira kontratı tamamlandı. ${rentInfo}. ${buyerName ? 'Kiracı: ' + buyerName : ''}`
            : `Satış işlemi tamamlandı. Satış bedeli: ${formatMoney(sale.salePrice || 0)}. ${buyerName ? 'Alıcı: ' + buyerName : ''}`,
          status: 'Tamamlandı',
          user_id: sale.user_id,
          office_id: sale.office_id
        });
      }
    });

    if (derivedActivities.length === 0) return activityData;
    return [...derivedActivities, ...activityData];
  };

  const mergePropertiesWithSales = (props: Property[], salesData: Sale[]) => {
    const salesByProperty = new Map<string, Sale>();
    salesData.forEach((sale) => {
      const propId = sale.propertyId || sale.property_id;
      if (!propId) return;
      const existing = salesByProperty.get(propId);
      if (!existing) {
        salesByProperty.set(propId, sale);
        return;
      }
      const existingDate = new Date(existing.saleDate || existing.sale_date || 0).getTime();
      const incomingDate = new Date(sale.saleDate || sale.sale_date || 0).getTime();
      if (incomingDate >= existingDate) salesByProperty.set(propId, sale);
    });

    return props.map((property) => {
      const listingStatus = property.listingStatus || property.listing_status;
      if (listingStatus) return property;

      const sale = salesByProperty.get(property.id);
      if (!sale) return property;

      const transactionType = sale.transactionType || sale.transaction_type;
      const derivedStatus = transactionType === 'rental' ? 'Kiralandı' : 'Satıldı';

      return {
        ...property,
        listingStatus: derivedStatus as any,
        listing_status: derivedStatus,
        soldDate: transactionType === 'sale' ? (sale.saleDate || sale.sale_date) : property.soldDate,
        rentedDate: transactionType === 'rental' ? (sale.saleDate || sale.sale_date) : property.rentedDate
      };
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch in parallel with pagination (limit to PAGE_SIZE)
      const [propsRes, custRes, sitesRes, actRes, reqRes, salesRes, teamRes] = await Promise.all([
        supabase.from('properties').select(PROPERTY_LIST_SELECT).order('created_at', { ascending: false }).limit(PAGE_SIZE),
        supabase.from('customers').select('*').order('created_at', { ascending: false }).limit(PAGE_SIZE),
        supabase.from('sites').select('*'),
        supabase.from('activities').select('*').order('date', { ascending: false }).limit(PAGE_SIZE),
        supabase.from('requests').select('*'),
        supabase.from('sales').select('*').order('created_at', { ascending: false }).limit(PAGE_SIZE),
        supabase.from('profiles').select('*') // RLS ensures we only see office members
      ]);

      let normalizedSales: Sale[] = [];
      if (salesRes.data) {
        normalizedSales = salesRes.data.map(normalizeSale);
        setSales(normalizedSales);
      }

      if (propsRes.data) {
        let nextProperties = propsRes.data as unknown as Property[];
        if (normalizedSales.length > 0) {
          nextProperties = mergePropertiesWithSales(nextProperties, normalizedSales);
        }
        setProperties(nextProperties);
        setHasMoreProperties(nextProperties.length === PAGE_SIZE);
      }
      if (custRes.data) {
        setCustomers(custRes.data);
        setHasMoreCustomers(custRes.data.length === PAGE_SIZE);
      }
      if (sitesRes.data) setSites(sitesRes.data);
      if (actRes.data) {
        const normalizedActivities = actRes.data.map(normalizeActivity);
        const mergedActivities = normalizedSales.length > 0 && propsRes.data
          ? mergeActivitiesWithSales(normalizedActivities, normalizedSales, propsRes.data)
          : normalizedActivities;
        setActivities(mergedActivities);
        setHasMoreActivities(actRes.data.length === PAGE_SIZE);
      }
      if (reqRes.data) setRequests(reqRes.data);
      if (!salesRes.data) {
        setSales([]);
      }

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

    const sanitizedProperty = sanitizePropertyPayload(propertyWithUser);

    // Optimistic update
    setProperties((prev) => [propertyWithUser, ...prev]);

    const isUnknownColumnError = (error: any) => {
      const msg = error?.message || '';
      return (
        error?.code === '42703' ||
        error?.code === 'PGRST204' ||
        /column .* does not exist/i.test(msg) ||
        /Could not find the '.*' column/i.test(msg)
      );
    };

    const extractUnknownColumn = (error: any) => {
      const message = error?.message || '';
      const match1 = message.match(/column "([^"]+)"/i);
      if (match1?.[1]) return match1[1];
      const match2 = message.match(/'([^']+)' column/i);
      return match2?.[1];
    };

    const insertWithFallback = async (payload: Record<string, any>) => {
      let workingPayload = { ...payload };
      let lastError: any = null;

      for (let i = 0; i < 40; i += 1) {
        const { error } = await supabase.from('properties').insert([workingPayload]);
        if (!error) return { ok: true };

        lastError = error;
        if (!isUnknownColumnError(error)) break;

        const unknownColumn = extractUnknownColumn(error);
        if (!unknownColumn || !(unknownColumn in workingPayload)) break;

        delete workingPayload[unknownColumn];
      }

      return { ok: false, error: lastError };
    };

    const insertResult = await insertWithFallback(sanitizedProperty as any);
    if (!insertResult.ok) {
      console.error('Error adding property:', insertResult.error);
      // Rollback optimistic update
      setProperties((prev) => prev.filter((p) => p.id !== propertyWithUser.id));
      throw insertResult.error;
    }
  };

  const updateProperty = async (updatedProperty: Property) => {
    const prevProperty = properties.find(p => p.id === updatedProperty.id);
    setProperties((prev) => prev.map(p => p.id === updatedProperty.id ? updatedProperty : p));

    const isUnknownColumnError = (error: any) => {
      const msg = error?.message || '';
      return (
        error?.code === '42703' ||
        error?.code === 'PGRST204' ||
        /column .* does not exist/i.test(msg) ||
        /Could not find the '.*' column/i.test(msg)
      );
    };

    const extractUnknownColumn = (error: any) => {
      const message = error?.message || '';
      const match1 = message.match(/column "([^"]+)"/i);
      if (match1?.[1]) return match1[1];
      const match2 = message.match(/'([^']+)' column/i);
      return match2?.[1];
    };

    const updateWithFallback = async (payload: Record<string, any>) => {
      let workingPayload = { ...payload };
      let lastError: any = null;

      for (let i = 0; i < 40; i += 1) {
        const { error } = await supabase.from('properties').update(workingPayload).eq('id', updatedProperty.id);
        if (!error) return { ok: true };

        lastError = error;
        if (!isUnknownColumnError(error)) break;

        const unknownColumn = extractUnknownColumn(error);
        if (!unknownColumn || !(unknownColumn in workingPayload)) break;

        delete workingPayload[unknownColumn];
      }

      return { ok: false, error: lastError };
    };

    const sanitizedProperty = sanitizePropertyPayload(updatedProperty as any);
    const updateResult = await updateWithFallback(sanitizedProperty as any);
    if (!updateResult.ok) {
      console.error('Error updating property:', updateResult.error);
      if (prevProperty) {
        setProperties((prev) => prev.map(p => p.id === prevProperty.id ? prevProperty : p));
      }
      throw updateResult.error;
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
    const isUuid = (value?: string) => {
      if (!value) return false;
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
    };

    const saleId = isUuid(sale.id) ? sale.id : crypto.randomUUID();
    const saleWithId: Sale = { ...sale, id: saleId };
    const property = properties.find(p => p.id === saleWithId.propertyId);

    // Transform camelCase to snake_case for DB
    const resolvedOfficeId = userProfile.officeId || property?.office_id || (property as any)?.officeId;

    const buildSalePayload = (naming: 'snake' | 'camel') => {
      if (naming === 'snake') {
        return {
          id: saleWithId.id,
          property_id: saleWithId.propertyId,
          user_id: session?.user.id,
          office_id: resolvedOfficeId,
          transaction_type: saleWithId.transactionType || 'sale',
          sale_price: saleWithId.salePrice,
          sale_date: saleWithId.saleDate,
          buyer_id: saleWithId.buyerId || null,
          buyer_name: saleWithId.buyerName || null,

          // Rental specific
          monthly_rent: saleWithId.monthlyRent,
          deposit_amount: saleWithId.depositAmount,
          lease_duration: saleWithId.leaseDuration,
          lease_end_date: saleWithId.leaseEndDate,

          // Commission fields
          commission_rate: saleWithId.commissionRate || 0,
          commission_amount: saleWithId.commissionAmount,
          buyer_commission_amount: saleWithId.buyerCommissionAmount || 0,
          buyer_commission_rate: saleWithId.buyerCommissionRate || 0,
          seller_commission_amount: saleWithId.sellerCommissionAmount || 0,
          seller_commission_rate: saleWithId.sellerCommissionRate || 0,

          // Expenses & Profit
          expenses: saleWithId.expenses || [],
          total_expenses: saleWithId.totalExpenses || 0,
          office_share_rate: saleWithId.officeShareRate || 50,
          consultant_share_rate: saleWithId.consultantShareRate || 50,
          office_share_amount: saleWithId.officeShareAmount || 0,
          consultant_share_amount: saleWithId.consultantShareAmount || 0,
          net_profit: saleWithId.netProfit || 0,
          notes: saleWithId.notes || null,

          // Partner Office
          has_partner_office: saleWithId.hasPartnerOffice || false,
          partner_office_name: saleWithId.partnerOfficeName || null,
          partner_office_contact: saleWithId.partnerOfficeContact || null,
          partner_share_type: saleWithId.partnerShareType || null,
          partner_share_amount: saleWithId.partnerShareAmount || 0,
          partner_share_rate: saleWithId.partnerShareRate || 0
        };
      }

      return {
        id: saleWithId.id,
        propertyId: saleWithId.propertyId,
        user_id: session?.user.id,
        office_id: resolvedOfficeId,
        transactionType: saleWithId.transactionType || 'sale',
        salePrice: saleWithId.salePrice,
        saleDate: saleWithId.saleDate,
        buyerId: saleWithId.buyerId || null,
        buyerName: saleWithId.buyerName || null,

        // Rental specific
        monthlyRent: saleWithId.monthlyRent,
        depositAmount: saleWithId.depositAmount,
        leaseDuration: saleWithId.leaseDuration,
        leaseEndDate: saleWithId.leaseEndDate,

        // Commission fields
        commissionRate: saleWithId.commissionRate || 0,
        commissionAmount: saleWithId.commissionAmount,
        buyerCommissionAmount: saleWithId.buyerCommissionAmount || 0,
        buyerCommissionRate: saleWithId.buyerCommissionRate || 0,
        sellerCommissionAmount: saleWithId.sellerCommissionAmount || 0,
        sellerCommissionRate: saleWithId.sellerCommissionRate || 0,

        // Expenses & Profit
        expenses: saleWithId.expenses || [],
        totalExpenses: saleWithId.totalExpenses || 0,
        officeShareRate: saleWithId.officeShareRate || 50,
        consultantShareRate: saleWithId.consultantShareRate || 50,
        officeShareAmount: saleWithId.officeShareAmount || 0,
        consultantShareAmount: saleWithId.consultantShareAmount || 0,
        netProfit: saleWithId.netProfit || 0,
        notes: saleWithId.notes || null,

        // Partner Office
        hasPartnerOffice: saleWithId.hasPartnerOffice || false,
        partnerOfficeName: saleWithId.partnerOfficeName || null,
        partnerOfficeContact: saleWithId.partnerOfficeContact || null,
        partnerShareType: saleWithId.partnerShareType || null,
        partnerShareAmount: saleWithId.partnerShareAmount || 0,
        partnerShareRate: saleWithId.partnerShareRate || 0
      };
    };

    console.log('Adding sale to DB:', JSON.stringify(buildSalePayload('snake'), null, 2));

    // --------------------------------------------------------
    // 2. Optimistic Updates (Local State)
    // --------------------------------------------------------
    const prevSales = sales;
    const prevProperties = properties;
    const prevActivities = activities;

    // A. Add Sale
    setSales((prev) => [saleWithId, ...prev]);

    // B. Update Property Status
    const newStatus = saleWithId.transactionType === 'sale' ? 'Satıldı' : 'Kiralandı';
    setProperties(prev => prev.map(p => {
      if (p.id === saleWithId.propertyId) {
        return {
          ...p,
          listingStatus: newStatus as any,
          listing_status: newStatus,
          soldDate: saleWithId.transactionType === 'sale' ? saleWithId.saleDate : undefined,
          rentedDate: saleWithId.transactionType === 'rental' ? saleWithId.saleDate : undefined
        };
      }
      return p;
    }));

    // C. Create Activities (Auto-generated for Buyer and Seller)

    console.log('[addSale] Debug - Sale:', sale);
    console.log('[addSale] Debug - Property:', property);
    console.log('[addSale] Debug - Checking params:', {
      buyerId: saleWithId.buyerId,
      ownerId: property?.ownerId,
      owner_id: (property as any)?.owner_id
    });

    const activitiesToAdd: Activity[] = [];
    const activityType: Activity['type'] = saleWithId.transactionType === 'rental' ? 'Kira Kontratı' : 'Tapu İşlemi';
    const currency = property?.currency || '₺';
    const formatMoney = (amount: number) => `${amount.toLocaleString('tr-TR')} ${currency}`;
    const rentInfo = saleWithId.monthlyRent ? `Aylık kira: ${formatMoney(saleWithId.monthlyRent)}` : `Komisyon: ${formatMoney(saleWithId.salePrice)}`;

    // 1. Buyer Activity
    if (saleWithId.buyerId) {
      activitiesToAdd.push({
        id: `auto_buyer_${Date.now()}`,
        type: activityType,
        customerId: saleWithId.buyerId,
        customerName: saleWithId.buyerName || 'Alıcı',
        propertyId: saleWithId.propertyId,
        propertyTitle: saleWithId.propertyTitle || 'Mülk Satışı',
        date: saleWithId.saleDate,
        description: saleWithId.transactionType === 'rental'
          ? `Kira kontratı yapıldı (KİRACI). ${rentInfo}`
          : `${newStatus} işlemi gerçekleştirildi (ALAN). Fiyat: ${formatMoney(saleWithId.salePrice)}`,
        status: 'Tamamlandı',
        user_id: session?.user.id,
        office_id: userProfile.officeId
      });
    }

    // 2. Seller Activity (if owner exists and is a customer)
    // Check both camelCase and snake_case for ownerId
    const ownerId = property?.ownerId || (property as any)?.owner_id;
    const ownerName = property?.ownerName || (property as any)?.owner_name;

    if (ownerId) {
        activitiesToAdd.push({
        id: `auto_seller_${Date.now()}`,
        type: activityType,
        customerId: ownerId,
        customerName: ownerName || 'Satıcı',
        propertyId: saleWithId.propertyId,
        propertyTitle: saleWithId.propertyTitle || 'Mülk Satışı',
        date: saleWithId.saleDate,
        description: saleWithId.transactionType === 'rental'
          ? `Kira kontratı yapıldı (KİRAYA VEREN). Kiracı: ${saleWithId.buyerName || 'Belirtilmedi'}. ${rentInfo}`
          : `${newStatus} işlemi gerçekleştirildi (SATAN). Alıcı: ${saleWithId.buyerName || 'Belirtilmedi'}. Fiyat: ${formatMoney(saleWithId.salePrice)}`,
        status: 'Tamamlandı',
        user_id: session?.user.id,
        office_id: userProfile.officeId
      });
    }

    // 3. Property Activity (for property history display)
    const propertyActivity: Activity = {
      id: `auto_property_${Date.now()}`,
      type: activityType,
      customerId: '',
      customerName: 'Portföy',
      propertyId: saleWithId.propertyId,
      propertyTitle: saleWithId.propertyTitle || property?.title || 'Mülk',
      date: saleWithId.saleDate,
      description: saleWithId.transactionType === 'rental'
        ? `Kira kontratı tamamlandı. ${rentInfo}. ${saleWithId.buyerName ? 'Kiracı: ' + saleWithId.buyerName : ''}`
        : `${newStatus} işlemi tamamlandı. Satış bedeli: ${formatMoney(saleWithId.salePrice)}. ${saleWithId.buyerName ? 'Alıcı: ' + saleWithId.buyerName : ''}`,
      status: 'Tamamlandı',
      user_id: session?.user.id,
      office_id: userProfile.officeId
    };

    activitiesToAdd.push(propertyActivity);

    console.log('[addSale] Debug - Activities to add:', activitiesToAdd);

    setActivities(prev => [...activitiesToAdd, ...prev]);

    // --------------------------------------------------------
    // 3. Database Operations
    // --------------------------------------------------------
    const isUnknownColumnError = (error: any) => {
      const msg = error?.message || '';
      return (
        error?.code === '42703' ||
        error?.code === 'PGRST204' || // PostgREST: column not in schema cache
        /column .* does not exist/i.test(msg) ||
        /Could not find the '.*' column/i.test(msg)
      );
    };

    const extractUnknownColumn = (error: any) => {
      const message = error?.message || '';
      const match1 = message.match(/column "([^"]+)"/i);
      if (match1?.[1]) return match1[1];
      const match2 = message.match(/'([^']+)' column/i);
      return match2?.[1];
    };

    const insertSaleWithFallback = async (payload: Record<string, any>) => {
      let workingPayload = { ...payload };
      let lastError: any = null;

      for (let i = 0; i < 40; i += 1) {
        const { error } = await supabase.from('sales').insert([workingPayload]);
        if (!error) return { ok: true };

        lastError = error;
        if (!isUnknownColumnError(error)) break;

        const unknownColumn = extractUnknownColumn(error);
        if (!unknownColumn || !(unknownColumn in workingPayload)) break;

        delete workingPayload[unknownColumn];
      }

      return { ok: false, error: lastError };
    };

    const buildActivitiesForDB = (naming: 'snake' | 'camel', includeUserFields: boolean) => {
      return activitiesToAdd.map(activity => {
        if (naming === 'snake') {
          const payload: any = {
            id: activity.id,
            type: activity.type,
            customer_id: activity.customerId,
            customer_name: activity.customerName,
            property_id: activity.propertyId,
            property_title: activity.propertyTitle,
            date: activity.date,
            description: activity.description,
            status: activity.status
          };
          if (includeUserFields) {
            payload.user_id = session?.user.id;
            payload.office_id = userProfile.officeId;
          }
          return payload;
        }
        const payload: any = {
          id: activity.id,
          type: activity.type,
          customerId: activity.customerId,
          customerName: activity.customerName,
          propertyId: activity.propertyId,
          propertyTitle: activity.propertyTitle,
          date: activity.date,
          description: activity.description,
          status: activity.status
        };
        if (includeUserFields) {
          payload.user_id = session?.user.id;
          payload.office_id = userProfile.officeId;
        }
        return payload;
      });
    };

    try {
      // A. Insert Sale
      const saleInsertSnake = await insertSaleWithFallback(buildSalePayload('snake'));
      if (!saleInsertSnake.ok) {
        const saleInsertCamel = await insertSaleWithFallback(buildSalePayload('camel'));
        if (!saleInsertCamel.ok) throw saleInsertCamel.error;
      }

      // B. Update Property Status in DB
      const updatePropertyStatus = async () => {
        let error: any = null;
        const snake = await supabase
          .from('properties')
        .update({ listing_status: newStatus })
        .eq('id', saleWithId.propertyId);
        error = snake.error;

        if (error && isUnknownColumnError(error)) {
          const camel = await supabase
            .from('properties')
          .update({ listingStatus: newStatus })
          .eq('id', saleWithId.propertyId);
          error = camel.error;
        }
        return error;
      };

      const tryUpdatePropertyOptional = async (snakeField: string, camelField: string, value?: any) => {
        if (value === undefined || value === null) return;
        let error: any = null;
        const snake = await supabase
          .from('properties')
          .update({ [snakeField]: value })
          .eq('id', saleWithId.propertyId);
        error = snake.error;

        if (error && isUnknownColumnError(error)) {
          const camel = await supabase
            .from('properties')
            .update({ [camelField]: value })
            .eq('id', saleWithId.propertyId);
          error = camel.error;
        }

        if (error && !isUnknownColumnError(error)) {
          console.error(`Optional property update failed for ${snakeField}/${camelField}:`, error);
        }
      };

      const propError = await updatePropertyStatus();
      if (propError) {
        console.error('Property update failed.', propError);
        toast.error(`Mülk durumu güncellenemedi (${propError.message}). Satış kaydı oluşturuldu ama ilan durumu güncellenemedi.`);
      }

      if (saleWithId.transactionType === 'sale') {
        await tryUpdatePropertyOptional('sold_date', 'soldDate', saleWithId.saleDate);
      } else {
        await tryUpdatePropertyOptional('rented_date', 'rentedDate', saleWithId.saleDate);
        if (saleWithId.monthlyRent) {
          await tryUpdatePropertyOptional('current_monthly_rent', 'currentMonthlyRent', saleWithId.monthlyRent);
        }
      }
      await tryUpdatePropertyOptional('inactive_reason', 'inactiveReason', saleWithId.transactionType === 'sale' ? 'Satıldı' : 'Kiralandı');

      // C. Insert Activities in DB
      if (activitiesToAdd.length > 0) {
        const activitiesForDB = buildActivitiesForDB('camel', true);
        console.log('[addSale] Debug - Inserting activities to DB:', activitiesForDB);

        let actError: any = null;
        const actResCamel = await supabase.from('activities').insert(activitiesForDB);
        actError = actResCamel.error;

        if (actError && isUnknownColumnError(actError)) {
          const actResCamelNoUser = await supabase.from('activities').insert(buildActivitiesForDB('camel', false));
          actError = actResCamelNoUser.error;
        }

        if (actError && isUnknownColumnError(actError)) {
          const actResSnake = await supabase.from('activities').insert(buildActivitiesForDB('snake', true));
          actError = actResSnake.error;
        }

        if (actError && isUnknownColumnError(actError)) {
          const actResSnakeNoUser = await supabase.from('activities').insert(buildActivitiesForDB('snake', false));
          actError = actResSnakeNoUser.error;
        }

        if (actError) console.error('Error auto-creating activity:', actError);
      }


    } catch (error) {
      console.error('Error in addSale transaction:', error);
      // Rollback optimistic updates
      setSales(prevSales);
      setProperties(prevProperties);
      setActivities(prevActivities);
      const errorMessage = (error as any)?.message || 'Bilinmeyen hata';
      const errorCode = (error as any)?.code ? ` (Kod: ${(error as any).code})` : '';
      toast.error(`Satış/kiralama kaydı DB’ye yazılamadı: ${errorMessage}${errorCode}`);
    }
  };

  const updateSale = async (sale: Sale) => {
    // 1. Prepare Data
    const saleForDB = {
      // ... fields ...
      sale_price: sale.salePrice,
      sale_date: sale.saleDate,
      buyer_id: sale.buyerId || null,
      buyer_name: sale.buyerName || null,
      commission_rate: sale.commissionRate || 0,
      commission_amount: sale.commissionAmount,
      buyer_commission_amount: sale.buyerCommissionAmount || 0,
      buyer_commission_rate: sale.buyerCommissionRate || 0,
      seller_commission_amount: sale.sellerCommissionAmount || 0,
      seller_commission_rate: sale.sellerCommissionRate || 0,
      expenses: sale.expenses || [],
      total_expenses: sale.totalExpenses || 0,
      office_share_rate: sale.officeShareRate || 50,
      consultant_share_rate: sale.consultantShareRate || 50,
      office_share_amount: sale.officeShareAmount || 0,
      consultant_share_amount: sale.consultantShareAmount || 0,
      net_profit: sale.netProfit || 0,
      notes: sale.notes || null
    };

    // 2. Optimistic Update
    setSales(prev => prev.map(s => s.id === sale.id ? sale : s));

    // 3. DB Update
    try {
      const { error } = await supabase.from('sales').update(saleForDB).eq('id', sale.id);
      if (error) throw error;
      toast.success('Satış güncellendi');
    } catch (error) {
      console.error('Error updating sale:', error);
      toast.error('Güncelleme başarısız');
      // Rollback? (Skip for now, complex)
    }
  };

  const deleteSale = async (saleId: string, propertyId: string) => {
    const saleToDelete = sales.find(s => s.id === saleId);
    const saleDate = saleToDelete?.saleDate || saleToDelete?.sale_date;
    const transactionType = saleToDelete?.transactionType || saleToDelete?.transaction_type || 'sale';
    const activityType: Activity['type'] = transactionType === 'rental' ? 'Kira Kontratı' : 'Tapu İşlemi';

    // 1. Optimistic Update
    setSales(prev => prev.filter(s => s.id !== saleId));
    setProperties(prev => prev.map(p => {
      if (p.id === propertyId) {
        return { ...p, listingStatus: 'Aktif' as any, listing_status: 'Aktif', soldDate: undefined, rentedDate: undefined };
      }
      return p;
    }));
    if (saleDate) {
      setActivities(prev => prev.filter(a => !(a.propertyId === propertyId && a.type === activityType && a.date === saleDate)));
    }

    // 2. DB Operations
    try {
      // Delete Sale
      const { error: delError } = await supabase.from('sales').delete().eq('id', saleId);
      if (delError) throw delError;

      // Revert Property
      const { error: propError } = await supabase.from('properties').update({
        listing_status: 'Aktif',
        inactive_reason: null,
        sold_date: null,
        rented_date: null
      }).eq('id', propertyId);

      if (propError) console.error('Error reverting property:', propError);

      // Delete auto-created activities for this sale (best effort)
      if (saleDate) {
        const deleteActivitiesBy = async (fieldName: string) => {
          return await supabase
            .from('activities')
            .delete()
            .eq(fieldName, propertyId)
            .eq('type', activityType)
            .eq('date', saleDate);
        };

        let actError = (await deleteActivitiesBy('property_id')).error;
        if (actError?.code === '42703' || actError?.code === 'PGRST204') {
          actError = (await deleteActivitiesBy('propertyId')).error;
        }
        if (actError) console.error('Error deleting sale activities:', actError);
      }

      toast.success('Satış iptal edildi ve ilan aktif hale getirildi.');
    } catch (error) {
      console.error('Error deleting sale:', error);
      toast.error('İptal işlemi başarısız');
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
        .select(PROPERTY_LIST_SELECT)
        .order('created_at', { ascending: false })
        .range(properties.length, properties.length + PAGE_SIZE - 1);

      if (data) {
        setProperties(prev => [...prev, ...(data as unknown as Property[])]);
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
        const normalizedActivities = data.map(normalizeActivity);
        setActivities(prev => [...prev, ...normalizedActivities]);
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
      addSale, updateSale, deleteSale, updateWebConfig, updateUserProfile, updateOfficeSettings,
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
