-- ═══════════════════════════════════════════════════════════
-- SCRIPT RLS COMPLETO — Booblepet Spa
-- Ejecutar en Supabase > SQL Editor
-- Última revisión: 2026-05-29
-- ═══════════════════════════════════════════════════════════

-- PASO 0: Función helper para obtener el rol del usuario actual
-- (Ya debes tenerla, pero la incluimos para asegurarnos)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
  SELECT rol FROM public.perfiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════
-- TABLA: perfiles
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "perfiles_select" ON public.perfiles;
CREATE POLICY "perfiles_select" ON public.perfiles
  FOR SELECT USING (
    -- Admins y recepción ven todos los perfiles
    get_my_role() IN ('admin', 'recepcion')
    OR
    -- Groomers se ven a sí mismos y a los clientes
    (get_my_role() = 'groomer' AND (id = auth.uid() OR rol = 'cliente'))
    OR
    -- Clientes solo se ven a sí mismos
    id = auth.uid()
  );

DROP POLICY IF EXISTS "perfiles_update" ON public.perfiles;
CREATE POLICY "perfiles_update" ON public.perfiles
  FOR UPDATE USING (
    get_my_role() IN ('admin', 'recepcion')
    OR id = auth.uid()
  );

DROP POLICY IF EXISTS "perfiles_insert" ON public.perfiles;
CREATE POLICY "perfiles_insert" ON public.perfiles
  FOR INSERT WITH CHECK (
    get_my_role() IN ('admin', 'recepcion')
    OR id = auth.uid()
  );

-- ═══════════════════════════════════════════════════════════
-- TABLA: mascotas
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.mascotas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mascotas_select" ON public.mascotas;
CREATE POLICY "mascotas_select" ON public.mascotas
  FOR SELECT USING (
    get_my_role() IN ('admin', 'recepcion', 'groomer')
    OR dueno_id = auth.uid()
  );

DROP POLICY IF EXISTS "mascotas_insert" ON public.mascotas;
CREATE POLICY "mascotas_insert" ON public.mascotas
  FOR INSERT WITH CHECK (
    get_my_role() IN ('admin', 'recepcion')
    OR dueno_id = auth.uid()
  );

DROP POLICY IF EXISTS "mascotas_update" ON public.mascotas;
CREATE POLICY "mascotas_update" ON public.mascotas
  FOR UPDATE USING (
    get_my_role() IN ('admin', 'recepcion')
    OR dueno_id = auth.uid()
  );

-- ═══════════════════════════════════════════════════════════
-- TABLA: servicios
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.servicios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "servicios_select_all" ON public.servicios;
CREATE POLICY "servicios_select_all" ON public.servicios
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "servicios_manage" ON public.servicios;
CREATE POLICY "servicios_manage" ON public.servicios
  FOR ALL USING (get_my_role() IN ('admin', 'recepcion'));

-- ═══════════════════════════════════════════════════════════
-- TABLA: modificadores_servicio
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.modificadores_servicio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "modificadores_select_all" ON public.modificadores_servicio;
CREATE POLICY "modificadores_select_all" ON public.modificadores_servicio
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "modificadores_manage" ON public.modificadores_servicio;
CREATE POLICY "modificadores_manage" ON public.modificadores_servicio
  FOR ALL USING (get_my_role() IN ('admin', 'recepcion'));

-- ═══════════════════════════════════════════════════════════
-- TABLA: reservas
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reservas_select" ON public.reservas;
CREATE POLICY "reservas_select" ON public.reservas
  FOR SELECT USING (
    get_my_role() IN ('admin', 'recepcion')
    OR cliente_id = auth.uid()
  );

DROP POLICY IF EXISTS "reservas_insert" ON public.reservas;
CREATE POLICY "reservas_insert" ON public.reservas
  FOR INSERT WITH CHECK (
    get_my_role() IN ('admin', 'recepcion')
    OR cliente_id = auth.uid()
  );

