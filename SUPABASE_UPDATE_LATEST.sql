-- =========================================================
-- SCRIPT DE ACTUALIZACIÓN COMPLETA (V3 + V4 + V5 + V6) - ROBUSTO
-- =========================================================

-- =========================================================
-- PARTE 1: ESTRUCTURA MULTI-RESTAURANT (V3)
-- =========================================================

-- 1. Tabla de Restaurantes
create table if not exists restaurants (
  id serial primary key,
  name text not null,
  owner_user_id int references users(id),
  created_at timestamptz default now()
);

-- 2. Tabla de Mesas
create table if not exists tables (
  id serial primary key,
  restaurant_id int references restaurants(id) on delete cascade,
  table_number text not null,
  qr_code text,
  created_at timestamptz default now(),
  unique(restaurant_id, table_number)
);

-- 3. Tabla de Menú del Restaurante
create table if not exists restaurant_menu_items (
  id serial primary key,
  restaurant_id int references restaurants(id) on delete cascade,
  menu_item_id int references menu_items(id) on delete cascade,
  selling_price numeric not null default 0,
  active boolean default true,
  created_at timestamptz default now(),
  unique(restaurant_id, menu_item_id)
);

-- 4. Actualizar Usuarios
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name='users' and column_name='restaurant_id') then
        alter table users add column restaurant_id int references restaurants(id);
    end if;
end $$;

-- 5. Actualizar Ordenes
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='restaurant_id') then
        alter table orders add column restaurant_id int references restaurants(id);
    end if;
end $$;

-- Migración de table_id
do $$
begin
    if not exists (select 1 from information_schema.table_constraints where constraint_name = 'orders_table_id_fkey') then
        truncate table orders cascade; 
        alter table orders drop column if exists table_id;
        alter table orders add column table_id int references tables(id);
    end if;
end $$;


-- =========================================================
-- PARTE 2: GESTIÓN DE MESAS (V4)
-- =========================================================

do $$
begin
    if not exists (select 1 from information_schema.columns where table_name='tables' and column_name='active') then
        alter table tables add column active boolean default true;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name='tables' and column_name='position') then
        alter table tables add column position int default 0;
    end if;
end $$;


-- =========================================================
-- PARTE 3: GESTIÓN DE CARRITOS (V5)
-- =========================================================

-- 1. Tabla de Carritos
create table if not exists carritos (
  id serial primary key,
  name text not null,
  address text,
  owner_user_id int references users(id),
  active boolean default true,
  created_at timestamptz default now()
);

-- 2. Actualizar Menu Items
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name='menu_items' and column_name='carrito_id') then
        alter table menu_items add column carrito_id int references carritos(id);
    end if;

    if not exists (select 1 from information_schema.columns where table_name='menu_items' and column_name='preparation_time') then
        alter table menu_items add column preparation_time int default 15;
    end if;
end $$;


-- =========================================================
-- PARTE 4: GESTIÓN DE CAMAREROS Y PROPINAS (V6)
-- =========================================================

do $$
begin
    if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='waiter_id') then
        alter table orders add column waiter_id int references users(id);
    end if;

    if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='tip_percentage') then
        alter table orders add column tip_percentage int default 0;
    end if;
end $$;


-- =========================================================
-- PARTE 5: MIGRACIÓN DE DATOS Y PERMISOS
-- =========================================================

-- Migración de Carritos
insert into carritos (name, owner_user_id, address)
select name || ' (Carrito)', id, 'Dirección por defecto'
from users 
where role = 'carrito'
and not exists (select 1 from carritos where owner_user_id = users.id);

-- Actualizar menu_items
update menu_items
set carrito_id = c.id
from carritos c
where menu_items.owner_id = c.owner_user_id
and menu_items.carrito_id is null;

-- Habilitar Realtime
do $$
begin
  begin
    alter publication supabase_realtime add table restaurants;
  exception when duplicate_object or others then null;
  end;

  begin
    alter publication supabase_realtime add table tables;
  exception when duplicate_object or others then null;
  end;

  begin
    alter publication supabase_realtime add table restaurant_menu_items;
  exception when duplicate_object or others then null;
  end;

  begin
    alter publication supabase_realtime add table carritos;
  exception when duplicate_object or others then null;
  end;
end $$;

-- Seed Básico Restaurante
insert into restaurants (name, owner_user_id) 
select 'El Gran Restaurant', id from users where username='restaurant'
on conflict do nothing;
