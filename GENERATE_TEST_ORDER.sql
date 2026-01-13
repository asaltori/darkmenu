
-- Generar un pedido de prueba en estado 'confirmado' para que aparezca en el Dashboard del Carrito

WITH target_rest AS (SELECT id FROM restaurants WHERE name = 'Restaurante Demo' LIMIT 1),
     target_table AS (SELECT id FROM tables WHERE restaurant_id = (SELECT id FROM target_rest) LIMIT 1),
     target_carrito AS (SELECT id FROM carritos WHERE name = 'Carrito Tacos Demo' LIMIT 1),
     target_item AS (SELECT id, name, cost_price FROM menu_items WHERE carrito_id = (SELECT id FROM target_carrito) LIMIT 1)

INSERT INTO orders (restaurant_id, table_id, status, items, created_at)
SELECT 
    tr.id, 
    tt.id, 
    'confirmado', 
    json_build_array(
        json_build_object(
            'id', ti.id,
            'name', ti.name,
            'quantity', 2,
            'sellingPrice', ti.cost_price * 2,
            'carritoId', tc.id,
            'preparationTime', 10,
            'ownerId', (SELECT owner_user_id FROM carritos WHERE id = tc.id) -- Legacy support
        )
    ),
    now()
FROM target_rest tr, target_table tt, target_carrito tc, target_item ti;
