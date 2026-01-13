
-- Limpiar TODOS los pedidos de la base de datos para reiniciar pruebas
TRUNCATE TABLE orders RESTART IDENTITY CASCADE;

-- Opcional: Si quieres reiniciar también los contadores de mesas o estadísticas relacionadas
-- UPDATE tables SET active = true; -- Ejemplo, si se usara para marcar ocupadas
