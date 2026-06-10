-- =====================================================================
-- POLÍTICAS RLS PARA LOS MÓDULOS DE INVENTARIO Y FINANZAS
-- =====================================================================
-- Este script define la seguridad a nivel de filas (RLS) en Supabase para 
-- asegurar que cada rol (admin, recepcion, groomer, cliente, guest) tenga 
-- los accesos correctos y restringir cualquier operación no autorizada.

-- ---------------------------------------------------------------------
-- 0. FUNCIÓN AUXILIAR DE ACCESO A ROLES
-- ---------------------------------------------------------------------
-- Para evitar problemas de recursión infinita (circular dependency) al 
-- leer la tabla de perfiles en las políticas RLS, creamos una función
-- con 'SECURITY DEFINER'. Esto ejecuta la lectura de rol con privilegios de 
-- sistema y retorna el rol del usuario autenticado actual.

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
DECLARE
  v_rol text;
BEGIN
  -- Si el usuario no está autenticado, se le considera un invitado/guest
  IF auth.uid() IS NULL THEN
    RETURN 'guest';
  END IF;

  SELECT rol INTO v_rol FROM public.perfiles WHERE id = auth.uid();
  RETURN COALESCE(v_rol, 'cliente');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================================
-- SECCIÓN I: MÓDULO DE INVENTARIO
-- =====================================================================

-- Habilitar RLS en las tablas correspondientes
ALTER TABLE public.categorias_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retiros_insumo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_inventario ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- TABLA: categorias_productos
-- ---------------------------------------------------------------------

-- Lectura pública para cualquier persona (visitantes web y personal del spa)
CREATE POLICY "Lectura pública de categorías" 
ON public.categorias_productos
FOR SELECT 
USING (true);

-- Escritura completa (Insert, Update, Delete) solo para administradores
CREATE POLICY "Escritura completa de categorías para admin" 
ON public.categorias_productos
FOR ALL 
TO authenticated 
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');


-- ---------------------------------------------------------------------
-- TABLA: productos
-- ---------------------------------------------------------------------

-- Lectura pública de productos (necesario para catálogo web y caja)
CREATE POLICY "Lectura pública de productos" 
ON public.productos
FOR SELECT 
USING (true);

-- Inserción de productos (ABM) solo para administradores
CREATE POLICY "Inserción de productos para admin" 
ON public.productos
FOR INSERT 
TO authenticated
WITH CHECK (public.get_user_role() = 'admin');

-- Eliminación de productos solo para administradores
CREATE POLICY "Eliminación de productos para admin" 
ON public.productos
FOR DELETE 
TO authenticated
USING (public.get_user_role() = 'admin');

-- Edición/Actualización de productos (ej. stock) para admin y recepcion (por ventas físicas)
CREATE POLICY "Actualización de productos para admin y recepcion" 
ON public.productos
FOR UPDATE 
TO authenticated
USING (public.get_user_role() IN ('admin', 'recepcion'))
WITH CHECK (public.get_user_role() IN ('admin', 'recepcion'));


-- ---------------------------------------------------------------------
-- TABLA: retiros_insumo
-- ---------------------------------------------------------------------

-- Lectura de retiros para el personal (admin, recepcion, groomers)
CREATE POLICY "Lectura de retiros para personal" 
ON public.retiros_insumo
FOR SELECT 
TO authenticated
USING (public.get_user_role() IN ('admin', 'recepcion', 'groomer'));

-- Inserción de retiros: Administradores y Groomers (estos últimos solo para sí mismos)
CREATE POLICY "Registro de retiros para admin y groomers" 
ON public.retiros_insumo
FOR INSERT 
TO authenticated
WITH CHECK (
  public.get_user_role() = 'admin'
  OR (public.get_user_role() = 'groomer' AND groomer_id = auth.uid())
);

-- Modificación y borrado de retiros: Únicamente administradores
CREATE POLICY "Modificación y borrado de retiros para admin" 
ON public.retiros_insumo
FOR ALL 
TO authenticated
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');


-- ---------------------------------------------------------------------
-- TABLA: movimientos_inventario
-- ---------------------------------------------------------------------

-- Lectura de movimientos para administradores y recepcionistas (gestores de almacén)
CREATE POLICY "Lectura de movimientos para admin y recepcion" 
ON public.movimientos_inventario
FOR SELECT 
TO authenticated
USING (public.get_user_role() IN ('admin', 'recepcion'));

-- Registro de movimientos: Admin, Recepcion y Groomers (cada uno asocia el movimiento a su propio ID)
CREATE POLICY "Registro de movimientos para personal" 
ON public.movimientos_inventario
FOR INSERT 
TO authenticated
WITH CHECK (
  public.get_user_role() = 'admin'
  OR (public.get_user_role() IN ('recepcion', 'groomer') AND usuario_id = auth.uid())
);

