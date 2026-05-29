-- ============================================================================
-- MIGRACIÓN DE FLEXIBILIDAD EN PROPUESTAS Y RECHAZOS
-- Ejecuta este script en el editor SQL de tu panel de Supabase
-- ============================================================================

-- 1. Añadir columnas a la tabla citas
ALTER TABLE public.citas
ADD COLUMN IF NOT EXISTS sugerencia_fecha_hora_inicio TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sugerencia_fecha_hora_fin TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rechazo_mensaje TEXT;

-- 2. Asegurarse de que el RLS permite actualizar estos nuevos campos a los roles correctos.
-- (Las políticas existentes "Permitir actualización de citas según rol" 
-- ya permiten a recepción/admin y a clientes actualizar registros en citas).
