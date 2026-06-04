import { supabase } from '../../../api/supabase';

const NOT_CONFIGURED_ERROR = new Error('Supabase no está configurado');

export const getClientPets = async (clientId) => {
  if (!supabase) return { data: [], error: null };
  return supabase
    .from('mascotas')
    .select('id, nombre, especie, raza, tamano, temperamento, alergias, foto_perfil_url')
    .eq('dueno_id', clientId);
};

export const getClientAppointments = async (clientId) => {
  if (!supabase) return { data: [], error: null };
  return supabase
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
      sugerencia_groomer_id,
      sugerencia_fecha_hora_inicio,
      sugerencia_fecha_hora_fin,
      propuesta_mensaje,
      estado_propuesta,
      rechazo_mensaje,
      reserva:reservas(estado_general),
      mascota:mascotas!inner(id, nombre, raza, foto_perfil_url, dueno_id),
      servicio:servicios(id, nombre, duracion_base_minutos, precio_base),
      groomer:perfiles!citas_groomer_id_fkey(id, nombre_completo, avatar_url)
    `)
    .eq('mascotas.dueno_id', clientId)
    .order('fecha_hora_inicio', { ascending: false });
};

export const getClientAppliedModifiers = async (appointmentIds) => {
  if (!supabase || !appointmentIds.length) return { data: [], error: null };
  return supabase
    .from('cita_modificadores_aplicados')
    .select(`
      id,
      cita_id,
      modificador_id,
      precio_aplicado,
      modificador:modificadores_servicio(id, criterio, valor, tiempo_extra_minutos, precio_adicional)
    `)
    .in('cita_id', appointmentIds);
};

export const getBookingResources = async () => {
  if (!supabase) {
    return {
      services: [],
      modifiers: [],
      groomers: [],
      schedules: [],
      error: NOT_CONFIGURED_ERROR,
    };
  }

  const [servicesRes, modifiersRes, groomersRes, schedulesRes] = await Promise.all([
    supabase.from('servicios').select('*').order('nombre'),
    supabase.from('modificadores_servicio').select('*').order('criterio'),
    supabase.from('perfiles').select('id, nombre_completo, avatar_url').eq('rol', 'groomer').eq('activo', true),
    supabase.from('horarios_base_groomer').select('*')
  ]);

  return {
    services: servicesRes.data || [],
    modifiers: modifiersRes.data || [],
    groomers: groomersRes.data || [],
    schedules: schedulesRes.data || [],
    error: servicesRes.error || modifiersRes.error || groomersRes.error || schedulesRes.error || null,
  };
};

export const getClientGroomerAppointments = async (groomerId, dateStr) => {
  if (!supabase) return { data: [], error: null };
  
  // dateStr is formatted as "YYYY-MM-DD"
  // Convert to local start/end of day to match how appointments are saved
  const [year, month, day] = dateStr.split('-');
  const localStart = new Date(year, month - 1, day, 0, 0, 0);
  const localEnd = new Date(year, month - 1, day, 23, 59, 59, 999);
  
  const dayStart = localStart.toISOString();
  const dayEnd = localEnd.toISOString();

  let query = supabase
    .from('citas')
    .select('id, fecha_hora_inicio, fecha_hora_fin, estado')
    .gte('fecha_hora_inicio', dayStart)
    .lte('fecha_hora_inicio', dayEnd)
    .neq('estado', 'cancelada');

  if (groomerId && groomerId !== 'any') {
    query = query.eq('groomer_id', groomerId);
  }

  return query;
};

export const createClientBooking = async ({ clienteId, totalReserva, appointments }) => {
  if (!supabase) return { error: NOT_CONFIGURED_ERROR };

  // 1. Insert reservation
  const { data: reservaData, error: reservaError } = await supabase
    .from('reservas')
    .insert({
      cliente_id: clienteId,
      origen: 'web',
      total_reserva: totalReserva,
      estado_general: 'pendiente',
      fecha_creacion: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (reservaError) return { error: reservaError };
  const reservaId = reservaData.id;

  // 2. Insert appointments and modifiers
  for (const app of appointments) {
    const { data: citaData, error: citaError } = await supabase
      .from('citas')
      .insert({
        reserva_id: reservaId,
        mascota_id: app.mascota_id,
        groomer_id: app.groomer_id || null, // null represents "Any Available"
        servicio_id: app.servicio_id,
        fecha_hora_inicio: app.fecha_hora_inicio,
        fecha_hora_fin: app.fecha_hora_fin,
        estado: 'programada',
        notas_cliente: app.notas_cliente || '',
      })
      .select('id')
      .single();

    if (citaError) {
      console.error('[clientAgendaService] Error inserting appointment:', citaError);
      continue;
    }

    const citaId = citaData.id;

    // 3. Insert modifiers
    if (app.modifiers && app.modifiers.length > 0) {
      const modifiersPayload = app.modifiers.map((mod) => ({
        cita_id: citaId,
        modificador_id: mod.id,
        precio_aplicado: Number(mod.precio_adicional || 0),
      }));

      const { error: modError } = await supabase
        .from('cita_modificadores_aplicados')
        .insert(modifiersPayload);

      if (modError) {
        console.warn('[clientAgendaService] Error applying modifiers:', modError);
      }
    }
  }

  return { data: { reservaId }, error: null };
};

export const cancelClientAppointment = async (appointmentId) => {
  if (!supabase) return { error: NOT_CONFIGURED_ERROR };
  return supabase
    .from('citas')
    .update({ estado: 'cancelada' })
    .eq('id', appointmentId);
};

export const acceptProposal = async (appointmentId, suggestedGroomerId, suggestedFechaInicio, suggestedFechaFin) => {
  if (!supabase) return { error: NOT_CONFIGURED_ERROR };
  console.log('[clientAgendaService] acceptProposal start:', { appointmentId, suggestedGroomerId, suggestedFechaInicio, suggestedFechaFin });

  const payload = {
    estado_propuesta: 'aceptada'
  };

  if (suggestedGroomerId) payload.groomer_id = suggestedGroomerId;
  if (suggestedFechaInicio) payload.fecha_hora_inicio = suggestedFechaInicio;
  if (suggestedFechaFin) payload.fecha_hora_fin = suggestedFechaFin;

  // 1. Update groomer_id and/or date, and set estado_propuesta to 'aceptada'
  const { data, error } = await supabase
    .from('citas')
    .update(payload)
    .eq('id', appointmentId)
    .select('reserva_id')
    .single();

  if (error) {
    console.error('[clientAgendaService] acceptProposal appointment update error:', error);
    return { error };
  }
  console.log('[clientAgendaService] acceptProposal appointment update success. Reserva ID:', data?.reserva_id);

  // 2. Confirm the entire reservation
  if (data?.reserva_id) {
    const { error: resError } = await supabase
      .from('reservas')
      .update({ estado_general: 'confirmada' })
      .eq('id', data.reserva_id);

    if (resError) {
      console.error('[clientAgendaService] acceptProposal reservation update error:', resError);
      return { error: resError };
    }
    console.log('[clientAgendaService] acceptProposal reservation update success');
  }

  return { error: null };
};

export const rejectProposal = async (appointmentId) => {
  if (!supabase) return { error: NOT_CONFIGURED_ERROR };
  console.log('[clientAgendaService] rejectProposal start:', { appointmentId });

  // 1. Reject proposal and cancel appointment
  const { data, error } = await supabase
    .from('citas')
    .update({
      estado_propuesta: 'rechazada',
      estado: 'cancelada'
    })
    .eq('id', appointmentId)
    .select('reserva_id')
    .single();

  if (error) {
    console.error('[clientAgendaService] rejectProposal appointment update error:', error);
    return { error };
  }
  console.log('[clientAgendaService] rejectProposal appointment update success. Reserva ID:', data?.reserva_id);

  // 2. Cancel the reservation
  if (data?.reserva_id) {
    const { error: resError } = await supabase
      .from('reservas')
      .update({ estado_general: 'cancelada' })
      .eq('id', data.reserva_id);

    if (resError) {
      console.error('[clientAgendaService] rejectProposal reservation update error:', resError);
      return { error: resError };
    }
    console.log('[clientAgendaService] rejectProposal reservation update success');
  }

  return { error: null };
};
