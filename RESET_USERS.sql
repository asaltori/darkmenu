
-- RESET USERS ONLY
-- This script will forcibly update or create the demo users with the correct password.

INSERT INTO users (username, password, role, name) 
VALUES ('carrito_demo', '1234', 'carrito', 'Dueño Carrito Demo')
ON CONFLICT (username) DO UPDATE 
SET password = '1234', role = 'carrito';

INSERT INTO users (username, password, role, name) 
VALUES ('rest_demo', '1234', 'restaurant', 'Dueño Restaurante Demo')
ON CONFLICT (username) DO UPDATE 
SET password = '1234', role = 'restaurant';
