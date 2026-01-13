
-- Add dietary_tags column (JSONB or Array)
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS dietary_tags JSONB DEFAULT '[]'::jsonb;
