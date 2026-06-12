// Supabase Keep-Alive Service
// Prevents cold start on free tier by pinging the database periodically
// Add this to your Vercel deployment as a cron job or call it periodically

import { supabase } from './supabaseClient';

// Simple ping to keep the database connection warm
export async function keepSupabaseAlive(): Promise<{ success: boolean; latency: number }> {
    const start = Date.now();

    try {
        // Simple query that forces connection
        const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .limit(1);

        const latency = Date.now() - start;

        if (error) {
            console.error('[KeepAlive] Error:', error.message);
            return { success: false, latency };
        }

        console.log(`[KeepAlive] Ping successful: ${latency}ms`);
        return { success: true, latency };
    } catch (err) {
        const latency = Date.now() - start;
        console.error('[KeepAlive] Exception:', err);
        return { success: false, latency };
    }
}

// Pre-warm cache function - call this when user visits any page
export async function preWarmPublicSiteData() {
    const start = Date.now();

    try {
        // Parallel fetch to warm up both tables
        const [profilesResult, officesResult] = await Promise.all([
            supabase.from('profiles').select('id, full_name, site_config').not('site_config', 'is', null).limit(10),
            supabase.from('offices').select('id, name, site_config').not('site_config', 'is', null).limit(10)
        ]);

        const latency = Date.now() - start;
        console.log(`[PreWarm] Cache warmed in ${latency}ms`);

        return {
            profiles: profilesResult.data?.length || 0,
            offices: officesResult.data?.length || 0,
            latency
        };
    } catch (err) {
        console.error('[PreWarm] Error:', err);
        return { profiles: 0, offices: 0, latency: Date.now() - start };
    }
}
