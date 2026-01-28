-- Migration: Add Kapora (Deposit) Tracking
-- Update listing_status to include 'Kapora Alındı'
-- Date: 2026-01-28

-- 1. Drop and recreate constraint with new value
ALTER TABLE public.properties 
DROP CONSTRAINT IF EXISTS properties_listing_status_check;

ALTER TABLE public.properties 
ADD CONSTRAINT properties_listing_status_check 
CHECK (listing_status IN ('Aktif', 'Pasif', 'Satıldı', 'Kiralandı', 'Kapora Alındı'));

-- 2. Add deposit tracking columns
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS deposit_amount numeric;

ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS deposit_date date;

ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS deposit_buyer_id text;

ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS deposit_buyer_name text;

ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS deposit_notes text;

-- 3. Create index for listing_status filter with kapora
CREATE INDEX IF NOT EXISTS idx_properties_kapora_status 
ON public.properties(listing_status) WHERE listing_status = 'Kapora Alındı';

-- Done
COMMENT ON COLUMN public.properties.deposit_amount IS 'Kapora miktarı (TL)';
COMMENT ON COLUMN public.properties.deposit_date IS 'Kapora alınma tarihi';
COMMENT ON COLUMN public.properties.deposit_buyer_id IS 'Kapora veren müşteri ID';
COMMENT ON COLUMN public.properties.deposit_buyer_name IS 'Kapora veren müşteri adı';
COMMENT ON COLUMN public.properties.deposit_notes IS 'Kapora ile ilgili notlar';
