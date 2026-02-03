-- Add performance_settings column to offices table
ALTER TABLE offices
ADD COLUMN IF NOT EXISTS performance_settings JSONB
DEFAULT '{"showListingCount": true, "showSalesCount": true, "showRentalCount": true, "showRevenue": false, "showCommission": false}';
