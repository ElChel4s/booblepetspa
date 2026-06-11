-- Crear tabla para los arqueos de caja
CREATE TABLE public.arqueos_caja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha_apertura TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    fecha_cierre TIMESTAMP WITH TIME ZONE,
    usuario_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    monto_inicial DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    monto_final_sistema DECIMAL(10, 2),
    monto_final_declarado DECIMAL(10, 2),
    diferencia DECIMAL(10, 2),
    estado VARCHAR(20) DEFAULT 'abierta',
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Políticas RLS
ALTER TABLE public.arqueos_caja ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura para todos los autenticados" 
    ON public.arqueos_caja 
    FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir full_access en arqueos_caja a admin y recepcion"
    ON public.arqueos_caja
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM perfiles 
            WHERE perfiles.id = auth.uid() 
            AND perfiles.rol IN ('admin', 'recepcion')
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
DROP TRIGGER IF EXISTS update_arqueos_caja_updated_at ON public.arqueos_caja;
CREATE TRIGGER update_arqueos_caja_updated_at
    BEFORE UPDATE ON public.arqueos_caja
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
