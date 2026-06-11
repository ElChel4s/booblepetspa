import { supabase } from '../../../api/supabase';

const FALLBACK_GROOMERS = [
  { id: 'g1', nombre_completo: 'Elena Silva', avatar_url: '', rol: 'groomer', activo: true },
  { id: 'g2', nombre_completo: 'Carlos R.', avatar_url: '', rol: 'groomer', activo: true },
];

const FALLBACK_SERVICES = [
  { id: 's1', nombre: 'Baño Premium', duracion_base_minutos: 60, precio_base: 85, categoria: 'Spa', icon_name: 'Scissors' },
  { id: 's2', nombre: 'Corte de Raza', duracion_base_minutos: 90, precio_base: 120, categoria: 'Corte', icon_name: 'Scissors' },
];

const FALLBACK_MODIFIERS = [
  { id: 'm1', servicio_id: 's1', criterio: 'Grande', valor: 'Tamaño', tiempo_extra_minutos: 30, precio_adicional: 50, precio_es_porcentaje: false, tiempo_es_porcentaje: false, icon_name: 'Ruler' },
  { id: 'm2', servicio_id: null, criterio: 'Muy nervioso', valor: 'Comportamiento', tiempo_extra_minutos: 20, precio_adicional: 25, precio_es_porcentaje: false, tiempo_es_porcentaje: false, icon_name: 'ShieldAlert' },
];

const FALLBACK_SCHEDULES = [
  { id: 'h1', groomer_id: 'g1', dia_semana: 1, hora_inicio: '08:00', hora_fin: '12:00' },
  { id: 'h2', groomer_id: 'g1', dia_semana: 1, hora_inicio: '14:00', hora_fin: '18:00' },
  { id: 'h3', groomer_id: 'g2', dia_semana: 1, hora_inicio: '09:00', hora_fin: '13:00' },
  { id: 'h4', groomer_id: 'g2', dia_semana: 1, hora_inicio: '14:00', hora_fin: '18:00' },
];

const FALLBACK_EXCEPTIONS = [
  { id: 'e1', tipo: 'general', groomer_id: null, fecha_efectiva: getTodayISODate(), todo_el_dia: true, hora_inicio: null, hora_fin: null, motivo: 'Mantenimiento', detalle_opcional: 'Limpieza profunda del local', nombre_completo: null },
  { id: 'e2', tipo: 'staff', groomer_id: 'g2', fecha_efectiva: getTodayISODate(), todo_el_dia: true, hora_inicio: null, hora_fin: null, motivo: 'Vacaciones', detalle_opcional: 'Permiso médico', nombre_completo: 'Carlos R.' },
];

const FALLBACK_APPOINTMENTS = [
  { id: 'c1', reserva_id: 'r1', mascota_id: 'p1', mascota_nombre: 'Killer', groomer_id: 'g1', servicio_id: 's1', fecha_hora_inicio: `${getTodayISODate()}T09:00:00Z`, fecha_hora_fin: `${getTodayISODate()}T10:00:00Z`, estado: 'programada', notas_cliente: 'No usar fragancias' },
  { id: 'c2', reserva_id: 'r1', mascota_id: 'p2', mascota_nombre: 'Luna', groomer_id: 'g2', servicio_id: 's2', fecha_hora_inicio: `${getTodayISODate()}T10:00:00Z`, fecha_hora_fin: `${getTodayISODate()}T11:30:00Z`, estado: 'en_espera', notas_cliente: 'Agresiva' },
];

const FALLBACK_RESERVATIONS = [
  { id: 'r1', cliente_id: 'u1', fecha_creacion: new Date().toISOString(), estado_general: 'pendiente', total_reserva: 205 },
];

export function getTodayISODate() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const startOfDayISO = (date) => {
  return new Date(`${date}T00:00:00`).toISOString();
};
const endOfDayISO = (date) => {
  return new Date(`${date}T23:59:59.999`).toISOString();
};

const safeArray = (value) => (Array.isArray(value) ? value : []);

