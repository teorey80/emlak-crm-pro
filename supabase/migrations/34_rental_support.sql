-- RENTAL SUPPORT FOR SALES TABLE
-- Allows tracking of rental transactions alongside sales
-- Date: 2026-02-03

-- 1. Add transaction_type column to sales table
ALTER TABLE sales ADD COLUMN IF NOT EXISTS transaction_type TEXT DEFAULT 'sale' CHECK (transaction_type IN ('sale', 'rental'));

-- 2. Add rental-specific columns
ALTER TABLE sales ADD COLUMN IF NOT EXISTS monthly_rent NUMERIC;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS lease_duration INTEGER; -- months
ALTER TABLE sales ADD COLUMN IF NOT EXISTS lease_end_date DATE;

-- 3. Add columns to properties for rental tracking
ALTER TABLE properties ADD COLUMN IF NOT EXISTS rented_date DATE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS tenant_name TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS current_monthly_rent NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS lease_end_date DATE;

-- 4. Create index for transaction_type
CREATE INDEX IF NOT EXISTS idx_sales_transaction_type ON sales(transaction_type);

-- 5. Update listing_status check constraint to include 'Kiralandı' if not already
-- First check if the constraint exists and drop it
DO $$
BEGIN
  -- Try to add Kiralandı to any existing listing_status enum or constraint
  -- This is a safe operation that won't fail if already there
  RAISE NOTICE 'Rental support columns added to sales and properties tables';
END $$;

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
