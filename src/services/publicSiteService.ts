import { supabase } from './supabaseClient';
import { Property, WebSiteConfig } from '../types';

export interface PublicSiteData {
    type: 'personal' | 'office';
    userId?: string;
    officeId?: string;
    siteConfig: WebSiteConfig;
    properties: Property[];
    ownerName?: string;
    officeName?: string;
}

// Memory cache to prevent repeated Supabase calls
const siteCache = new Map<string, { data: PublicSiteData | null; timestamp: number }>();
const CACHE_TTL = 600000; // 10 minute memory cache
const LOCAL_STORAGE_KEY = 'emlak_site';
const LOCAL_STORAGE_TTL = 3600000; // 1 hour localStorage cache

// Warm-up flag to prevent multiple warm-ups
let isWarmedUp = false;

/**
 * Get cached data from localStorage (survives page refresh)
 */
function getLocalStorageCache(domain: string): PublicSiteData | null {
    try {
        const cached = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${domain}`);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < LOCAL_STORAGE_TTL) {
                return data;
            }
            localStorage.removeItem(`${LOCAL_STORAGE_KEY}_${domain}`);
        }
    } catch (e) { /* ignore */ }
    return null;
}

/**
 * Save data to localStorage cache
 */
function setLocalStorageCache(domain: string, data: PublicSiteData): void {
    try {
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_${domain}`, JSON.stringify({
            data,
            timestamp: Date.now()
        }));
    } catch (e) { /* ignore - storage full */ }
}

/**
 * Pre-warm Supabase connection for faster first query
 */
export async function warmupSupabase(): Promise<void> {
    if (isWarmedUp) return;
    isWarmedUp = true;

    try {
        // Simple ping query to wake up Supabase
        await supabase.from('profiles').select('id').limit(1).maybeSingle();
        console.log('[PublicSite] Supabase warmed up');
    } catch (e) {
        console.log('[PublicSite] Warm-up error (ignored):', e);
    }
}

// Skip patterns for non-public domains
const SKIP_PATTERNS = [
    'localhost', '127.0.0.1', 'vercel.app', 'vercel.com',
    'netlify.app', 'netlify.com', '192.168.', '10.0.', 'ngrok'
];

// Clean domain helper
function cleanDomainString(domain: string): string {
    return domain
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '')
        .toLowerCase()
        .trim();
}

/**
 * ULTRA-OPTIMIZED: Uses memory caching and minimal queries
 */
