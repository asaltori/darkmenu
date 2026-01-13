
-- Agregar columnas para tracking de tiempos de preparación y despacho
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS started_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS ready_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS dispatched_at timestamp with time zone;
