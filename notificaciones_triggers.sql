-- =====================================================================
-- 1. SEGURIDAD RLS PARA NOTIFICACIONES
-- =====================================================================
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

-- Política de Lectura (Ver las propias o las dirigidas al rol)
DROP POLICY IF EXISTS "Lectura de notificaciones propias o por rol" ON public.notificaciones;
CREATE POLICY "Lectura de notificaciones propias o por rol" 
ON public.notificaciones
FOR SELECT 
TO authenticated
USING (
  usuario_id = auth.uid() 
  OR rol_destino = public.get_user_role()
  OR public.get_user_role() = 'admin'
);

-- Política de Actualización (Marcar como leído)
DROP POLICY IF EXISTS "Actualización de notificaciones" ON public.notificaciones;
CREATE POLICY "Actualización de notificaciones"
ON public.notificaciones
FOR UPDATE
TO authenticated
USING (
  usuario_id = auth.uid() 
  OR rol_destino = public.get_user_role()
  OR public.get_user_role() = 'admin'
)
WITH CHECK (
  usuario_id = auth.uid() 
  OR rol_destino = public.get_user_role()
  OR public.get_user_role() = 'admin'
);

-- Política de Inserción (Permite que triggers y algunos módulos inserten)
DROP POLICY IF EXISTS "Inserción de notificaciones por sistema" ON public.notificaciones;
CREATE POLICY "Inserción de notificaciones por sistema"
ON public.notificaciones
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política de Borrado (Eliminar notificación de la bandeja)
DROP POLICY IF EXISTS "Borrado de notificaciones" ON public.notificaciones;
CREATE POLICY "Borrado de notificaciones"
ON public.notificaciones
FOR DELETE
TO authenticated
USING (
  usuario_id = auth.uid() 
  OR public.get_user_role() = 'admin'
);


-- =====================================================================
-- 2. FUNCIONES DE DISPARO (TRIGGERS)
-- =====================================================================

-- 2.1. TRIGGER: NUEVA RESERVA (Notifica a recepción y admin)
CREATE OR REPLACE FUNCTION public.trigger_notificar_nueva_reserva()
RETURNS TRIGGER AS $$
BEGIN
  -- Notificar a recepción
  INSERT INTO public.notificaciones (rol_destino, titulo, mensaje, tipo, link_modulo)
  VALUES (
    'recepcion', 
    'Nueva Reserva Registrada', 
    'Se ha registrado una nueva reserva (ID: ' || left(NEW.id::text, 8) || ').', 
    'cita', 
    'agenda'
  );
  
  -- Notificar a admin
  INSERT INTO public.notificaciones (rol_destino, titulo, mensaje, tipo, link_modulo)
  VALUES (
    'admin', 
    'Nueva Reserva', 
    'Se ha registrado una nueva reserva. ID: ' || left(NEW.id::text, 8), 
    'cita', 
    'agenda'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notificar_nueva_reserva ON public.reservas;
CREATE TRIGGER trg_notificar_nueva_reserva
AFTER INSERT ON public.reservas
FOR EACH ROW EXECUTE FUNCTION public.trigger_notificar_nueva_reserva();


-- 2.2. TRIGGER: CITA COMPLETADA (MASCOTA LISTA - Notifica al Cliente)
CREATE OR REPLACE FUNCTION public.trigger_notificar_cita_completada()
RETURNS TRIGGER AS $$
DECLARE
  v_cliente_id uuid;
  v_mascota_nombre text;
BEGIN
  -- Solo actuar si el estado cambia a 'completada'
  IF NEW.estado = 'completada' AND (OLD.estado IS DISTINCT FROM 'completada') THEN
    
    -- Obtener el cliente de la reserva asociada
    SELECT cliente_id INTO v_cliente_id FROM public.reservas WHERE id = NEW.reserva_id;
    
    -- Obtener nombre de la mascota (opcional para el mensaje)
    SELECT nombre INTO v_mascota_nombre FROM public.mascotas WHERE id = NEW.mascota_id;
    
    IF v_cliente_id IS NOT NULL THEN
      INSERT INTO public.notificaciones (usuario_id, rol_destino, titulo, mensaje, tipo, link_modulo)
      VALUES (
        v_cliente_id,
        'cliente',
        '¡Tu mascota está lista! 🐾',
        'El servicio para ' || COALESCE(v_mascota_nombre, 'tu mascota') || ' ha sido completado con éxito. Ya puedes pasar a recogerla.',
        'cita',
        'historial'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notificar_cita_completada ON public.citas;
CREATE TRIGGER trg_notificar_cita_completada
AFTER UPDATE ON public.citas
FOR EACH ROW EXECUTE FUNCTION public.trigger_notificar_cita_completada();


-- 2.3. TRIGGER: ALERTA DE INVENTARIO (Notifica al Admin)
CREATE OR REPLACE FUNCTION public.trigger_notificar_stock_bajo()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el stock baja o es igual al mínimo, y antes era mayor (para no spamear)
  IF NEW.stock_actual <= NEW.stock_minimo_alerta AND OLD.stock_actual > OLD.stock_minimo_alerta THEN
    INSERT INTO public.notificaciones (rol_destino, titulo, mensaje, tipo, link_modulo)
    VALUES (
      'admin',
      'Alerta de Stock Mínimo',
      'El producto "' || NEW.nombre || '" ha bajado a ' || NEW.stock_actual || ' unidades. Por favor reponga inventario.',
      'stock',
      'inventory'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notificar_stock_bajo ON public.productos;
CREATE TRIGGER trg_notificar_stock_bajo
AFTER UPDATE ON public.productos
FOR EACH ROW EXECUTE FUNCTION public.trigger_notificar_stock_bajo();


-- 2.4. TRIGGER: NUEVO COMPROBANTE DE PAGO (Notifica a Recepción)
CREATE OR REPLACE FUNCTION public.trigger_notificar_comprobante_pago()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notificaciones (rol_destino, titulo, mensaje, tipo, link_modulo)
  VALUES (
    'recepcion',
    'Comprobante de Pago Subido',
    'Un cliente ha subido un comprobante por valor de $' || NEW.monto || ' para su validación.',
    'pago',
    'cash'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notificar_comprobante_pago ON public.comprobantes_pago;
CREATE TRIGGER trg_notificar_comprobante_pago
AFTER INSERT ON public.comprobantes_pago
FOR EACH ROW EXECUTE FUNCTION public.trigger_notificar_comprobante_pago();
