
-- añadiendo precio vestido a productos
ALTER TABLE IF EXISTS public.productos
    ADD COLUMN precio_vestido integer;

-- Eliminar columna cantidad 
ALTER TABLE IF EXISTS public.productos DROP COLUMN IF EXISTS cantidad;

-- agregar columna de telefono
ALTER TABLE IF EXISTS public.ventas
    ADD COLUMN telefono text;

-- agregar columnas de ajustes
ALTER TABLE IF EXISTS public.ventas
    ADD COLUMN bastilla text;

ALTER TABLE IF EXISTS public.ventas
    ADD COLUMN busto text;

ALTER TABLE IF EXISTS public.ventas
    ADD COLUMN tirantes text;

ALTER TABLE IF EXISTS public.ventas
    ADD COLUMN "mangaPuño" text;

ALTER TABLE IF EXISTS public.ventas
    ADD COLUMN cintura text;

ALTER TABLE IF EXISTS public.ventas
    ADD COLUMN espalda text;

ALTER TABLE IF EXISTS public.ventas
    RENAME "mangaPuño" TO "mangaPuno";