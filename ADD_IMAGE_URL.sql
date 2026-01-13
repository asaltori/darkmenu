
-- Add image_url to menu_items
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS image_url TEXT;