const mapById = (items) => new Map((items || []).map((item) => [item.id, item]));

const scopeGroomerQuery = (query, role, userId) => {
  if (role === 'groomer' && userId) {
    return query.eq('groomer_id', userId);
  }

  return query;
};

const scopeGroomerExceptionsQuery = (query, role, userId) => {
  if (role === 'groomer' && userId) {
    return query.or(`groomer_id.eq.${userId},groomer_id.is.null`);
  }

  return query;
};

const buildFallback = (date) => ({
  services: FALLBACK_SERVICES,
  modifiers: FALLBACK_MODIFIERS,
  groomers: FALLBACK_GROOMERS,
  schedules: FALLBACK_SCHEDULES,
  exceptions: FALLBACK_EXCEPTIONS.filter((item) => item.fecha_efectiva === date),
  appointments: FALLBACK_APPOINTMENTS.map((item) => ({ ...item, fecha_hora_inicio: item.fecha_hora_inicio.replace(getTodayISODate(), date), fecha_hora_fin: item.fecha_hora_fin.replace(getTodayISODate(), date) })),
  reservations: FALLBACK_RESERVATIONS,
});

export const loadAgendaData = async ({ role, userId, date }) => {
  if (!supabase) {
    return { data: buildFallback(date), error: null };
  }

  const dayStart = startOfDayISO(date);
  const dayEnd = endOfDayISO(date);

  const dateObj = new Date(date + 'T12:00:00');
  const y = dateObj.getFullYear();
  const m = dateObj.getMonth();
  const startOfMonth = `${y}-${String(m + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(y, m + 1, 0).getDate();
  const endOfMonth = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const [servicesRes, modifiersRes, groomersRes, schedulesRes, exceptionsRes, appointmentsRes, reservationsRes] = await Promise.all([
    supabase.from('servicios').select('id, nombre, duracion_base_minutos, precio_base, categoria, icon_name').order('nombre', { ascending: true }),
    supabase.from('modificadores_servicio').select('id, servicio_id, criterio, valor, tiempo_extra_minutos, precio_adicional, precio_es_porcentaje, tiempo_es_porcentaje, icon_name').order('criterio', { ascending: true }),
    supabase.from('perfiles').select('id, nombre_completo, avatar_url, activo, rol').eq('rol', 'groomer').eq('activo', true).order('nombre_completo', { ascending: true }),
    scopeGroomerQuery(supabase.from('horarios_base_groomer').select('id, groomer_id, dia_semana, hora_inicio, hora_fin').order('dia_semana', { ascending: true }), role, userId),
    scopeGroomerExceptionsQuery(supabase.from('excepciones_agenda').select('id, tipo, groomer_id, fecha_efectiva, todo_el_dia, hora_inicio, hora_fin, motivo, detalle_opcional').gte('fecha_efectiva', startOfMonth).lte('fecha_efectiva', endOfMonth).order('tipo', { ascending: true }), role, userId),
    scopeGroomerQuery(supabase.from('citas').select('id, reserva_id, mascota_id, groomer_id, servicio_id, fecha_hora_inicio, fecha_hora_fin, estado, notas_cliente, sugerencia_groomer_id, sugerencia_fecha_hora_inicio, sugerencia_fecha_hora_fin, propuesta_mensaje, estado_propuesta, rechazo_mensaje').gte('fecha_hora_inicio', dayStart).lte('fecha_hora_inicio', dayEnd).order('fecha_hora_inicio', { ascending: true }), role, userId),
    supabase.from('reservas').select('id, cliente_id, fecha_creacion, estado_general, total_reserva, nombre_invitado, telefono_invitado').gte('fecha_creacion', dayStart).lte('fecha_creacion', dayEnd),
  ]);

  const fallback = buildFallback(date);

  const error = [servicesRes.error, modifiersRes.error, groomersRes.error, schedulesRes.error, exceptionsRes.error, appointmentsRes.error, reservationsRes.error].find(Boolean) || null;

  const data = {
    services: safeArray(servicesRes.data),
    modifiers: safeArray(modifiersRes.data),
    groomers: safeArray(groomersRes.data),
    schedules: safeArray(schedulesRes.data),
    exceptions: safeArray(exceptionsRes.data),
    appointments: safeArray(appointmentsRes.data),
    reservations: safeArray(reservationsRes.data),
  };

  const reservationClientIds = [...new Set(data.reservations.map((reservation) => reservation.cliente_id).filter(Boolean))];
  const reservationClientsRes = reservationClientIds.length
    ? await supabase.from('perfiles').select('id, nombre_completo, telefono, email, avatar_url').in('id', reservationClientIds)
    : { data: [], error: null };

  // ── KEY FIX: Fetch ALL citas linked to these reservas using reserva_id ──
  // This is separate from the daily appointments because the appointment date
  // can be different from the reservation creation date (e.g. book today for tomorrow).
  const reservationIds = data.reservations.map(r => r.id).filter(Boolean);
  const reservationCitasRes = reservationIds.length
    ? await supabase.from('citas').select(`
        id, reserva_id, mascota_id, groomer_id, servicio_id,
        fecha_hora_inicio, fecha_hora_fin, estado, notas_cliente,
        sugerencia_groomer_id, sugerencia_fecha_hora_inicio, sugerencia_fecha_hora_fin,
        propuesta_mensaje, estado_propuesta, rechazo_mensaje,
        mascota:mascotas(id, nombre, foto_perfil_url, raza, especie),
        servicio:servicios(id, nombre, duracion_base_minutos, precio_base),
        groomer:perfiles!citas_groomer_id_fkey(id, nombre_completo, avatar_url)
      `).in('reserva_id', reservationIds)
    : { data: [], error: null };

  const appointmentPetIds = [...new Set(data.appointments.map((appointment) => appointment.mascota_id).filter(Boolean))];
  const petsRes = appointmentPetIds.length
    ? await supabase.from('mascotas').select('id, nombre, foto_perfil_url, raza, especie, tamano, temperamento, alergias, dueno_id').in('id', appointmentPetIds)
    : { data: [], error: null };

  const fichasRes = data.appointments.length
    ? await supabase.from('fichas_grooming').select('id, cita_id, nivel_suciedad, estado_ingreso_nudos, estado_ingreso_pulgas, estado_ingreso_heridas, temperamento_actual, peso_actual, observaciones_groomer, recomendaciones_post, finalizado_at').in('cita_id', data.appointments.map((appointment) => appointment.id))
    : { data: [], error: null };

  const fichaIds = safeArray(fichasRes.data).map((ficha) => ficha.id);
  const checklistRes = fichaIds.length
    ? await supabase.from('checklist_seguimiento').select('id, ficha_id, tarea_id, completado, observacion_item, tarea:tareas_disponibles(id, nombre)').in('ficha_id', fichaIds)
    : { data: [], error: null };

  const photosRes = fichaIds.length
    ? await supabase.from('fotos_grooming').select('id, ficha_id, url_foto, tipo_momento').in('ficha_id', fichaIds)
    : { data: [], error: null };

  const appliedModifiersRes = data.appointments.length
    ? await supabase.from('cita_modificadores_aplicados').select('id, cita_id, modificador_id, precio_aplicado, estado_aprobacion, modificador:modificadores_servicio(id, criterio, valor, tiempo_extra_minutos, precio_adicional, precio_es_porcentaje, tiempo_es_porcentaje, icon_name)').in('cita_id', data.appointments.map((appointment) => appointment.id))
    : { data: [], error: null };

  const groomerById = mapById(data.groomers);
  const clientById = mapById(safeArray(reservationClientsRes.data));
  const petById = new Map(safeArray(petsRes.data).map((pet) => [pet.id, pet]));
  const fichaByCitaId = new Map(safeArray(fichasRes.data).map((ficha) => [ficha.cita_id, ficha]));
  const checklistByFichaId = safeArray(checklistRes.data).reduce((accumulator, item) => {
    if (!accumulator[item.ficha_id]) accumulator[item.ficha_id] = [];
    accumulator[item.ficha_id].push(item);
    return accumulator;
  }, {});
  const photosByFichaId = safeArray(photosRes.data).reduce((accumulator, item) => {
    if (!accumulator[item.ficha_id]) accumulator[item.ficha_id] = [];
    accumulator[item.ficha_id].push(item);
    return accumulator;
  }, {});
  const modifiersByCitaId = safeArray(appliedModifiersRes.data).reduce((accumulator, item) => {
    if (!accumulator[item.cita_id]) accumulator[item.cita_id] = [];
    accumulator[item.cita_id].push(item.modificador ? { ...item.modificador, applied_id: item.id, precio_aplicado: item.precio_aplicado, estado_aprobacion: item.estado_aprobacion } : item);
    return accumulator;
  }, {});
  const normalizedAppointments = data.appointments.map((appointment) => ({
    ...appointment,
    mascota_nombre: petById.get(appointment.mascota_id)?.nombre || appointment.mascota_nombre || null,
    mascota_foto_url: petById.get(appointment.mascota_id)?.foto_perfil_url || appointment.mascota_foto_url || null,
    groomer_nombre: groomerById.get(appointment.groomer_id)?.nombre_completo || null,
    mascota: petById.get(appointment.mascota_id) || null,
    ficha: fichaByCitaId.get(appointment.id) || null,
    checklist: fichaByCitaId.get(appointment.id) ? (checklistByFichaId[fichaByCitaId.get(appointment.id).id] || []) : [],
    fotos: fichaByCitaId.get(appointment.id) ? (photosByFichaId[fichaByCitaId.get(appointment.id).id] || []) : [],
    modificadores_aplicados: modifiersByCitaId[appointment.id] || [],
  }));

  // Build a map of reservation citas (with full nested data) grouped by reserva_id
  const reservationCitasByReservaId = safeArray(reservationCitasRes.data).reduce((acc, cita) => {
    if (!acc[cita.reserva_id]) acc[cita.reserva_id] = [];
    acc[cita.reserva_id].push(cita);
    return acc;
  }, {});

  const normalizedReservations = data.reservations.map((reservation) => ({
    ...reservation,
    cliente: clientById.get(reservation.cliente_id) || null,
    // Attach linked citas directly on the reservation object for the inbox
    linked_citas: reservationCitasByReservaId[reservation.id] || [],
  }));

  return {
    data: {
      services: data.services,
      modifiers: data.modifiers,
      groomers: data.groomers,
      schedules: data.schedules,
      exceptions: data.exceptions,
      appointments: normalizedAppointments,
      reservations: normalizedReservations,
      fichas: safeArray(fichasRes.data),
    },
    error: error || petsRes.error || reservationClientsRes.error || fichasRes.error || checklistRes.error || photosRes.error || appliedModifiersRes.error,
  };
};

export const groupAppointmentsByGroomer = (appointments, groomers, services) => {
  const serviceById = new Map((services || []).map((service) => [service.id, service]));
  const groomerById = new Map((groomers || []).map((groomer) => [groomer.id, groomer]));

  return (appointments || []).reduce((accumulator, appointment) => {
    const groomerId = appointment.groomer_id || 'sin-groomer';
    if (!accumulator[groomerId]) {
      accumulator[groomerId] = [];
    }
    accumulator[groomerId].push({
      ...appointment,
      groomer: groomerById.get(groomerId) || null,
      servicio: serviceById.get(appointment.servicio_id) || null,
    });
    return accumulator;
  }, {});
};

export const getWeekdayNumber = (dateValue) => {
  // Append noon time to avoid UTC midnight → local-previous-day timezone shift
  // e.g. "2026-05-29" at UTC+0:00:00 = May 28 at 20:00 in UTC-4 → wrong weekday
  const dateStr = String(dateValue).length === 10 ? `${dateValue}T12:00:00` : dateValue;
  const date = new Date(dateStr);
  const day = date.getDay();
  return day === 0 ? 0 : day;
};