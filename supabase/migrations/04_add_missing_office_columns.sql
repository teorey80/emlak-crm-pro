-- FIX MISSING COLUMNS
-- This script adds the missing 'office_id' column to customers, activities, and requests tables.
-- Run this in Supabase SQL Editor to fix the "Could not find the 'office_id' column" error.

-- 1. Update Customers Table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS office_id UUID REFERENCES public.offices(id);

-- 2. Update Activities Table (For future proofing)
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS office_id UUID REFERENCES public.offices(id);

-- 3. Update Requests Table (For future proofing)
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS office_id UUID REFERENCES public.offices(id);

-- 4. Update RLS for Customers (Optional but good practice)
-- Allow users to see customers in their office? 
-- For now, we stick to "Private" as per previous instruction, but at least the column exists.

-- 5. Force schema cache reload (Supabase sometimes caches schema)
NOTIFY pgrst, 'reload schema';
