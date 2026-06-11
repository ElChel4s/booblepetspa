import { supabase } from '../../../api/supabase';

/**
 * Citas activas (en_proceso / en_espera) con datos de mascota y groomer.
 * Tabla: citas JOIN mascotas JOIN perfiles (groomer)
 */
export const getActiveCitas = async (date) => {
  if (!supabase) return { data: [], error: null };
  const query = supabase
    .from('citas')
    .select(`
      id,
      groomer_id,
      fecha_hora_inicio,
      fecha_hora_fin,
      estado,
      mascota:mascotas(id, nombre, raza, especie, foto_perfil_url),
      groomer:perfiles!citas_groomer_id_fkey(id, nombre_completo, avatar_url),
      ficha:fichas_grooming(
        id,
        nivel_suciedad,
        estado_ingreso_nudos,
        estado_ingreso_pulgas,
        estado_ingreso_heridas,
        observaciones_groomer,
        fotos:fotos_grooming(id, url_foto),
        checklist:checklist_seguimiento(
          id,
          completado
        )
      )
    `)
    .in('estado', ['en_proceso', 'en_espera', 'programada']);

  if (date) {
    const dayStart = new Date(date + 'T00:00:00');
    const dayEnd = new Date(date + 'T23:59:59.999');
    query.gte('fecha_hora_inicio', dayStart.toISOString())
         .lte('fecha_hora_inicio', dayEnd.toISOString());
  }

  return query.order('fecha_hora_inicio', { ascending: true });
};

/**
 * Groomers activos del día.
 */
export const getActiveGroomers = async () => {
  if (!supabase) return { data: [], error: null };
  return supabase
    .from('perfiles')
    .select('id, nombre_completo, avatar_url')
    .eq('rol', 'groomer')
    .eq('activo', true)
    .order('nombre_completo');
};

/**
 * Ficha de grooming para una cita + checklist de seguimiento.
 */
export const getFichaGrooming = async (citaId) => {
  if (!supabase) return { data: null, error: null };
  return supabase
    .from('fichas_grooming')
    .select(`
      id,
      cita_id,
      nivel_suciedad,
      estado_ingreso_nudos,
      estado_ingreso_pulgas,
      estado_ingreso_heridas,
      temperamento_actual,
      peso_actual,
      observaciones_groomer,
      recomendaciones_post,
      finalizado_at,
      fotos:fotos_grooming(id, url_foto, tipo_momento),
      checklist:checklist_seguimiento(
        id,
        completado,
        observacion_item,
        tarea:tareas_disponibles(nombre)
      )
    `)
    .eq('cita_id', citaId)
    .maybeSingle();
};

/**
 * Citas completadas hoy para el panel de Control de Calidad.
 */
export const getCompletedTodayCitas = async (date) => {
  if (!supabase) return { data: [], error: null };
  
  const targetDate = date ? new Date(date + 'T00:00:00') : new Date();
  const dayStart = new Date(targetDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(targetDate);
  dayEnd.setHours(23, 59, 59, 999);

  return supabase
    .from('citas')
    .select(`
      id,
      groomer_id,
      fecha_hora_inicio,
      fecha_hora_fin,
      mascota:mascotas(nombre, raza, foto_perfil_url),
      groomer:perfiles!citas_groomer_id_fkey(nombre_completo)
    `)
    .eq('estado', 'completada')
    .gte('fecha_hora_fin', dayStart.toISOString())
    .lte('fecha_hora_fin', dayEnd.toISOString())
    .order('fecha_hora_fin', { ascending: false });
};

/**
 * Reasignar cita a otro groomer (drag & drop).
 */
export const reassignCita = async (citaId, newGroomerId) => {
  if (!supabase) return { error: null };
  return supabase
    .from('citas')
    .update({ groomer_id: newGroomerId })
    .eq('id', citaId);
};

/**
 * Aprueba una alerta de triage (nudos/pulgas/heridas).
 * Busca el modificador correspondiente en modificadores_servicio y lo aplica a la cita.
 */
export const approveTriageAlert = async (citaId, tipoAlert, precioSugerido = 50) => {
  if (!supabase) return { error: null };

  // 1. Intentar buscar un modificador existente para este tipo (ej: criterio = 'nudos' o 'pulgas')
  const { data: modifier } = await supabase
    .from('modificadores_servicio')
    .select('id, precio_adicional')
    .ilike('criterio', `%${tipoAlert}%`)
    .limit(1)
    .maybeSingle();

  let modifierId;
  let precio = precioSugerido;

  if (modifier) {
    modifierId = modifier.id;
    precio = Number(modifier.precio_adicional || precioSugerido);
  } else {
    // Si no existe, buscamos el primer modificador disponible
    const { data: firstMod } = await supabase
      .from('modificadores_servicio')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (firstMod) {
      modifierId = firstMod.id;
    }
  }

  if (!modifierId) {
    return { error: new Error('No se encontró ningún modificador configurado en la base de datos') };
  }

  // 2. Insertar en cita_modificadores_aplicados
  const { error: insertError } = await supabase
    .from('cita_modificadores_aplicados')
    .insert({
      cita_id: citaId,
      modificador_id: modifierId,
      precio_aplicado: precio,
      estado_aprobacion: 'aprobado',
    });

  if (insertError) return { error: insertError };

  // 3. Limpiar el flag en fichas_grooming para que no vuelva a aparecer en el triage
  const updatePayload = {};
  if (tipoAlert === 'nudos') updatePayload.estado_ingreso_nudos = false;
  if (tipoAlert === 'pulgas') updatePayload.estado_ingreso_pulgas = false;
  if (tipoAlert === 'heridas') updatePayload.estado_ingreso_heridas = false;

  const { error: updateError } = await supabase
    .from('fichas_grooming')
    .update(updatePayload)
    .eq('cita_id', citaId);

  return { error: updateError };
};
