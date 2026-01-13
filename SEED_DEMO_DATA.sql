
-- 1. Create Categories (if they don't exist)
INSERT INTO product_categories (name) VALUES 
('Entradas'), ('Platos Principales'), ('Postres'), ('Bebidas'), ('Vegano')
ON CONFLICT DO NOTHING;

-- 2. Create Ingredients (Global)
INSERT INTO ingredients (name, carrito_id) VALUES 
('Tomate', NULL), ('Lechuga', NULL), ('Queso', NULL), ('Pan Hamburguesa', NULL), 
('Carne de Res', NULL), ('Salsa Picante', NULL), ('Cebolla', NULL), 
('Tortilla Maíz', NULL), ('Frijoles', NULL), ('Chocolate', NULL)
ON CONFLICT DO NOTHING;

-- 3. Script to Create Demo Data (Carrito, Restaurant, Items, Links)
DO $$
DECLARE
    v_carrito_user_id INTEGER;
    v_rest_user_id INTEGER;
    v_carrito_id INTEGER;
    v_rest_id INTEGER;
    v_cat_principal INTEGER;
    v_cat_vegano INTEGER;
    v_cat_postres INTEGER;
    v_item_burger INTEGER;
    v_item_tacos INTEGER;
    v_item_brownie INTEGER;
    v_ing_pan INTEGER;
    v_ing_carne INTEGER;
    v_ing_tomate INTEGER;
    v_ing_queso INTEGER;
    v_ing_tortilla INTEGER;
    v_ing_frijoles INTEGER;
    v_ing_salsa INTEGER;
    v_ing_chocolate INTEGER;
BEGIN
    -- 0. Create Users (for Login)
    
    -- Carrito User
    INSERT INTO users (username, password, role, name) 
    VALUES ('carrito_demo', '1234', 'carrito', 'Dueño Carrito Demo')
    ON CONFLICT (username) DO UPDATE SET username = EXCLUDED.username
    RETURNING id INTO v_carrito_user_id;

    -- Restaurant User
    INSERT INTO users (username, password, role, name) 
    VALUES ('rest_demo', '1234', 'restaurant', 'Dueño Restaurante Demo')
    ON CONFLICT (username) DO UPDATE SET username = EXCLUDED.username
    RETURNING id INTO v_rest_user_id;

    -- Create Carrito
    INSERT INTO carritos (name, address, owner_user_id) VALUES ('Carrito Demo', 'Calle Falsa 123', v_carrito_user_id) RETURNING id INTO v_carrito_id;
    
    -- Create Restaurant
    INSERT INTO restaurants (name, owner_user_id) VALUES ('Restaurante Demo', v_rest_user_id) RETURNING id INTO v_rest_id;

    -- Get Category IDs
    SELECT id INTO v_cat_principal FROM product_categories WHERE name = 'Platos Principales' LIMIT 1;
    SELECT id INTO v_cat_vegano FROM product_categories WHERE name = 'Vegano' LIMIT 1;
    SELECT id INTO v_cat_postres FROM product_categories WHERE name = 'Postres' LIMIT 1;

    -- Get Ingredient IDs
    SELECT id INTO v_ing_pan FROM ingredients WHERE name = 'Pan Hamburguesa' LIMIT 1;
    SELECT id INTO v_ing_carne FROM ingredients WHERE name = 'Carne de Res' LIMIT 1;
    SELECT id INTO v_ing_tomate FROM ingredients WHERE name = 'Tomate' LIMIT 1;
    SELECT id INTO v_ing_queso FROM ingredients WHERE name = 'Queso' LIMIT 1;
    SELECT id INTO v_ing_tortilla FROM ingredients WHERE name = 'Tortilla Maíz' LIMIT 1;
    SELECT id INTO v_ing_frijoles FROM ingredients WHERE name = 'Frijoles' LIMIT 1;
    SELECT id INTO v_ing_salsa FROM ingredients WHERE name = 'Salsa Picante' LIMIT 1;
    SELECT id INTO v_ing_chocolate FROM ingredients WHERE name = 'Chocolate' LIMIT 1;

    -- 4. Create Menu Items
    
    -- Hamburguesa
    INSERT INTO menu_items (carrito_id, category_id, name, description, cost_price, preparation_time, active, image_url, dietary_tags)
    VALUES (v_carrito_id, v_cat_principal, 'Hamburguesa Clásica', 'Jugosa carne con queso derretido y vegetales frescos.', 5.00, 15, true, 
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=60', 
    '[]'::jsonb)
    RETURNING id INTO v_item_burger;

    -- Tacos
    INSERT INTO menu_items (carrito_id, category_id, name, description, cost_price, preparation_time, active, image_url, dietary_tags)
    VALUES (v_carrito_id, v_cat_vegano, 'Tacos Veganos Picantes', 'Tortillas de maíz con frijoles refritos y salsa de la casa.', 3.50, 10, true, 
    'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=500&q=60', 
    '["vegan", "gluten_free", "spicy"]'::jsonb)
    RETURNING id INTO v_item_tacos;

    -- Brownie
    INSERT INTO menu_items (carrito_id, category_id, name, description, cost_price, preparation_time, active, image_url, dietary_tags)
    VALUES (v_carrito_id, v_cat_postres, 'Brownie de Chocolate', 'Intenso sabor a cacao, sin gluten.', 2.00, 5, true, 
    'https://images.unsplash.com/photo-1606313564200-e75d5e30476d?auto=format&fit=crop&w=500&q=60', 
    '["gluten_free", "veggie"]'::jsonb)
    RETURNING id INTO v_item_brownie;

    -- 5. Link Ingredients
    
    -- Burger Links
    INSERT INTO menu_item_ingredients (menu_item_id, ingredient_id, is_default) VALUES
    (v_item_burger, v_ing_pan, true),
    (v_item_burger, v_ing_carne, true),
    (v_item_burger, v_ing_tomate, true),
    (v_item_burger, v_ing_queso, true);

    -- Tacos Links
    INSERT INTO menu_item_ingredients (menu_item_id, ingredient_id, is_default) VALUES
    (v_item_tacos, v_ing_tortilla, true),
    (v_item_tacos, v_ing_frijoles, true),
    (v_item_tacos, v_ing_salsa, true);

    -- Brownie Links
    INSERT INTO menu_item_ingredients (menu_item_id, ingredient_id, is_default) VALUES
    (v_item_brownie, v_ing_chocolate, true);

    -- 6. Add to Restaurant Menu (Publish them)
    INSERT INTO restaurant_menu_items (restaurant_id, menu_item_id, selling_price, active) VALUES
    (v_rest_id, v_item_burger, 12.00, true),
    (v_rest_id, v_item_tacos, 9.50, true),
    (v_rest_id, v_item_brownie, 6.00, true);

    -- 7. Create a Table for the Restaurant
    INSERT INTO tables (restaurant_id, table_number, position, active) VALUES
    (v_rest_id, 'Mesa 1', 1, true);

END $$;
