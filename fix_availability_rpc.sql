CREATE OR REPLACE FUNCTION public.get_groomer_appointments_anon(p_groomer_id UUID, p_day_start TIMESTAMP WITH TIME ZONE, p_day_end TIMESTAMP WITH TIME ZONE)
RETURNS TABLE (
  fecha_hora_inicio TIMESTAMP WITH TIME ZONE,
  fecha_hora_fin TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Esta función se ejecuta con permisos elevados (SECURITY DEFINER)
  -- Permite a los clientes ver qué bloques de tiempo están ocupados sin exponer datos sensibles (nombres, mascotas).
  
  RETURN QUERY
  SELECT c.fecha_hora_inicio, c.fecha_hora_fin
  FROM public.citas c
  WHERE c.fecha_hora_inicio >= p_day_start
    AND c.fecha_hora_inicio <= p_day_end
    AND c.estado != 'cancelada'
    AND (p_groomer_id IS NULL OR c.groomer_id = p_groomer_id);
END;
$$;