-- Modificación y eliminación del historial de movimientos: solo admin (mantenimiento de auditoría)
CREATE POLICY "Modificación y borrado de movimientos para admin" 
ON public.movimientos_inventario
FOR ALL 
TO authenticated
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');


-- =====================================================================
-- SECCIÓN II: MÓDULO DE FINANZAS
-- =====================================================================

-- Crear la tabla egresos_caja si no existe en la base de datos
CREATE TABLE IF NOT EXISTS public.egresos_caja (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  monto numeric NOT NULL CHECK (monto >= 0::numeric),
  categoria text,
  descripcion text,
  url_factura text,
  registrado_por uuid,
  fecha timestamp with time zone DEFAULT now(),
  CONSTRAINT egresos_caja_pkey PRIMARY KEY (id),
  CONSTRAINT egresos_caja_registrado_por_fkey FOREIGN KEY (registrado_por) REFERENCES public.perfiles(id)
);

-- Habilitar RLS en las tablas de finanzas
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comprobantes_pago ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.egresos_caja ENABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------
-- TABLA: pedidos
-- ---------------------------------------------------------------------

-- Lectura de pedidos: Admin y Recepcionistas ven todos; Clientes ven solo los suyos
CREATE POLICY "Lectura de pedidos según rol y pertenencia" 
ON public.pedidos
FOR SELECT 
USING (
  public.get_user_role() IN ('admin', 'recepcion')
  OR (public.get_user_role() = 'cliente' AND cliente_id = auth.uid())
);

-- Inserción de pedidos: Admin/Recepcion, Clientes (sus propios pedidos) e Invitados (checkout con UUID comodín)
CREATE POLICY "Creación de pedidos permitida" 
ON public.pedidos
FOR INSERT 
WITH CHECK (
  public.get_user_role() IN ('admin', 'recepcion')
  OR (public.get_user_role() = 'cliente' AND cliente_id = auth.uid())
  OR (auth.uid() IS NULL AND cliente_id = '99999999-9999-9999-9999-999999999999')
);

-- Actualización de pedidos (ej. cambiar estado_pago o estado_pedido): Admin y Recepción
CREATE POLICY "Actualización de pedidos para admin y recepcion" 
ON public.pedidos
FOR UPDATE 
USING (public.get_user_role() IN ('admin', 'recepcion'))
WITH CHECK (public.get_user_role() IN ('admin', 'recepcion'));

-- Eliminación de pedidos: Únicamente administradores
CREATE POLICY "Eliminación de pedidos para admin" 
ON public.pedidos
FOR DELETE 
USING (public.get_user_role() = 'admin');


-- ---------------------------------------------------------------------
-- TABLA: detalle_pedidos
-- ---------------------------------------------------------------------

-- Lectura de detalles de pedidos: Admin, Recepcion, o el cliente dueño del pedido base
CREATE POLICY "Lectura de detalles de pedidos" 
ON public.detalle_pedidos
FOR SELECT 
USING (
  public.get_user_role() IN ('admin', 'recepcion')
  OR EXISTS (
    SELECT 1 FROM public.pedidos p
    WHERE p.id = detalle_pedidos.pedido_id
    AND p.cliente_id = auth.uid()
  )
);

-- Registro de detalles: Permitido si el pedido principal les pertenece o es un pedido de invitado (comodín)
CREATE POLICY "Inserción de detalles de pedidos" 
ON public.detalle_pedidos
FOR INSERT 
WITH CHECK (
  public.get_user_role() IN ('admin', 'recepcion')
  OR EXISTS (
    SELECT 1 FROM public.pedidos p
    WHERE p.id = detalle_pedidos.pedido_id
    AND (p.cliente_id = auth.uid() OR p.cliente_id = '99999999-9999-9999-9999-999999999999')
  )
);

-- Modificación/Borrado de detalles de pedidos: Solo admin
CREATE POLICY "Modificación y borrado de detalles para admin" 
ON public.detalle_pedidos
FOR ALL 
TO authenticated
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');


-- ---------------------------------------------------------------------
-- TABLA: comprobantes_pago
-- ---------------------------------------------------------------------

-- Lectura de comprobantes: Admin y Recepcion (validar), Clientes (suyos propios)
CREATE POLICY "Lectura de comprobantes de pago" 
ON public.comprobantes_pago
FOR SELECT 
USING (
  public.get_user_role() IN ('admin', 'recepcion')
  OR EXISTS (
    SELECT 1 FROM public.pedidos p
    WHERE p.id = comprobantes_pago.pedido_id
    AND p.cliente_id = auth.uid()
  )
);

