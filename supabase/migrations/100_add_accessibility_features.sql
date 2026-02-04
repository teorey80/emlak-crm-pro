-- Add missing accessibilityFeatures column to properties table
-- This column stores accessibility features for properties (e.g., wheelchair access, elevator)

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS accessibility_features TEXT[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN properties.accessibility_features IS 'Accessibility features for the property (e.g., Asansör, Engelli Rampası)';

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