DROP POLICY IF EXISTS "reservas_update" ON public.reservas;
CREATE POLICY "reservas_update" ON public.reservas
  FOR UPDATE USING (
    get_my_role() IN ('admin', 'recepcion')
    OR cliente_id = auth.uid()
  );

-- ═══════════════════════════════════════════════════════════
-- TABLA: citas
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "citas_select" ON public.citas;
CREATE POLICY "citas_select" ON public.citas
  FOR SELECT USING (
    get_my_role() IN ('admin', 'recepcion')
    OR groomer_id = auth.uid()
    OR mascota_id IN (SELECT id FROM public.mascotas WHERE dueno_id = auth.uid())
  );

DROP POLICY IF EXISTS "citas_insert" ON public.citas;
CREATE POLICY "citas_insert" ON public.citas
  FOR INSERT WITH CHECK (
    get_my_role() IN ('admin', 'recepcion')
    OR mascota_id IN (SELECT id FROM public.mascotas WHERE dueno_id = auth.uid())
  );

DROP POLICY IF EXISTS "citas_update" ON public.citas;
CREATE POLICY "citas_update" ON public.citas
  FOR UPDATE USING (
    get_my_role() IN ('admin', 'recepcion')
    OR groomer_id = auth.uid()
    OR mascota_id IN (SELECT id FROM public.mascotas WHERE dueno_id = auth.uid())
  );

