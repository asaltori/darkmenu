
-- 1. Limpiar datos de prueba (opcional)
-- delete from users where username in ('rest1', 'carrito1', 'mesero1');

-- 2. Crear Usuarios
insert into users (username, password, role, name) values 
('rest1', '123', 'restaurant', 'Dueño Restaurante Demo'),
('carrito1', '123', 'carrito', 'Dueño Carrito Demo'),
('mesero1', '123', 'waiter', 'Juan Mesero')
on conflict (username) do nothing;

-- 3. Crear Restaurante vinculado a rest1
insert into restaurants (name, owner_user_id)
select 'Restaurante Demo', id from users where username = 'rest1'
on conflict do nothing;

-- 4. Crear Carrito vinculado a carrito1
insert into carritos (name, address, owner_user_id)
select 'Carrito Tacos Demo', 'Calle Falsa 123', id from users where username = 'carrito1'
on conflict do nothing;

-- 5. Vincular Mesero al Restaurante (Actualizar usuario mesero)
update users 
set restaurant_id = (select id from restaurants where name = 'Restaurante Demo' limit 1)
where username = 'mesero1';

-- 6. Crear Mesas para el restaurante
insert into tables (restaurant_id, table_number, position, active)
select id, '1', 0, true from restaurants where name = 'Restaurante Demo'
union all
select id, '2', 1, true from restaurants where name = 'Restaurante Demo';

-- 7. Crear items del menu para el carrito
insert into menu_items (carrito_id, name, description, cost_price, preparation_time, active)
select id, 'Taco al Pastor', 'Delicioso taco con piña', 15, 10, true from carritos where name = 'Carrito Tacos Demo'
union all
select id, 'Burrito', 'Burrito gigante de carne', 25, 15, true from carritos where name = 'Carrito Tacos Demo';

-- 8. Asignar items al restaurante (venderlos)
insert into restaurant_menu_items (restaurant_id, menu_item_id, selling_price, active)
select r.id, m.id, m.cost_price * 2, true
from restaurants r, menu_items m
where r.name = 'Restaurante Demo' and m.name in ('Taco al Pastor', 'Burrito')
on conflict do nothing;
