-- ============================================
-- SALES TABLE RLS POLICIES
-- ============================================
-- Adds missing RLS policies for sales table
-- This fixes the issue where sales were not persisting after page refresh
-- ============================================

-- ========== SALES TABLE RLS POLICIES ==========

-- Clean up any existing policies first
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'sales' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.sales', pol.policyname);
    END LOOP;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: Users can view their own sales
CREATE POLICY "sales_select_own" ON public.sales
  FOR SELECT USING (auth.uid() = user_id);

-- 2. SELECT: Users can view sales from their office (for reporting/visibility)
CREATE POLICY "sales_select_office" ON public.sales
  FOR SELECT USING (
    office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid())
  );

-- 3. INSERT: Users can insert their own sales
CREATE POLICY "sales_insert" ON public.sales
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. UPDATE: Users can update their own sales
CREATE POLICY "sales_update" ON public.sales
  FOR UPDATE USING (auth.uid() = user_id);

-- 5. DELETE: Users can delete their own sales
CREATE POLICY "sales_delete" ON public.sales
  FOR DELETE USING (auth.uid() = user_id);

-- 6. ALL: Brokers can manage all sales in their office
CREATE POLICY "sales_broker_all" ON public.sales
  FOR ALL USING (
    office_id IN (
      SELECT office_id FROM public.profiles WHERE id = auth.uid() AND role = 'broker'
    )
  );

-- Verification
SELECT 'Sales RLS policies created successfully' as status;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
