-- =========================================================
-- MIGRACIÓN V6: CAMAREROS Y PROPINAS
-- =========================================================

-- 1. Actualizar Orders
-- Agregar referencia al camarero y porcentaje de propina
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='waiter_id') then
        alter table orders add column waiter_id int references users(id);
    end if;

    if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='tip_percentage') then
        alter table orders add column tip_percentage int default 0; -- Porcentaje entero (e.g. 10 para 10%)
    end if;
end $$;

-- NOTA: No es necesaria una tabla 'camareros' separada porque ya tenemos 'users' con rol='waiter' 
-- y vinculado a 'restaurants' vía 'restaurant_id'.
-- La lógica de propinas variable se maneja por orden, asignada al camarero que confirma.

-- ==========================================
-- ACTUALIZACIÓN DE DATOS (Opcional)
-- ==========================================

-- Asignar propina por defecto del 10% a órdenes pasadas confirmadas (opcional)
-- update orders set tip_percentage = 10 where status in ('confirmado', 'entregado', 'en_camino');
