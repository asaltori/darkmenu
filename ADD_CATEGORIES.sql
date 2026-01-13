
-- Create Product Categories Table
CREATE TABLE IF NOT EXISTS product_categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add category_id to menu_items
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES product_categories(id);

-- Insert default categories
INSERT INTO product_categories (name) VALUES 
('Sandwich'), 
('Pizza'), 
('Pasta'), 
('Bebida'), 
('Postre'), 
('Ensalada')
ON CONFLICT (name) DO NOTHING;
