-- 1. Create Users Table
create table users (
  id serial primary key,
  username text unique not null,
  role text not null check (role in ('admin', 'carrito', 'restaurant', 'waiter')),
  name text not null,
  created_at timestamptz default now()
);

-- 2. Create Menu Items Table
create table menu_items (
  id serial primary key,
  owner_id int references users(id),
  name text not null,
  description text,
  cost_price numeric not null default 0,
  selling_price numeric not null default 0,
  active boolean default true,
  created_at timestamptz default now()
);

-- 3. Create Orders Table
create table orders (
  id serial primary key,
  table_id int not null,
  items jsonb not null, -- Stores the array of items: [{itemId, quantity, name, price}]
  status text not null default 'pendiente', -- pendiente, confirmado, en_camino, entregado
  created_at timestamptz default now()
);

-- 4. Enable Realtime for these tables
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table menu_items;

-- 5. Seed Initial Data (Mock Data Migration)
insert into users (username, role, name) values
  ('admin', 'admin', 'Administrador'),
  ('carrito1', 'carrito', 'Carrito de Tacos'),
  ('carrito2', 'carrito', 'Carrito de Burgers'),
  ('restaurant', 'restaurant', 'El Gran Restaurant'),
  ('waiter1', 'waiter', 'Camarero Juan');

-- Insert Menu Items (Assuming IDs from above match 1-5, but using subqueries to be safe)
insert into menu_items (owner_id, name, description, cost_price, selling_price, active) values
  ((select id from users where username = 'carrito1'), 'Taco al Pastor', 'Delicioso taco', 10, 15, true),
  ((select id from users where username = 'carrito1'), 'Taco de Asada', 'Carne asada', 12, 18, true),
  ((select id from users where username = 'carrito2'), 'Hamburguesa Clásica', 'Con queso', 50, 80, true);