-- ═══════════════════════════════════════════════════════════
-- TABLA: fichas_grooming
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.fichas_grooming ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fichas_select" ON public.fichas_grooming;
CREATE POLICY "fichas_select" ON public.fichas_grooming
  FOR SELECT USING (
    get_my_role() IN ('admin', 'recepcion')
    OR cita_id IN (
      SELECT id FROM public.citas WHERE groomer_id = auth.uid()
    )
    OR cita_id IN (
      SELECT c.id FROM public.citas c
      JOIN public.mascotas m ON c.mascota_id = m.id
      WHERE m.dueno_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "fichas_insert" ON public.fichas_grooming;
CREATE POLICY "fichas_insert" ON public.fichas_grooming
  FOR INSERT WITH CHECK (
    get_my_role() IN ('admin', 'recepcion', 'groomer')
  );

DROP POLICY IF EXISTS "fichas_update" ON public.fichas_grooming;
CREATE POLICY "fichas_update" ON public.fichas_grooming
  FOR UPDATE USING (
    get_my_role() IN ('admin', 'recepcion')
    OR cita_id IN (
      SELECT id FROM public.citas WHERE groomer_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════
-- TABLA: checklist_seguimiento
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.checklist_seguimiento ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "checklist_select" ON public.checklist_seguimiento;
CREATE POLICY "checklist_select" ON public.checklist_seguimiento
  FOR SELECT USING (
    get_my_role() IN ('admin', 'recepcion', 'groomer')
    OR ficha_id IN (
      SELECT fg.id FROM public.fichas_grooming fg
      JOIN public.citas c ON fg.cita_id = c.id
      JOIN public.mascotas m ON c.mascota_id = m.id
      WHERE m.dueno_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "checklist_manage" ON public.checklist_seguimiento;
CREATE POLICY "checklist_manage" ON public.checklist_seguimiento
  FOR ALL USING (get_my_role() IN ('admin', 'recepcion', 'groomer'));

-- ═══════════════════════════════════════════════════════════
-- TABLA: fotos_grooming
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.fotos_grooming ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fotos_select" ON public.fotos_grooming;
CREATE POLICY "fotos_select" ON public.fotos_grooming
  FOR SELECT USING (
    get_my_role() IN ('admin', 'recepcion', 'groomer')
    OR ficha_id IN (
      SELECT fg.id FROM public.fichas_grooming fg
      JOIN public.citas c ON fg.cita_id = c.id
      JOIN public.mascotas m ON c.mascota_id = m.id
      WHERE m.dueno_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "fotos_manage" ON public.fotos_grooming;
CREATE POLICY "fotos_manage" ON public.fotos_grooming
  FOR ALL USING (get_my_role() IN ('admin', 'recepcion', 'groomer'));

-- ═══════════════════════════════════════════════════════════
-- TABLA: cita_modificadores_aplicados
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.cita_modificadores_aplicados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "modificadores_aplicados_select" ON public.cita_modificadores_aplicados;
CREATE POLICY "modificadores_aplicados_select" ON public.cita_modificadores_aplicados
  FOR SELECT USING (
    get_my_role() IN ('admin', 'recepcion', 'groomer')
    OR cita_id IN (
      SELECT c.id FROM public.citas c
      JOIN public.mascotas m ON c.mascota_id = m.id
      WHERE m.dueno_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "modificadores_aplicados_manage" ON public.cita_modificadores_aplicados;
CREATE POLICY "modificadores_aplicados_manage" ON public.cita_modificadores_aplicados
  FOR ALL USING (get_my_role() IN ('admin', 'recepcion', 'groomer'));

-- ═══════════════════════════════════════════════════════════
-- TABLA: encuestas_satisfaccion
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.encuestas_satisfaccion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "encuestas_select" ON public.encuestas_satisfaccion;
CREATE POLICY "encuestas_select" ON public.encuestas_satisfaccion
  FOR SELECT USING (
    get_my_role() IN ('admin', 'recepcion')
    OR cita_id IN (
      SELECT c.id FROM public.citas c
      JOIN public.mascotas m ON c.mascota_id = m.id
      WHERE m.dueno_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "encuestas_insert" ON public.encuestas_satisfaccion;
CREATE POLICY "encuestas_insert" ON public.encuestas_satisfaccion
  FOR INSERT WITH CHECK (
    cita_id IN (
      SELECT c.id FROM public.citas c
      JOIN public.mascotas m ON c.mascota_id = m.id
      WHERE m.dueno_id = auth.uid()
    )
    OR get_my_role() IN ('admin', 'recepcion')
  );

-- ═══════════════════════════════════════════════════════════
-- TABLA: productos (inventario)
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "productos_select_authed" ON public.productos;
CREATE POLICY "productos_select_authed" ON public.productos
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "productos_manage" ON public.productos;
CREATE POLICY "productos_manage" ON public.productos
  FOR ALL USING (get_my_role() IN ('admin', 'recepcion'));

DROP POLICY IF EXISTS "productos_groomer_update_stock" ON public.productos;
CREATE POLICY "productos_groomer_update_stock" ON public.productos
  FOR UPDATE USING (
    get_my_role() = 'groomer' AND es_insumo = true
  );

-- ═══════════════════════════════════════════════════════════
-- TABLA: retiros_insumo
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.retiros_insumo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "retiros_select" ON public.retiros_insumo;
CREATE POLICY "retiros_select" ON public.retiros_insumo
  FOR SELECT USING (
    get_my_role() IN ('admin', 'recepcion')
    OR groomer_id = auth.uid()
  );

DROP POLICY IF EXISTS "retiros_insert" ON public.retiros_insumo;
CREATE POLICY "retiros_insert" ON public.retiros_insumo
  FOR INSERT WITH CHECK (
    get_my_role() IN ('admin', 'recepcion', 'groomer')
  );

-- ═══════════════════════════════════════════════════════════
-- TABLA: facturas y pagos (solo admin/recepcion)
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "facturas_select" ON public.facturas;
CREATE POLICY "facturas_select" ON public.facturas
  FOR SELECT USING (
    get_my_role() IN ('admin', 'recepcion')
    OR cliente_id = auth.uid()
  );

DROP POLICY IF EXISTS "facturas_manage" ON public.facturas;
CREATE POLICY "facturas_manage" ON public.facturas
  FOR ALL USING (get_my_role() IN ('admin', 'recepcion'));

ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pagos_manage" ON public.pagos;
CREATE POLICY "pagos_manage" ON public.pagos
  FOR ALL USING (get_my_role() IN ('admin', 'recepcion'));

-- ═══════════════════════════════════════════════════════════
-- TABLA: horarios_base_groomer
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.horarios_base_groomer ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "horarios_select_authed" ON public.horarios_base_groomer;
CREATE POLICY "horarios_select_authed" ON public.horarios_base_groomer
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "horarios_manage" ON public.horarios_base_groomer;
CREATE POLICY "horarios_manage" ON public.horarios_base_groomer
  FOR ALL USING (get_my_role() IN ('admin', 'recepcion'));

-- ═══════════════════════════════════════════════════════════
-- TABLA: excepciones_agenda
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.excepciones_agenda ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "excepciones_select_authed" ON public.excepciones_agenda;
CREATE POLICY "excepciones_select_authed" ON public.excepciones_agenda
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "excepciones_manage" ON public.excepciones_agenda;
CREATE POLICY "excepciones_manage" ON public.excepciones_agenda
  FOR ALL USING (get_my_role() IN ('admin', 'recepcion'));

-- ═══════════════════════════════════════════════════════════
-- TABLA: pasos_servicio y tareas_disponibles (solo lectura para todos)
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.pasos_servicio ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pasos_select_authed" ON public.pasos_servicio;
CREATE POLICY "pasos_select_authed" ON public.pasos_servicio
  FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "pasos_manage" ON public.pasos_servicio;
CREATE POLICY "pasos_manage" ON public.pasos_servicio
  FOR ALL USING (get_my_role() IN ('admin', 'recepcion'));

ALTER TABLE public.tareas_disponibles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tareas_select_authed" ON public.tareas_disponibles;
CREATE POLICY "tareas_select_authed" ON public.tareas_disponibles
  FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "tareas_manage" ON public.tareas_disponibles;
CREATE POLICY "tareas_manage" ON public.tareas_disponibles
  FOR ALL USING (get_my_role() IN ('admin', 'recepcion'));

-- ═══════════════════════════════════════════════════════════
-- TABLA: logs_auditoria
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.logs_auditoria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "logs_select" ON public.logs_auditoria;
CREATE POLICY "logs_select" ON public.logs_auditoria
  FOR SELECT USING (get_my_role() IN ('admin'));

DROP POLICY IF EXISTS "logs_insert" ON public.logs_auditoria;
CREATE POLICY "logs_insert" ON public.logs_auditoria
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ═══════════════════════════════════════════════════════════
-- TABLA: datos_clientes
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.datos_clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "datos_clientes_select" ON public.datos_clientes;
CREATE POLICY "datos_clientes_select" ON public.datos_clientes
  FOR SELECT USING (
    get_my_role() IN ('admin', 'recepcion')
    OR perfil_id = auth.uid()
  );

DROP POLICY IF EXISTS "datos_clientes_manage" ON public.datos_clientes;
CREATE POLICY "datos_clientes_manage" ON public.datos_clientes
  FOR ALL USING (
    get_my_role() IN ('admin', 'recepcion')
    OR perfil_id = auth.uid()
  );

-- ═══════════════════════════════════════════════════════════
-- TABLA: datos_groomers
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.datos_groomers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "datos_groomers_select" ON public.datos_groomers;
CREATE POLICY "datos_groomers_select" ON public.datos_groomers
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "datos_groomers_manage" ON public.datos_groomers;
CREATE POLICY "datos_groomers_manage" ON public.datos_groomers
  FOR ALL USING (
    get_my_role() IN ('admin', 'recepcion')
    OR perfil_id = auth.uid()
  );

-- ═══════════════════════════════════════════════════════════
-- VERIFICACIÓN: Cómo ver RLS activo en Supabase
-- ═══════════════════════════════════════════════════════════
-- Para ver todas las políticas activas:
-- SELECT tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

-- Para verificar qué tablas tienen RLS habilitado:
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;
