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

/**
 * Agrega los pasos de un servicio adicional al checklist de seguimiento de la cita.
 */
export const addExtraServiceStepsToChecklist = async (citaId, serviceName) => {
  if (!supabase) return { error: NOT_CONFIGURED_ERROR };
  try {
    // 1. Obtener la ficha de grooming vinculada a la cita
    const { data: ficha, error: fichaError } = await supabase
      .from('fichas_grooming')
      .select('id')
      .eq('cita_id', citaId)
      .maybeSingle();

    if (fichaError) throw fichaError;
    if (!ficha) {
      console.warn(`No se encontró ficha_grooming para citaId: ${citaId}`);
      return { data: null, error: new Error('No se encontró ficha_grooming para la cita') };
    }

    const fichaId = ficha.id;

    // 2. Buscar el servicio por nombre
    const { data: servicio, error: servicioError } = await supabase
      .from('servicios')
      .select('id')
      .eq('nombre', serviceName)
      .maybeSingle();

    if (servicioError) throw servicioError;
    if (!servicio) {
      console.warn(`No se encontró servicio con nombre: ${serviceName}`);
      return { data: null, error: new Error(`No se encontró servicio: ${serviceName}`) };
    }

    // 3. Obtener los pasos de este servicio
    const { data: pasos, error: pasosError } = await supabase
      .from('pasos_servicio')
      .select('tarea_id')
      .eq('servicio_id', servicio.id)
      .order('orden', { ascending: true });

    if (pasosError) throw pasosError;
    if (!pasos || pasos.length === 0) {
      console.warn(`No hay pasos configurados para el servicio: ${serviceName}`);
      return { data: [], error: null };
    }

    // 4. Obtener el checklist existente para la ficha
    const { data: checklistExistente, error: chkError } = await supabase
      .from('checklist_seguimiento')
      .select('tarea_id')
      .eq('ficha_id', fichaId);

    if (chkError) throw chkError;
    const tareasExistentes = new Set(checklistExistente?.map(item => item.tarea_id) || []);

    // 5. Filtrar pasos que no se hayan insertado aún
    const nuevosPasos = pasos.filter(p => !tareasExistentes.has(p.tarea_id));
    if (nuevosPasos.length === 0) {
      return { data: [], error: null };
    }

    // 6. Realizar la inserción
    const inserts = nuevosPasos.map(p => ({
      ficha_id: fichaId,
      tarea_id: p.tarea_id,
      completado: false,
      observacion_item: ''
    }));

    const { data: insertedData, error: insertError } = await supabase
      .from('checklist_seguimiento')
      .insert(inserts)
      .select();

    if (insertError) throw insertError;

    return { data: insertedData, error: null };
  } catch (err) {
    console.error(`[addExtraServiceStepsToChecklist] error para ${serviceName}:`, err);
    return { data: null, error: err };
  }
};

export const approveModifier = async (modifierId) => {
  if (!supabase) return { error: NOT_CONFIGURED_ERROR };
  try {
    // 1. Obtener detalles del modificador
    const { data: appliedMod, error: getError } = await supabase
      .from('cita_modificadores_aplicados')
      .select(`
        cita_id,
        modificador:modificadores_servicio(criterio, valor)
      `)
      .eq('id', modifierId)
      .maybeSingle();

    if (getError) throw getError;
    if (!appliedMod) throw new Error('Modificador no encontrado');

    const citaId = appliedMod.cita_id;
    const isExtraService = appliedMod.modificador?.valor === 'Servicio Adicional';
    const serviceName = appliedMod.modificador?.criterio;

    // 2. Actualizar estado
    const { data, error } = await supabase
      .from('cita_modificadores_aplicados')
      .update({ estado_aprobacion: 'aprobado' })
      .eq('id', modifierId)
      .select();

    if (error) throw error;

    // 3. Añadir tareas al checklist si es servicio adicional
    if (isExtraService && serviceName) {
      await addExtraServiceStepsToChecklist(citaId, serviceName);
    }

    // 4. Enviar notificación al groomer de la cita
    const { data: cita } = await supabase
      .from('citas')
      .select('groomer_id, mascota:mascotas(nombre)')
      .eq('id', citaId)
      .maybeSingle();

    if (cita?.groomer_id) {
      const mascotaNombre = cita.mascota?.nombre || 'la mascota';
      await supabase
        .from('notificaciones')
        .insert({
          usuario_id: cita.groomer_id,
          rol_destino: 'groomer',
          titulo: 'Servicio Adicional Aprobado',
          mensaje: `El cliente aprobó "${serviceName}" para ${mascotaNombre}. Se añadieron las tareas al checklist.`,
          tipo: 'ficha',
          link_modulo: '/groomer/agenda'
        });
    }

    return { data, error: null };
  } catch (err) {
    console.error('[clientTrackingService] approveModifier error:', err);
    return { error: err };
  }
};

export const rejectModifier = async (modifierId) => {
  if (!supabase) return { error: NOT_CONFIGURED_ERROR };
  try {
    // 1. Obtener detalles del modificador
    const { data: appliedMod, error: getError } = await supabase
      .from('cita_modificadores_aplicados')
      .select(`
        cita_id,
        modificador:modificadores_servicio(criterio)
      `)
      .eq('id', modifierId)
      .maybeSingle();

    if (getError) throw getError;
    if (!appliedMod) throw new Error('Modificador no encontrado');

    const citaId = appliedMod.cita_id;
    const serviceName = appliedMod.modificador?.criterio;

    // 2. Actualizar estado
    const { data, error } = await supabase
      .from('cita_modificadores_aplicados')
      .update({ estado_aprobacion: 'rechazado' })
      .eq('id', modifierId)
      .select();

    if (error) throw error;

    // 3. Enviar notificación al groomer de la cita
    const { data: cita } = await supabase
      .from('citas')
      .select('groomer_id, mascota:mascotas(nombre)')
      .eq('id', citaId)
      .maybeSingle();

    if (cita?.groomer_id) {
      const mascotaNombre = cita.mascota?.nombre || 'la mascota';
      await supabase
        .from('notificaciones')
        .insert({
          usuario_id: cita.groomer_id,
          rol_destino: 'groomer',
          titulo: 'Servicio Adicional Rechazado',
          mensaje: `El cliente rechazó "${serviceName}" para ${mascotaNombre}.`,
          tipo: 'ficha',
          link_modulo: '/groomer/agenda'
        });
    }

    return { data, error: null };
  } catch (err) {
    console.error('[clientTrackingService] rejectModifier error:', err);
    return { error: err };
  }
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