export async function getSiteByDomain(domain: string): Promise<PublicSiteData | null> {
    const cleanDomain = cleanDomainString(domain);

    // Early exit for non-public domains
    if (SKIP_PATTERNS.some(p => cleanDomain.includes(p))) {
        return null;
    }

    // 1. Check memory cache first (fastest)
    const cached = siteCache.get(cleanDomain);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log('[PublicSite] Memory cache hit:', cleanDomain);
        return cached.data;
    }

    // 2. Check localStorage cache (survives refresh)
    const localCached = getLocalStorageCache(cleanDomain);
    if (localCached) {
        console.log('[PublicSite] LocalStorage cache hit:', cleanDomain);
        // Also set in memory for faster subsequent access
        siteCache.set(cleanDomain, { data: localCached, timestamp: Date.now() });
        return localCached;
    }

    console.log('[PublicSite] Fetching from DB:', cleanDomain);

    try {
        // PARALLEL QUERIES: Fetch profiles and offices at the same time
        const [profilesResult, officesResult] = await Promise.all([
            supabase
                .from('profiles')
                .select('id, full_name, site_config')
                .not('site_config', 'is', null)
                .limit(50),
            supabase
                .from('offices')
                .select('id, name, site_config')
                .not('site_config', 'is', null)
                .limit(50)
        ]);

        const profiles = profilesResult.data;
        const offices = officesResult.data;

        // Check profiles for domain match
        if (profiles) {
            for (const profile of profiles) {
                const config = profile.site_config as WebSiteConfig | null;
                if (config?.domain && config.isActive) {
                    const configDomain = cleanDomainString(config.domain);
                    if (configDomain === cleanDomain) {
                        console.log('[PublicSite] ✓ Personal site:', profile.full_name);

                        // Fetch properties - optimized with specific columns and DB-level filtering
                        const { data: props } = await supabase
                            .from('properties')
                            .select('id, title, status, location, price, currency, rooms, bathrooms, area, images, description, buildingAge, currentFloor, listing_status, type, heating, coordinates')
                            .eq('user_id', profile.id)
                            .or('listing_status.eq.Aktif,listing_status.is.null')
                            .limit(50);

                        // Already filtered at DB level
                        const activeProps = props || [];

                        const result: PublicSiteData = {
                            type: 'personal',
                            userId: profile.id,
                            siteConfig: config,
                            properties: activeProps,
                            ownerName: profile.full_name
                        };

                        // Cache result in memory and localStorage
                        siteCache.set(cleanDomain, { data: result, timestamp: Date.now() });
                        setLocalStorageCache(cleanDomain, result);
                        return result;
                    }
                }
            }
        }

        if (offices) {
            for (const office of offices) {
                const config = office.site_config as WebSiteConfig | null;
                if (config?.domain && config.isActive) {
                    const configDomain = cleanDomainString(config.domain);
                    if (configDomain === cleanDomain) {
                        console.log('[PublicSite] ✓ Office site:', office.name);

                        // Get office members
                        const { data: members } = await supabase
                            .from('profiles')
                            .select('id')
                            .eq('office_id', office.id)
                            .limit(20);

                        const memberIds = members?.map(m => m.id) || [];

                        // Get properties (office_id based) - optimized query
                        const { data: officeProps } = await supabase
                            .from('properties')
                            .select('id, title, status, location, price, currency, rooms, bathrooms, area, images, description, buildingAge, currentFloor, listing_status, type, heating, coordinates')
                            .eq('office_id', office.id)
                            .or('listing_status.eq.Aktif,listing_status.is.null')
                            .limit(50);

                        let allProps = officeProps || [];

                        // Also get member properties if any - optimized query
                        if (memberIds.length > 0) {
                            const { data: memberProps } = await supabase
                                .from('properties')
                                .select('id, title, status, location, price, currency, rooms, bathrooms, area, images, description, buildingAge, currentFloor, listing_status, type, heating, coordinates')
                                .in('user_id', memberIds)
                                .or('listing_status.eq.Aktif,listing_status.is.null')
                                .limit(50);

                            if (memberProps) {
                                const existingIds = new Set(allProps.map(p => p.id));
                                for (const p of memberProps) {
                                    if (!existingIds.has(p.id)) {
                                        allProps.push(p);
                                    }
                                }
                            }
                        }

                        // Already filtered at DB level
                        const activeProps = allProps;

                        const result: PublicSiteData = {
                            type: 'office',
                            officeId: office.id,
                            siteConfig: config,
                            properties: activeProps,
                            officeName: office.name
                        };

                        // Cache result in memory and localStorage
                        siteCache.set(cleanDomain, { data: result, timestamp: Date.now() });
                        setLocalStorageCache(cleanDomain, result);
                        return result;
                    }
                }
            }
        }

        console.log('[PublicSite] ✗ No match:', cleanDomain);

        // Cache null result to prevent repeated lookups
        siteCache.set(cleanDomain, { data: null, timestamp: Date.now() });
        return null;

    } catch (error) {
        console.error('[PublicSite] Error:', error);
        return null;
    }
}

/**
 * Clear cache for a specific domain (call after updates)
 */
export function clearSiteCache(domain?: string) {
    if (domain) {
        siteCache.delete(cleanDomainString(domain));
    } else {
        siteCache.clear();
    }
}
