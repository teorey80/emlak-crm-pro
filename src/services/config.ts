// Environment variables configuration
// Vite client-side uses import.meta.env.VITE_* prefix
// ⚠️ API anahtarlarını asla kod içine yazmayın — Vercel Environment Variables kullanın
const FALLBACK_SUPABASE_URL = "https://ofttxfmbhulnpbegliwp.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mdHR4Zm1iaHVsbnBiZWdsaXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwOTk5MjAsImV4cCI6MjA4MDY3NTkyMH0._ntPFIsWPmWIiOFh0h6-BymsS4Izwftom9NbfmgQe88";

export const config = {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY,
    geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || ''
};
