-- Agregar columnas active y position a la tabla tables
alter table tables add column active boolean default true;
alter table tables add column position int default 0;
