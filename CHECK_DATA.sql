
-- Check Users
select id, username, role from users where role = 'carrito';

-- Check Carritos
select id, name, owner_user_id from carritos;
