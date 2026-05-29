import { supabase } from '../../../api/supabase';

const NOT_CONFIGURED_ERROR = new Error('Supabase no está configurado');

export const getClientLoyaltyPoints = async (clientId) => {
  if (!supabase) return { data: 0, error: null };
  try {
    const { data, error } = await supabase
      .from('datos_clientes')
      .select('puntos_lealtad')
      .eq('perfil_id', clientId)
      .maybeSingle();
    return { data: data?.puntos_lealtad || 0, error };
  } catch (err) {
    console.error('[clientTrackingService] getClientLoyaltyPoints error:', err);
    return { data: 0, error: err };
  }
};

export const getActiveTrackingAppointment = async (clientId) => {
  if (!supabase) return { data: null, error: null };
  try {
    const { data, error } = await supabase
      .from('citas')
      .select(`
        id,
        reserva_id,
        mascota_id,
        groomer_id,
        servicio_id,
        fecha_hora_inicio,
        fecha_hora_fin,
        estado,
        notas_cliente,
        mascota:mascotas!inner(id, nombre, raza, foto_perfil_url, dueno_id),
        servicio:servicios(id, nombre, duracion_base_minutos, precio_base),
        groomer:perfiles!citas_groomer_id_fkey(id, nombre_completo, avatar_url),
        ficha:fichas_grooming(
          id,
          nivel_suciedad,
          estado_ingreso_nudos,
          estado_ingreso_pulgas,
          estado_ingreso_heridas,
          temperamento_actual,
          peso_actual,
          observaciones_groomer,
          recomendaciones_post,
          fotos:fotos_grooming(id, url_foto, tipo_momento)
        ),
        encuesta:encuestas_satisfaccion(id)
      `)
      .eq('mascotas.dueno_id', clientId)
      .in('estado', ['en_proceso', 'pausada', 'completada'])
      .order('fecha_hora_inicio', { ascending: false });

    if (error) return { data: null, error };
    if (!data || data.length === 0) return { data: null, error: null };

    // Filtrar citas completadas que ya tengan una encuesta de satisfacción
    const activeCita = data.find((cita) => {
      if (cita.estado === 'completada' && cita.encuesta) {
        return false;
      }
      return true;
    });

    return { data: activeCita || null, error: null };
  } catch (err) {
    console.error('[clientTrackingService] getActiveTrackingAppointment error:', err);
    return { data: null, error: err };
  }
};

export const getChecklistForFicha = async (fichaId) => {
  if (!supabase) return { data: [], error: null };
  return supabase
    .from('checklist_seguimiento')
    .select(`
      id,
      ficha_id,
      tarea_id,
      completado,
      observacion_item,
      tarea:tareas_disponibles(id, nombre)
    `)
    .eq('ficha_id', fichaId);
};

export const getPasosServicio = async (servicioId) => {
  if (!supabase) return { data: [], error: null };
  return supabase
    .from('pasos_servicio')
    .select('id, servicio_id, tarea_id, orden')
    .eq('servicio_id', servicioId)
    .order('orden', { ascending: true });
};

export const getPendingModifiers = async (citaId) => {
  if (!supabase) return { data: [], error: null };
  return supabase
    .from('cita_modificadores_aplicados')
    .select(`
      id,
      cita_id,
      modificador_id,
      precio_aplicado,
      url_evidencia,
      concepto_snap,
      estado_aprobacion,
      modificador:modificadores_servicio(id, criterio, valor, tiempo_extra_minutos, precio_adicional)
    `)
    .eq('cita_id', citaId)
    .eq('estado_aprobacion', 'pendiente');
};

export const approveModifier = async (modifierId) => {
  if (!supabase) return { error: NOT_CONFIGURED_ERROR };
  return supabase
    .from('cita_modificadores_aplicados')
    .update({ estado_aprobacion: 'aprobado' })
    .eq('id', modifierId);
};

export const rejectModifier = async (modifierId) => {
  if (!supabase) return { error: NOT_CONFIGURED_ERROR };
  return supabase
    .from('cita_modificadores_aplicados')
    .update({ estado_aprobacion: 'rechazado' })
    .eq('id', modifierId);
};

export const createAuditLog = async (clientId, actionText) => {
  if (!supabase) return { error: NOT_CONFIGURED_ERROR };
  return supabase
    .from('logs_auditoria')
    .insert({
      perfil_id: clientId,
      rol: 'cliente',
      accion: actionText,
      fecha: new Date().toISOString()
    });
};

export const submitSatisfactionSurvey = async (citaId, score, comment) => {
  if (!supabase) return { error: NOT_CONFIGURED_ERROR };
  return supabase
    .from('encuestas_satisfaccion')
    .insert({
      cita_id: citaId,
      puntuacion_nps: score,
      comentario: comment
    });
};
