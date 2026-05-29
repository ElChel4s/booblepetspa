-- ============================================================================
-- SCRIPT DE MIGRACIÓN PARA SUPABASE
-- Ejecuta este script en el editor SQL de tu panel de Supabase
-- ============================================================================

-- 1. Agregar columnas para la propuesta de reprogramación y cambio de groomer
ALTER TABLE public.citas
ADD COLUMN sugerencia_groomer_id uuid REFERENCES public.perfiles(id) ON DELETE SET NULL,
ADD COLUMN propuesta_mensaje text,
ADD COLUMN estado_propuesta text DEFAULT 'ninguna'::text CHECK (estado_propuesta = ANY (ARRAY['ninguna'::text, 'pendiente'::text, 'aceptada'::text, 'rechazada'::text]));

-- 2. Habilitar seguridad de nivel de fila (Row Level Security - RLS)
ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas RLS para lectura (SELECT)
-- Permite a admins y recepcionistas ver todas las citas.
-- Permite a los groomers ver sus citas asignadas.
-- Permite a los clientes ver las citas de sus propias mascotas.
DROP POLICY IF EXISTS "Permitir lectura de citas según rol" ON public.citas;
CREATE POLICY "Permitir lectura de citas según rol" ON public.citas
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.perfiles 
            WHERE id = auth.uid() AND rol IN ('admin', 'recepcion')
        )
        OR
        groomer_id = auth.uid()
        OR
        mascota_id IN (
            SELECT id FROM public.mascotas 
            WHERE dueno_id = auth.uid()
        )
    );

-- 4. Crear políticas RLS para actualización (UPDATE)
-- Permite a admins y recepcionistas actualizar cualquier cita.
-- Permite a los groomers actualizar el estado de sus citas asignadas.
-- Permite a los clientes actualizar sus citas (por ejemplo, para aceptar la propuesta de cambio) si la mascota es suya.
DROP POLICY IF EXISTS "Permitir actualización de citas según rol" ON public.citas;
CREATE POLICY "Permitir actualización de citas según rol" ON public.citas
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.perfiles 
            WHERE id = auth.uid() AND rol IN ('admin', 'recepcion')
        )
        OR
        groomer_id = auth.uid()
        OR
        mascota_id IN (
            SELECT id FROM public.mascotas 
            WHERE dueno_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.perfiles 
            WHERE id = auth.uid() AND rol IN ('admin', 'recepcion')
        )
        OR
        groomer_id = auth.uid()
        OR
        mascota_id IN (
            SELECT id FROM public.mascotas 
            WHERE dueno_id = auth.uid()
        )
    );
