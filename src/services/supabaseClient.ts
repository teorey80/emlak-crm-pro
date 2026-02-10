import { createClient } from '@supabase/supabase-js';
import { config } from './config';

const supabaseUrl = config.supabaseUrl;
const supabaseAnonKey = config.supabaseAnonKey;
const QUERY_TIMEOUT_MS = 60000; // 60 seconds - increased due to slow RLS queries

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase URL or Anon Key is missing. Make sure to set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.");
}

const fetchWithTimeout: typeof fetch = async (input, init = {}) => {
    const controller = new AbortController();
    const externalSignal = init.signal;

    const onAbort = () => controller.abort();
    if (externalSignal) {
        if (externalSignal.aborted) {
            controller.abort();
        } else {
            externalSignal.addEventListener('abort', onAbort, { once: true });
        }
    }

    const timeoutId = setTimeout(() => controller.abort(), QUERY_TIMEOUT_MS);

    try {
        const { signal: _signal, ...restInit } = init;
        return await fetch(input, {
            ...restInit,
            signal: controller.signal
        });
    } finally {
        clearTimeout(timeoutId);
        if (externalSignal) {
            externalSignal.removeEventListener('abort', onAbort);
        }
    }
};

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
    db: {
        schema: 'public'
    },
    global: {
        headers: {
            'x-client-info': 'emlakpro-web'
        },
        fetch: fetchWithTimeout
    },
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    },
    realtime: {
        timeout: 10000
    }
});
