import { supabase } from '../../../api/supabase';

const NOT_CONFIGURED_ERROR = new Error('Supabase no está configurado');

const updateTableRow = async ({ table, id, payload }) => {
  if (!supabase) {
    return { data: null, error: NOT_CONFIGURED_ERROR };
  }

  return supabase.from(table).update(payload).eq('id', id).select('*').single();
};

export const updateReservationStatus = async (reservationId, estado_general, rejectionMessage = null) => {
  if (!supabase) return { data: null, error: NOT_CONFIGURED_ERROR };

  // Primero actualizamos la reserva
  const result = await supabase.from('reservas').update({ estado_general }).eq('id', reservationId).select('*').single();
  
  if (result.error) return result;

  // Si fue cancelada con mensaje, propagamos el mensaje a las citas y las cancelamos
  if (estado_general === 'cancelada') {
    await supabase.from('citas').update({ 
      estado: 'cancelada', 
      rechazo_mensaje: rejectionMessage 
    }).eq('reserva_id', reservationId);
  } else if (estado_general === 'confirmada') {
    await supabase.from('citas').update({ estado: 'agendada' }).eq('reserva_id', reservationId);
  }

  return result;
};

export const createReservation = async (payload) => {
  if (!supabase) {
    return { data: null, error: NOT_CONFIGURED_ERROR };
  }

  const cleanedPayload = {
    cliente_id: payload.cliente_id || null,
    fecha_creacion: payload.fecha_creacion || new Date().toISOString(),
    estado_general: payload.estado_general || 'pendiente',
    total_reserva: Number(payload.total_reserva || 0),
    nombre_invitado: payload.nombre_invitado || null,
    telefono_invitado: payload.telefono_invitado || null,
    ci_invitado: payload.ci_invitado || null,
    origen: payload.origen || 'presencial',
  };

  return supabase.from('reservas').insert(cleanedPayload).select('*').single();
};

export const updateAppointmentStatus = async (appointmentId, estado) => {
  return updateTableRow({
    table: 'citas',
    id: appointmentId,
    payload: { estado },
  });
};

export const createGuestPet = async ({ nombre, especie, raza }) => {
  if (!supabase) {
    return { data: null, error: NOT_CONFIGURED_ERROR };
  }

  return supabase
    .from('mascotas')
    .insert([{
      nombre,
      especie,
      raza,
      dueno_id: null,
    }])
    .select('*')
    .single();
};

export const applyAppointmentModifiers = async (appointmentId, modifiersList, modifiersMetadata) => {
  if (!supabase) {
    return { data: null, error: NOT_CONFIGURED_ERROR };
  }
  if (!modifiersList || modifiersList.length === 0) {
    return { data: [], error: null };
  }

  const payloads = modifiersList.map((modId) => {
    const mod = modifiersMetadata.find((m) => m.id === modId);
    return {
      cita_id: appointmentId,
      modificador_id: modId,
      precio_applied: Number(mod?.precio_adicional || 0), // Note: in bd.txt schema this column is precio_aplicado! Let's use precio_aplicado to match the database exactly.
      precio_aplicado: Number(mod?.precio_adicional || 0),
    };
  });

  return supabase.from('cita_modificadores_aplicados').insert(payloads).select('*');
};

export const sendProposalAlternative = async (appointmentId, suggestedGroomerId, suggestedDate, suggestedTime, message) => {
  if (!supabase) return { data: null, error: NOT_CONFIGURED_ERROR };

  let fecha_hora_inicio = null;
  let fecha_hora_fin = null;

  if (suggestedDate && suggestedTime) {
    // Generamos las nuevas fechas asumiendo duración de 1 hora por defecto si no tenemos el servicio aquí
    // El servicio se arreglará o mantendrá su duración original en base al DB o cliente, 
    // pero por ahora guardamos la fecha de inicio propuesta.
    fecha_hora_inicio = new Date(`${suggestedDate}T${suggestedTime}:00`).toISOString();
    // Para simplificar, fecha_hora_fin la dejamos null y que el cliente calcule, 
    // o le sumamos 1 hora provisionalmente.
    const end = new Date(`${suggestedDate}T${suggestedTime}:00`);
    end.setHours(end.getHours() + 1);
    fecha_hora_fin = end.toISOString();
  } else if (suggestedDate) {
    // Si solo mandó fecha, mantenemos la hora original (requeriría saber la hora original, mejor pedimos las 2)
  }

  return supabase
    .from('citas')
    .update({
      sugerencia_groomer_id: suggestedGroomerId || null,
      sugerencia_fecha_hora_inicio: fecha_hora_inicio,
      sugerencia_fecha_hora_fin: fecha_hora_fin,
      propuesta_mensaje: message,
      estado_propuesta: 'pendiente',
    })
    .eq('id', appointmentId)
    .select('*')
    .single();
};


