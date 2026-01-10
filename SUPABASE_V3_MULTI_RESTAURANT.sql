-- =========================================================
-- MIGRACIÓN V3: SISTEMA MULTI-RESTAURANT Y MESAS REALES
-- =========================================================

-- 1. Tabla de Restaurantes
create table restaurants (
  id serial primary key,
  name text not null,
  owner_user_id int references users(id), -- El usuario "restaurant" dueño
  created_at timestamptz default now()
);

-- 2. Tabla de Mesas (Vinculadas a un Restaurant)
create table tables (
  id serial primary key,
  restaurant_id int references restaurants(id) on delete cascade,
  table_number text not null,
  qr_code text, -- URL o identificador del QR
  created_at timestamptz default now(),
  unique(restaurant_id, table_number)
);

-- 3. Tabla de Menú del Restaurante (Precios definidos por el restaurant para items de carritos)
-- Esta tabla reemplaza la lógica anterior de 'selling_price' en 'menu_items'
create table restaurant_menu_items (
  id serial primary key,
  restaurant_id int references restaurants(id) on delete cascade,
  menu_item_id int references menu_items(id) on delete cascade, -- Item original del carrito
  selling_price numeric not null default 0,
  active boolean default true,
  created_at timestamptz default now(),
  unique(restaurant_id, menu_item_id)
);

-- 4. Actualizar Usuarios (Para vincular Camareros a Restaurantes)
alter table users add column restaurant_id int references restaurants(id);

-- 5. Actualizar Ordenes (Para saber de qué restaurant es la orden)
alter table orders add column restaurant_id int references restaurants(id);
-- (Ya teníamos table_id, pero ahora table_id será FK de la tabla 'tables', no un entero simple)
-- Como 'table_id' ya existe como int, vamos a limpiarla o ajustarla.
-- Lo mejor es borrar datos de prueba anteriores para evitar conflictos de FK.
truncate table orders cascade; 
alter table orders drop column table_id;
alter table orders add column table_id int references tables(id);


-- ==========================================
-- DATOS DE PRUEBA (SEED)
-- ==========================================

-- Crear un Restaurant vinculado al usuario 'restaurant' (ID 4 del seed anterior)
insert into restaurants (name, owner_user_id) 
values ('El Gran Restaurant', (select id from users where username='restaurant'));

-- Crear Mesas para ese Restaurant
insert into tables (restaurant_id, table_number) values 
((select id from restaurants where name='El Gran Restaurant'), '1'),
((select id from restaurants where name='El Gran Restaurant'), '2'),
((select id from restaurants where name='El Gran Restaurant'), '3');

-- Asignar el Camarero 'waiter1' al Restaurant
update users set restaurant_id = (select id from restaurants where name='El Gran Restaurant')
where username = 'waiter1';

-- Habilitar Realtime para las nuevas tablas
alter publication supabase_realtime add table restaurants;
alter publication supabase_realtime add table tables;
alter publication supabase_realtime add table restaurant_menu_items;
