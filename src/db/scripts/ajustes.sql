
-- añadiendo precio vestido a productos
ALTER TABLE IF EXISTS public.productos
    ADD COLUMN precio_vestido integer;

-- Eliminar columna cantidad 
ALTER TABLE IF EXISTS public.productos DROP COLUMN IF EXISTS cantidad;