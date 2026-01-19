-- Web Site Configuration Infrastructure
-- Run this in Supabase SQL Editor

-- 1. Add web_config to Offices (for Agency site)
ALTER TABLE public.offices 
ADD COLUMN IF NOT EXISTS site_config JSONB DEFAULT '{
    "siteTitle": "Emlak Ofisimiz",
    "aboutText": "Hizmetlerimiz...",
    "primaryColor": "#0ea5e9",
    "phone": "",
    "email": "",
    "isActive": false,
    "layout": "standard"
}'::jsonb;

-- 2. Add web_config to Profiles (for Personal site)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS site_config JSONB DEFAULT '{
    "siteTitle": "Emlak Danışmanı",
    "aboutText": "Hizmetinizdeyim...",
    "primaryColor": "#0ea5e9",
    "phone": "",
    "email": "",
    "isActive": false,
    "layout": "standard",
    "domain": ""
}'::jsonb;

-- 3. Update RLS for safety (already enabled in most cases)
NOTIFY pgrst, 'reload schema';
