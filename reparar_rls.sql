-- ═════════════════════════════════════════════════════════════
-- REPARACIÓN DE RLS — BOOBLEPET SPA
-- Ejecuta esto en Supabase > SQL Editor para eliminar recursiones
-- ═════════════════════════════════════════════════════════════

-- 1. Redefinir la función get_my_role de forma ultra segura y sin recursión
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
  -- Primero intentamos leer del JWT para máxima velocidad y evitar consultas
  -- Si no está, hacemos la consulta directa a perfiles (que ahora tendrá RLS plano)
  SELECT COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'role',
    (SELECT rol FROM public.perfiles WHERE id = auth.uid())
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Limpiar políticas conflictivas existentes de todas las tablas principales
DROP POLICY IF EXISTS "perfiles_select" ON public.perfiles;
DROP POLICY IF EXISTS "perfiles_insert" ON public.perfiles;
DROP POLICY IF EXISTS "perfiles_update" ON public.perfiles;

DROP POLICY IF EXISTS "mascotas_select" ON public.mascotas;
DROP POLICY IF EXISTS "mascotas_insert" ON public.mascotas;
DROP POLICY IF EXISTS "mascotas_update" ON public.mascotas;
DROP POLICY IF EXISTS "mascotas_delete" ON public.mascotas;

DROP POLICY IF EXISTS "reservas_select" ON public.reservas;
DROP POLICY IF EXISTS "reservas_insert" ON public.reservas;
DROP POLICY IF EXISTS "reservas_update" ON public.reservas;
DROP POLICY IF EXISTS "reservas_delete" ON public.reservas;

DROP POLICY IF EXISTS "citas_select" ON public.citas;
DROP POLICY IF EXISTS "citas_insert" ON public.citas;
DROP POLICY IF EXISTS "citas_update" ON public.citas;
DROP POLICY IF EXISTS "citas_delete" ON public.citas;
DROP POLICY IF EXISTS "Permitir lectura de citas según rol" ON public.citas;

DROP POLICY IF EXISTS "fichas_select" ON public.fichas_grooming;
DROP POLICY IF EXISTS "fichas_insert" ON public.fichas_grooming;
DROP POLICY IF EXISTS "fichas_update" ON public.fichas_grooming;

DROP POLICY IF EXISTS "checklist_select" ON public.checklist_seguimiento;
DROP POLICY IF EXISTS "checklist_insert" ON public.checklist_seguimiento;
DROP POLICY IF EXISTS "checklist_update" ON public.checklist_seguimiento;

DROP POLICY IF EXISTS "fotos_select" ON public.fotos_grooming;
DROP POLICY IF EXISTS "fotos_insert" ON public.fotos_grooming;
DROP POLICY IF EXISTS "fotos_update" ON public.fotos_grooming;

DROP POLICY IF EXISTS "modificadores_aplicados_select" ON public.cita_modificadores_aplicados;
DROP POLICY IF EXISTS "modificadores_aplicados_insert" ON public.cita_modificadores_aplicados;
DROP POLICY IF EXISTS "modificadores_aplicados_update" ON public.cita_modificadores_aplicados;

-- 3. Crear políticas planas (sin llamadas a get_my_role que puedan ciclarse)

-- TABLA: perfiles
CREATE POLICY "perfiles_select" ON public.perfiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "perfiles_insert" ON public.perfiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "perfiles_update" ON public.perfiles
  FOR UPDATE USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'admin'
  ));

-- TABLA: mascotas
CREATE POLICY "mascotas_select" ON public.mascotas
  FOR SELECT USING (
    dueno_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.perfiles
      WHERE id = auth.uid() AND rol IN ('admin', 'recepcion', 'groomer')
    )
  );

CREATE POLICY "mascotas_insert" ON public.mascotas
  FOR INSERT WITH CHECK (
    dueno_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.perfiles
      WHERE id = auth.uid() AND rol IN ('admin', 'recepcion')
    )
  );

CREATE POLICY "mascotas_update" ON public.mascotas
  FOR UPDATE USING (
    dueno_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.perfiles
      WHERE id = auth.uid() AND rol IN ('admin', 'recepcion')
    )
  );

CREATE POLICY "mascotas_delete" ON public.mascotas
  FOR DELETE USING (
    dueno_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.perfiles
      WHERE id = auth.uid() AND rol IN ('admin', 'recepcion')
    )
  );

-- TABLA: reservas
CREATE POLICY "reservas_select" ON public.reservas
  FOR SELECT USING (
    cliente_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.perfiles
      WHERE id = auth.uid() AND rol IN ('admin', 'recepcion')
    )
  );

CREATE POLICY "reservas_insert" ON public.reservas
  FOR INSERT WITH CHECK (
    cliente_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.perfiles
      WHERE id = auth.uid() AND rol IN ('admin', 'recepcion')
    )
  );

CREATE POLICY "reservas_update" ON public.reservas
  FOR UPDATE USING (
    cliente_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.perfiles
      WHERE id = auth.uid() AND rol IN ('admin', 'recepcion')
    )
  );

-- TABLA: citas
-- Permitimos lectura general para que el algoritmo de disponibilidad pueda cruzar horarios
CREATE POLICY "citas_select" ON public.citas
  FOR SELECT USING (true);

CREATE POLICY "citas_insert" ON public.citas
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.perfiles
      WHERE id = auth.uid() AND rol IN ('admin', 'recepcion')
    )
    OR mascota_id IN (
      SELECT id FROM public.mascotas WHERE dueno_id = auth.uid()
    )
  );

CREATE POLICY "citas_update" ON public.citas
  FOR UPDATE USING (
    groomer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.perfiles
      WHERE id = auth.uid() AND rol IN ('admin', 'recepcion')
    )
    OR mascota_id IN (
      SELECT id FROM public.mascotas WHERE dueno_id = auth.uid()
    )
  );

-- TABLA: fichas_grooming
CREATE POLICY "fichas_select" ON public.fichas_grooming
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.perfiles
      WHERE id = auth.uid() AND rol IN ('admin', 'recepcion')
    )
    OR cita_id IN (
      SELECT id FROM public.citas WHERE groomer_id = auth.uid()
    )
    OR cita_id IN (
      SELECT c.id FROM public.citas c
      JOIN public.mascotas m ON c.mascota_id = m.id
      WHERE m.dueno_id = auth.uid()
    )
  );

CREATE POLICY "fichas_insert" ON public.fichas_grooming
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.perfiles
      WHERE id = auth.uid() AND rol IN ('admin', 'recepcion', 'groomer')
    )
  );

CREATE POLICY "fichas_update" ON public.fichas_grooming
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.perfiles
      WHERE id = auth.uid() AND rol IN ('admin', 'recepcion')
    )
    OR cita_id IN (
      SELECT id FROM public.citas WHERE groomer_id = auth.uid()
    )
  );

-- 4. Reiniciar RLS para aplicar cambios de inmediato
ALTER TABLE public.perfiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.mascotas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.mascotas ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.reservas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.citas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.fichas_grooming DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fichas_grooming ENABLE ROW LEVEL SECURITY;
