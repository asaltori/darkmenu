-- Script para corregir permisos de visualización (Desactivar RLS para demo)
-- Esto permitirá que el cliente (sin loguearse) pueda ver los pedidos y el menú.

alter table orders disable row level security;
alter table menu_items disable row level security;
alter table restaurant_menu_items disable row level security;
alter table tables disable row level security;
alter table restaurants disable row level security;
alter table carritos disable row level security;

-- Opcional: Si prefieres mantener RLS, usa estas políticas (comentar las líneas de arriba y descomentar estas):
-- create policy "Public Select Orders" on orders for select using (true);
-- create policy "Public Insert Orders" on orders for insert with check (true);
