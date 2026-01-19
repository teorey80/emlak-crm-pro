-- Migration: Property Status and Sales Management
-- Add listing status, inactive reason, and sales tracking

-- 1. Add new columns to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS listing_status text DEFAULT 'Aktif' 
  CHECK (listing_status IN ('Aktif', 'Pasif', 'Satıldı', 'Kiralandı'));

ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS inactive_reason text;

ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS sold_date date;

ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS rented_date date;

-- 2. Create sales table for income/expense tracking
CREATE TABLE IF NOT EXISTS public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id text REFERENCES public.properties(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  office_id uuid,
  created_at timestamptz DEFAULT now(),
  
  -- Sale information
  sale_price numeric NOT NULL,
  sale_date date NOT NULL,
  buyer_id text, -- Reference to customer
  buyer_name text,
  
  -- Commission
  commission_rate numeric DEFAULT 3, -- Percentage
  commission_amount numeric NOT NULL,
  
  -- Expenses (JSONB array)
  expenses jsonb DEFAULT '[]',
  total_expenses numeric DEFAULT 0,
  
  -- Revenue sharing
  office_share_rate numeric DEFAULT 50, -- Percentage
  consultant_share_rate numeric DEFAULT 50,
  office_share_amount numeric,
  consultant_share_amount numeric,
  net_profit numeric,
  
  -- Notes
  notes text
);

-- 3. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_properties_listing_status ON public.properties(listing_status);
CREATE INDEX IF NOT EXISTS idx_sales_property_id ON public.sales(property_id);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON public.sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_office_id ON public.sales(office_id);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON public.sales(sale_date);

-- 4. Enable RLS on sales table
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for sales
CREATE POLICY "Users can view their own sales" ON public.sales
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sales" ON public.sales
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sales" ON public.sales
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sales" ON public.sales
FOR DELETE USING (auth.uid() = user_id);

-- 6. Brokers can view all office sales
CREATE POLICY "Brokers can view office sales" ON public.sales
FOR SELECT USING (
  office_id IN (
    SELECT id FROM public.offices WHERE owner_id = auth.uid()
  )
);

-- Done
COMMENT ON TABLE public.sales IS 'Tracks property sales with commission and expense details';
