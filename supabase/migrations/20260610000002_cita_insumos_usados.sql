-- 1. Crear tabla de insumos usados en la cita
CREATE TABLE IF NOT EXISTS public.cita_insumos_usados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cita_id UUID NOT NULL REFERENCES public.citas(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    cantidad DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
    abrio_nuevo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- No repetir el mismo producto para la misma cita
    CONSTRAINT unique_cita_producto UNIQUE (cita_id, producto_id)
);

-- 2. Habilitar RLS
ALTER TABLE public.cita_insumos_usados ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas RLS para cita_insumos_usados
DROP POLICY IF EXISTS "Permitir lectura de cita_insumos_usados para usuarios autenticados" ON public.cita_insumos_usados;
CREATE POLICY "Permitir lectura de cita_insumos_usados para usuarios autenticados" 
    ON public.cita_insumos_usados 
    FOR SELECT 
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Permitir inserción de cita_insumos_usados para admin y groomer" ON public.cita_insumos_usados;
CREATE POLICY "Permitir inserción de cita_insumos_usados para admin y groomer" 
    ON public.cita_insumos_usados 
    FOR INSERT 
    WITH CHECK (public.get_user_role() IN ('admin', 'groomer'));

DROP POLICY IF EXISTS "Permitir full_access en cita_insumos_usados para admin" ON public.cita_insumos_usados;
CREATE POLICY "Permitir full_access en cita_insumos_usados para admin" 
    ON public.cita_insumos_usados 
    FOR ALL 
    USING (public.get_user_role() = 'admin')
    WITH CHECK (public.get_user_role() = 'admin');

-- 4. Crear política RLS para permitir a groomers actualizar stock de productos marcados como insumo
DROP POLICY IF EXISTS "Permitir actualización de stock de insumos a groomers" ON public.productos;
CREATE POLICY "Permitir actualización de stock de insumos a groomers"
    ON public.productos
    FOR UPDATE
    TO authenticated
    USING (public.get_user_role() = 'groomer' AND es_insumo = true)
    WITH CHECK (public.get_user_role() = 'groomer' AND es_insumo = true);
