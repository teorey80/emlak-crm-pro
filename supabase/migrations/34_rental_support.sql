-- Add rental support to sales table
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS transaction_type text CHECK (transaction_type IN ('sale', 'rental')) DEFAULT 'sale',
ADD COLUMN IF NOT EXISTS monthly_rent numeric,
ADD COLUMN IF NOT EXISTS deposit_amount numeric,
ADD COLUMN IF NOT EXISTS lease_duration integer, -- in months
ADD COLUMN IF NOT EXISTS lease_start_date date,
ADD COLUMN IF NOT EXISTS lease_end_date date;

-- Add rental tracking to properties table
-- FIXED: tenant_id type changed from uuid to text to match customers.id type
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS tenant_id text REFERENCES customers(id),
ADD COLUMN IF NOT EXISTS tenant_name text,
ADD COLUMN IF NOT EXISTS current_monthly_rent numeric,
ADD COLUMN IF NOT EXISTS rented_date date,
ADD COLUMN IF NOT EXISTS tenant_lease_end_date date;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_properties_tenant_id ON properties(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_transaction_type ON sales(transaction_type);