-- Subida de comprobante: Clientes e Invitados al comprar productos por QR
CREATE POLICY "Registro de comprobantes de pago" 
ON public.comprobantes_pago
FOR INSERT 
WITH CHECK (
  public.get_user_role() IN ('admin', 'recepcion')
  OR EXISTS (
    SELECT 1 FROM public.pedidos p
    WHERE p.id = comprobantes_pago.pedido_id
    AND (p.cliente_id = auth.uid() OR p.cliente_id = '99999999-9999-9999-9999-999999999999')
  )
);

-- Validación de comprobante (Aprobar/Rechazar): Admin y Recepción
CREATE POLICY "Modificación de comprobantes para admin y recepcion" 
ON public.comprobantes_pago
FOR UPDATE 
USING (public.get_user_role() IN ('admin', 'recepcion'))
WITH CHECK (public.get_user_role() IN ('admin', 'recepcion'));

-- Eliminación de comprobante físico: Solo admin
CREATE POLICY "Borrado de comprobantes para admin" 
ON public.comprobantes_pago
FOR DELETE 
USING (public.get_user_role() = 'admin');


-- ---------------------------------------------------------------------
-- TABLA: facturas
-- ---------------------------------------------------------------------

-- Lectura de facturas: Admin y Recepción (caja), Clientes (las suyas)
CREATE POLICY "Lectura de facturas por rol y pertenencia" 
ON public.facturas
FOR SELECT 
USING (
  public.get_user_role() IN ('admin', 'recepcion')
  OR cliente_id = auth.uid()
);

-- Registro/Emisión de facturas (caja POS): Admin y Recepción
CREATE POLICY "Emisión de facturas para admin y recepcion" 
ON public.facturas
FOR INSERT 
WITH CHECK (public.get_user_role() IN ('admin', 'recepcion'));

-- Modificación y anulación de facturas: Solo administradores
CREATE POLICY "Modificación y borrado de facturas para admin" 
ON public.facturas
FOR ALL 
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');


-- ---------------------------------------------------------------------
-- TABLA: pagos
-- ---------------------------------------------------------------------

-- Lectura de pagos: Admin y Recepción (gestión diaria), Clientes (ligado a sus facturas)
CREATE POLICY "Lectura de pagos según pertenencia de factura" 
ON public.pagos
FOR SELECT 
USING (
  public.get_user_role() IN ('admin', 'recepcion')
  OR EXISTS (
    SELECT 1 FROM public.facturas f
    WHERE f.id = pagos.factura_id
    AND f.cliente_id = auth.uid()
  )
);

-- Registro de pagos en caja POS: Admin y Recepción
CREATE POLICY "Registro de pagos en caja para admin y recepcion" 
ON public.pagos
FOR INSERT 
WITH CHECK (public.get_user_role() IN ('admin', 'recepcion'));

-- Modificación y borrado: Solo administradores
CREATE POLICY "Modificación y borrado de pagos para admin" 
ON public.pagos
FOR ALL 
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');


-- ---------------------------------------------------------------------
-- TABLA: egresos_caja
-- ---------------------------------------------------------------------

-- Lectura y registro de egresos (caja chica): Solo Admin y Recepcionistas
CREATE POLICY "Lectura de egresos para admin y recepcion" 
ON public.egresos_caja
FOR SELECT 
USING (public.get_user_role() IN ('admin', 'recepcion'));

CREATE POLICY "Registro de egresos para admin y recepcion" 
ON public.egresos_caja
FOR INSERT 
WITH CHECK (
  public.get_user_role() IN ('admin', 'recepcion')
  AND registrado_por = auth.uid()
);

-- Modificación y eliminación: Solo administradores
CREATE POLICY "Modificación y borrado de egresos para admin" 
ON public.egresos_caja
FOR ALL 
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');


-- =====================================================================
-- SECCIÓN III: POLÍTICAS DE STORAGE (ALMACENAMIENTO)
-- =====================================================================
-- Políticas RLS para el Bucket de almacenamiento 'comprobantes' donde 
-- se guardan los captures de QR e imágenes de facturas de egresos.

-- 1. Permitir a todos subir comprobantes al bucket (necesario para invitados y clientes)
CREATE POLICY "Permitir subida de comprobantes en storage a todos"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'comprobantes');

-- 2. Lectura de archivos: Admin, Recepcionistas y el dueño que subió el archivo
CREATE POLICY "Lectura de comprobantes en storage"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'comprobantes'
  AND (
    public.get_user_role() IN ('admin', 'recepcion')
    OR owner = auth.uid()
  )
);

-- 3. Borrado de archivos del bucket: Solo administradores
CREATE POLICY "Eliminación de comprobantes en storage para admin"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'comprobantes' AND public.get_user_role() = 'admin');
