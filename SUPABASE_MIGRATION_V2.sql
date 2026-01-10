-- Agregar columna delivery_time a la tabla orders
-- MIGRACIÓN MANUAL:
-- alter table orders add column delivery_time text;

-- SCRIPT ACTUALIZADO:
alter table orders add column delivery_time text;
