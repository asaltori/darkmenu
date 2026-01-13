-- Script para resetear o crear el usuario admin por defecto
insert into users (username, password, role, name) 
values ('admin', 'admin', 'admin', 'Administrador Principal')
on conflict (username) do update 
set password = 'admin', role = 'admin';
