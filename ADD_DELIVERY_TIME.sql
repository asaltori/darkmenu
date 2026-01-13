
-- Add delivery_time column to orders table if it doesn't exist
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_time integer;
