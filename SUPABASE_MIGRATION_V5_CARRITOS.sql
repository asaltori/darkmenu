-- =========================================================
-- MIGRACIÓN V5: GESTIÓN DE CARRITOS
-- =========================================================

-- 1. Tabla de Carritos
create table if not exists carritos (
  id serial primary key,
  name text not null,
  address text, -- Dirección física del carrito
  owner_user_id int references users(id), -- El usuario "carrito" dueño
  active boolean default true,
  created_at timestamptz default now()
);

-- 2. Actualizar Menu Items
-- Agregar referencia a carritos y tiempo de preparación
alter table menu_items add column if not exists carrito_id int references carritos(id);
alter table menu_items add column if not exists preparation_time int default 15; -- Minutos

-- 3. Actualizar Usuarios (Para vincular dueños a carritos, opcional si usamos owner_user_id en carritos)
-- No es estrictamente necesario agregar carrito_id a users si la relación es 1:1 y se busca por owner_user_id en carritos.
-- Pero para consistencia con Restaurants, lo mantenemos simple: User -> Carritos (1:N) o Carrito -> User (1:1).
-- Usaremos la lógica: Un usuario 'carrito' gestiona su carrito.

-- ==========================================
-- MIGRACIÓN DE DATOS EXISTENTES
-- ==========================================

-- Crear entradas en 'carritos' para cada usuario con rol 'carrito' existente
insert into carritos (name, owner_user_id, address)
select name || ' (Carrito)', id, 'Dirección por defecto'
from users 
where role = 'carrito'
and not exists (select 1 from carritos where owner_user_id = users.id);

-- Actualizar menu_items para apuntar a los nuevos carritos
-- Basado en el antiguo owner_id que apuntaba al usuario
update menu_items
set carrito_id = c.id
from carritos c
where menu_items.owner_id = c.owner_user_id
and menu_items.carrito_id is null;

-- Habilitar Realtime
alter publication supabase_realtime add table carritos;
