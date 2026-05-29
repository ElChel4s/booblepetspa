-- ══════════════════════════════════════════════════════════════════════════════
-- PASO PREVIO OBLIGATORIO: CORREGIR EL TRIGGER DEL CHECKLIST
-- Ejecuta este bloque PRIMERO, antes del script de simulación.
--
-- PROBLEMA: El trigger generar_checklist_desde_pasos() intenta leer
--           NEW.servicio_id, pero fichas_grooming NO tiene ese campo —
--           solo tiene cita_id. Necesita hacer un JOIN a través de citas.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.generar_checklist_desde_pasos()
RETURNS TRIGGER AS $$
DECLARE
  v_servicio_id uuid;
  v_tarea_id    uuid;
BEGIN
  -- 1. Obtener el servicio_id desde la cita asociada a esta ficha
  SELECT servicio_id
    INTO v_servicio_id
    FROM public.citas
   WHERE id = NEW.cita_id;

  -- 2. Si la cita tiene servicio con pasos definidos, generar el checklist
  IF v_servicio_id IS NOT NULL THEN
    FOR v_tarea_id IN
      SELECT tarea_id
        FROM public.pasos_servicio
       WHERE servicio_id = v_servicio_id
       ORDER BY orden ASC
    LOOP
      INSERT INTO public.checklist_seguimiento (ficha_id, tarea_id, completado)
      VALUES (NEW.id, v_tarea_id, false);
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recrear el trigger de forma limpia y eliminar cualquier trigger duplicado previo
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT trigger_name 
    FROM information_schema.triggers 
    WHERE event_object_table = 'fichas_grooming' 
      AND trigger_schema = 'public'
  LOOP
    EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || ' ON public.fichas_grooming;';
  END LOOP;
END $$;

CREATE TRIGGER trg_generar_checklist
  AFTER INSERT ON public.fichas_grooming
  FOR EACH ROW
  EXECUTE FUNCTION public.generar_checklist_desde_pasos();
