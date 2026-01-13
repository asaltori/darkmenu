
-- Ingredients Table
CREATE TABLE IF NOT EXISTS ingredients (
    id SERIAL PRIMARY KEY,
    carrito_id INTEGER REFERENCES carritos(id) ON DELETE CASCADE, -- NULL means Global
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menu Item Ingredients (Junction)
CREATE TABLE IF NOT EXISTS menu_item_ingredients (
    id SERIAL PRIMARY KEY,
    menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
    ingredient_id INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT TRUE,
    price_adjustment NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
