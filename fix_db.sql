-- =====================================================================
-- 0. CREAR BUCKET DE ALMACENAMIENTO (STORAGE)
-- =====================================================================
-- Crea el bucket 'comprobantes' de manera pública para que se puedan subir
-- e inspeccionar las fotos de los comprobantes QR enviados por los clientes.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('comprobantes', 'comprobantes', true)
ON CONFLICT (id) DO NOTHING;


-- =====================================================================
-- 1. CREAR EL PERFIL DE USUARIO INVITADO (GUEST COMODÍN)
-- =====================================================================
-- El UUID '99999999-9999-9999-9999-999999999999' es utilizado por la
-- aplicación para compras sin iniciar sesión. Es necesario registrarlo
-- en auth.users y public.perfiles para evitar violaciones de claves foráneas.

-- Insertar en auth.users (si no existe)
INSERT INTO auth.users (id, email, raw_user_meta_data, raw_app_meta_data, aud, role)
VALUES (
  '99999999-9999-9999-9999-999999999999',
  'invitado@booblepetspa.com',
  '{"nombre_completo": "Invitado Web"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Insertar en public.perfiles (si no existe)
INSERT INTO public.perfiles (id, nombre_completo, rol, email, activo)
VALUES (
  '99999999-9999-9999-9999-999999999999',
  'Invitado Web',
  'cliente',
  'invitado@booblepetspa.com',
  true
) ON CONFLICT (id) DO NOTHING;


-- =====================================================================
-- 2. RECREAR POLÍTICAS RLS DE PEDIDOS Y DETALLES PARA GUEST/INVITADOS
-- =====================================================================

-- Tabla public.pedidos: Permitir SELECT para invitados (para que .insert().select() funcione)
DROP POLICY IF EXISTS "Lectura de pedidos según rol y pertenencia" ON public.pedidos;
CREATE POLICY "Lectura de pedidos según rol y pertenencia" 
ON public.pedidos
FOR SELECT 
USING (
  public.get_user_role() IN ('admin', 'recepcion')
  OR (public.get_user_role() = 'cliente' AND cliente_id = auth.uid())
  OR (auth.uid() IS NULL AND cliente_id = '99999999-9999-9999-9999-999999999999')
);

-- Tabla public.pedidos: Recrear la creación permitida de pedidos
DROP POLICY IF EXISTS "Creación de pedidos permitida" ON public.pedidos;
CREATE POLICY "Creación de pedidos permitida" 
ON public.pedidos
FOR INSERT 
WITH CHECK (
  public.get_user_role() IN ('admin', 'recepcion')
  OR (public.get_user_role() = 'cliente' AND cliente_id = auth.uid())
  OR (auth.uid() IS NULL AND cliente_id = '99999999-9999-9999-9999-999999999999')
);

-- Tabla public.detalle_pedidos: Permitir SELECT para invitados de sus propios detalles
DROP POLICY IF EXISTS "Lectura de detalles de pedidos" ON public.detalle_pedidos;
CREATE POLICY "Lectura de detalles de pedidos" 
ON public.detalle_pedidos
FOR SELECT 
USING (
  public.get_user_role() IN ('admin', 'recepcion')
  OR EXISTS (
    SELECT 1 FROM public.pedidos p
    WHERE p.id = detalle_pedidos.pedido_id
    AND (p.cliente_id = auth.uid() OR p.cliente_id = '99999999-9999-9999-9999-999999999999')
  )
);

-- Tabla public.comprobantes_pago: Permitir SELECT para invitados de sus propios comprobantes
DROP POLICY IF EXISTS "Lectura de comprobantes de pago" ON public.comprobantes_pago;
CREATE POLICY "Lectura de comprobantes de pago" 
ON public.comprobantes_pago
FOR SELECT 
USING (
  public.get_user_role() IN ('admin', 'recepcion')
  OR EXISTS (
    SELECT 1 FROM public.pedidos p
    WHERE p.id = comprobantes_pago.pedido_id
    AND (p.cliente_id = auth.uid() OR p.cliente_id = '99999999-9999-9999-9999-999999999999')
  )
);


-- =====================================================================
-- 3. HABILITAR PUBLICACIÓN EN TIEMPO REAL (SUPABASE REALTIME)
-- =====================================================================
-- Añadir las tablas necesarias a la publicación de realtime
-- para que los oyentes de cambios en la base de datos se ejecuten
-- en tiempo real tanto en la recepción como en el cliente.
-- Nota: si da un error de "relation is already member of publication", se puede omitir.
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.cita_modificadores_aplicados;
EXCEPTION WHEN OTHERS THEN
  -- Capturar y omitir errores si la tabla ya está en la publicación
END $$;



-- =====================================================================
-- 4. RECREAR POLÍTICAS RLS DE MODIFICADORES Y SERVICIOS ADICIONALES
-- =====================================================================
-- Asegurar acceso de lectura y escritura a las tablas de modificadores

-- Tabla modificadores_servicio
ALTER TABLE public.modificadores_servicio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura de modificadores para todos los usuarios" ON public.modificadores_servicio;
CREATE POLICY "Lectura de modificadores para todos los usuarios"
ON public.modificadores_servicio
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Escritura de modificadores para admin y recepcion" ON public.modificadores_servicio;
CREATE POLICY "Escritura de modificadores para admin y recepcion"
ON public.modificadores_servicio
FOR ALL
USING (public.get_user_role() IN ('admin', 'recepcion'));

-- Tabla cita_modificadores_aplicados
ALTER TABLE public.cita_modificadores_aplicados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura de modificadores aplicados para todos" ON public.cita_modificadores_aplicados;
CREATE POLICY "Lectura de modificadores aplicados para todos"
ON public.cita_modificadores_aplicados
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Inserción de modificadores aplicados" ON public.cita_modificadores_aplicados;
CREATE POLICY "Inserción de modificadores aplicados"
ON public.cita_modificadores_aplicados
FOR INSERT
WITH CHECK (
  public.get_user_role() IN ('admin', 'recepcion', 'groomer')
);

DROP POLICY IF EXISTS "Actualización de modificadores aplicados" ON public.cita_modificadores_aplicados;
CREATE POLICY "Actualización de modificadores aplicados"
ON public.cita_modificadores_aplicados
FOR UPDATE
USING (
  public.get_user_role() IN ('admin', 'recepcion')
  -- O el cliente dueño de la mascota vinculada a la cita
  OR (public.get_user_role() = 'cliente' AND EXISTS (
    SELECT 1 FROM public.citas c
    JOIN public.mascotas m ON c.mascota_id = m.id
    WHERE c.id = cita_modificadores_aplicados.cita_id
    AND m.dueno_id = auth.uid()
  ))
);

DROP POLICY IF EXISTS "Borrado de modificadores aplicados" ON public.cita_modificadores_aplicados;
CREATE POLICY "Borrado de modificadores aplicados"
ON public.cita_modificadores_aplicados
FOR DELETE
USING (
  public.get_user_role() IN ('admin', 'recepcion', 'groomer')
);

