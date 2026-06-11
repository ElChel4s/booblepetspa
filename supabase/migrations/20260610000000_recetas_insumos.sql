-- Crear tabla para las recetas de insumos asociados a los servicios
CREATE TABLE public.recetas_insumos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    servicio_id UUID NOT NULL REFERENCES public.servicios(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    cantidad DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Un servicio no debería tener el mismo producto dos veces
    CONSTRAINT unique_servicio_producto UNIQUE (servicio_id, producto_id)
);

-- Políticas RLS
ALTER TABLE public.recetas_insumos ENABLE ROW LEVEL SECURITY;

-- Lectura para todos los roles logueados
CREATE POLICY "Permitir lectura de recetas_insumos para usuarios autenticados" 
    ON public.recetas_insumos 
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Inserción, actualización y borrado solo para admins y gerentes
CREATE POLICY "Permitir full_access en recetas_insumos a admin y gerente"
    ON public.recetas_insumos
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM perfiles 
            WHERE perfiles.id = auth.uid() 
            AND perfiles.rol IN ('admin', 'gerente')
        )
    );

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger de updated_at
DROP TRIGGER IF EXISTS update_recetas_insumos_updated_at ON public.recetas_insumos;
CREATE TRIGGER update_recetas_insumos_updated_at
    BEFORE UPDATE ON public.recetas_insumos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función de conveniencia (RPC) para consumir insumos automáticamente al completar una cita
CREATE OR REPLACE FUNCTION public.consumir_insumos_cita(p_cita_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_servicio_id UUID;
    v_receta RECORD;
BEGIN
    -- Obtener el servicio asociado a la cita
    SELECT servicio_id INTO v_servicio_id
    FROM public.citas
    WHERE id = p_cita_id;

    IF v_servicio_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró el servicio para la cita especificada.';
    END IF;

    -- Iterar sobre la receta del servicio y descontar stock
    FOR v_receta IN 
        SELECT producto_id, cantidad 
        FROM public.recetas_insumos 
        WHERE servicio_id = v_servicio_id
    LOOP
        UPDATE public.productos
        SET stock_actual = GREATEST(stock_actual - v_receta.cantidad, 0)
        WHERE id = v_receta.producto_id;
    END LOOP;
END;
$$;
