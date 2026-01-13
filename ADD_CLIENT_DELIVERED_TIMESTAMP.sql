
-- Add client_delivered_at column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS client_delivered_at timestamp with time zone;
