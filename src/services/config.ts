// Environment variables configuration
// Vite client-side uses import.meta.env.VITE_* prefix
export const config = {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "",
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
    geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || ""
};
