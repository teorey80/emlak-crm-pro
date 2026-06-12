import { createClient } from '@supabase/supabase-js';
import { config } from './config';

const supabaseUrl = config.supabaseUrl;
const supabaseAnonKey = config.supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase URL or Anon Key is missing. Make sure to set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.");
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');