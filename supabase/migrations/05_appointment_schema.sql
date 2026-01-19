-- Add 'time' column to activities table
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS time TEXT;

-- Update status check constraint if it exists
-- First, we try to drop the existing constraint if we can guess its name, 
-- or we can just alter the column type to text to be permissive if it was an enum.
-- Assuming standard naming: activities_status_check
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'activities_status_check' 
        AND table_name = 'activities'
    ) THEN 
        ALTER TABLE public.activities DROP CONSTRAINT activities_status_check;
        ALTER TABLE public.activities ADD CONSTRAINT activities_status_check 
        CHECK (status IN ('Olumlu', 'Olumsuz', 'Düşünüyor', 'Tamamlandı', 'Planlandı'));
    END IF; 
END $$;

NOTIFY pgrst, 'reload schema';
