import { supabase } from '../../../api/supabase';
import { registerLog } from '../../auth/services/logsService';

const NOT_CONFIGURED_ERROR = new Error('Supabase no está configurado');

const safeLog = async (actor, action) => {
  if (!actor?.id) return;

  try {
    await registerLog(actor.id, actor.rol || 'admin', action);
  } catch (error) {
    console.warn('No se pudo registrar el log de auditoría:', error);
  }
};

const baseMutation = async ({ table, operation, payload, id }) => {
  if (!supabase) {
    return { data: null, error: NOT_CONFIGURED_ERROR };
  }

  const query = supabase.from(table);

  if (operation === 'insert') {
    return query.insert(payload).select('*').single();
  }

  if (operation === 'update') {
    return query.update(payload).eq('id', id).select('*').single();
  }

  if (operation === 'delete') {
    return query.delete().eq('id', id).select('*').single();
  }

  return { data: null, error: new Error(`Operación no soportada: ${operation}`) };
};

const normalizeNullableText = (value) => {
  const text = typeof value === 'string' ? value.trim() : '';
  return text.length ? text : null;
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toTimestamp = (value) => {
  if (!value) return null;
  return new Date(value).toISOString();
};

export const createService = async (formData, actor) => {
  const payload = {
    nombre: formData.nombre?.trim(),
    descripcion: normalizeNullableText(formData.descripcion),
    duracion_base_minutos: toNumber(formData.duracion_base_minutos, 30),
    precio_base: toNumber(formData.precio_base, 0),
    categoria: normalizeNullableText(formData.categoria),
    icon_name: normalizeNullableText(formData.icon_name) || 'Scissors',
  };

  const result = await baseMutation({ table: 'servicios', operation: 'insert', payload });
  if (!result.error) await safeLog(actor, `CREAR SERVICIO: ${payload.nombre}`);
  return result;
};

export const updateService = async (id, formData, actor) => {
  const payload = {
    nombre: formData.nombre?.trim(),
    descripcion: normalizeNullableText(formData.descripcion),
    duracion_base_minutos: toNumber(formData.duracion_base_minutos, 30),
    precio_base: toNumber(formData.precio_base, 0),
    categoria: normalizeNullableText(formData.categoria),
    icon_name: normalizeNullableText(formData.icon_name) || 'Scissors',
  };

  const result = await baseMutation({ table: 'servicios', operation: 'update', payload, id });
  if (!result.error) await safeLog(actor, `ACTUALIZAR SERVICIO: ${payload.nombre}`);
  return result;
};

export const deleteService = async (id, actor, label = 'SERVICIO') => {
  const result = await baseMutation({ table: 'servicios', operation: 'delete', id });
  if (!result.error) await safeLog(actor, `ELIMINAR ${label}: ${id}`);
  return result;
};

export const createModifier = async (formData, actor) => {
  const payload = {
    servicio_id: formData.servicio_id || null,
    criterio: formData.criterio?.trim(),
    valor: normalizeNullableText(formData.valor),
    tiempo_extra_minutos: toNumber(formData.tiempo_extra_minutos, 0),
    precio_adicional: toNumber(formData.precio_adicional, 0),
    precio_es_porcentaje: Boolean(formData.precio_es_porcentaje),
    tiempo_es_porcentaje: Boolean(formData.tiempo_es_porcentaje),
    icon_name: normalizeNullableText(formData.icon_name) || 'Zap',
  };

  const result = await baseMutation({ table: 'modificadores_servicio', operation: 'insert', payload });
  if (!result.error) await safeLog(actor, `CREAR MODIFICADOR: ${payload.criterio}`);
  return result;
};

export const updateModifier = async (id, formData, actor) => {
  const payload = {
    servicio_id: formData.servicio_id || null,
    criterio: formData.criterio?.trim(),
    valor: normalizeNullableText(formData.valor),
    tiempo_extra_minutos: toNumber(formData.tiempo_extra_minutos, 0),
    precio_adicional: toNumber(formData.precio_adicional, 0),
    precio_es_porcentaje: Boolean(formData.precio_es_porcentaje),
    tiempo_es_porcentaje: Boolean(formData.tiempo_es_porcentaje),
    icon_name: normalizeNullableText(formData.icon_name) || 'Zap',
  };

  const result = await baseMutation({ table: 'modificadores_servicio', operation: 'update', payload, id });
  if (!result.error) await safeLog(actor, `ACTUALIZAR MODIFICADOR: ${payload.criterio}`);
  return result;
};

export const deleteModifier = async (id, actor) => {
  const result = await baseMutation({ table: 'modificadores_servicio', operation: 'delete', id });
  if (!result.error) await safeLog(actor, `ELIMINAR MODIFICADOR: ${id}`);
  return result;
};

export const createSchedule = async (formData, actor) => {
  const payload = {
    groomer_id: formData.groomer_id || null,
    dia_semana: toNumber(formData.dia_semana, 1),
    hora_inicio: formData.hora_inicio,
    hora_fin: formData.hora_fin,
  };

  const result = await baseMutation({ table: 'horarios_base_groomer', operation: 'insert', payload });
  if (!result.error) await safeLog(actor, `CREAR HORARIO: ${payload.groomer_id || 'sin groomer'}`);
  return result;
};

export const updateSchedule = async (id, formData, actor) => {
  const payload = {
    groomer_id: formData.groomer_id || null,
    dia_semana: toNumber(formData.dia_semana, 1),
    hora_inicio: formData.hora_inicio,
    hora_fin: formData.hora_fin,
  };

  const result = await baseMutation({ table: 'horarios_base_groomer', operation: 'update', payload, id });
  if (!result.error) await safeLog(actor, `ACTUALIZAR HORARIO: ${id}`);
  return result;
};

export const deleteSchedule = async (id, actor) => {
  const result = await baseMutation({ table: 'horarios_base_groomer', operation: 'delete', id });
  if (!result.error) await safeLog(actor, `ELIMINAR HORARIO: ${id}`);
  return result;
};

export const createException = async (formData, actor) => {
  const allDay = Boolean(formData.todo_el_dia);
  const payload = {
    tipo: formData.tipo || 'general',
    groomer_id: formData.tipo === 'staff' ? formData.groomer_id || null : null,
    fecha_efectiva: formData.fecha_efectiva,
    todo_el_dia: allDay,
    hora_inicio: allDay ? null : formData.hora_inicio || null,
    hora_fin: allDay ? null : formData.hora_fin || null,
    motivo: formData.motivo?.trim(),
    detalle_opcional: normalizeNullableText(formData.detalle_opcional),
  };

  const result = await baseMutation({ table: 'excepciones_agenda', operation: 'insert', payload });
  if (!result.error) await safeLog(actor, `CREAR EXCEPCIÓN: ${payload.motivo}`);
  return result;
};

export const updateException = async (id, formData, actor) => {
  const allDay = Boolean(formData.todo_el_dia);
  const payload = {
    tipo: formData.tipo || 'general',
    groomer_id: formData.tipo === 'staff' ? formData.groomer_id || null : null,
    fecha_efectiva: formData.fecha_efectiva,
    todo_el_dia: allDay,
    hora_inicio: allDay ? null : formData.hora_inicio || null,
    hora_fin: allDay ? null : formData.hora_fin || null,
    motivo: formData.motivo?.trim(),
    detalle_opcional: normalizeNullableText(formData.detalle_opcional),
  };

  const result = await baseMutation({ table: 'excepciones_agenda', operation: 'update', payload, id });
  if (!result.error) await safeLog(actor, `ACTUALIZAR EXCEPCIÓN: ${payload.motivo}`);
  return result;
};

export const deleteException = async (id, actor) => {
  const result = await baseMutation({ table: 'excepciones_agenda', operation: 'delete', id });
  if (!result.error) await safeLog(actor, `ELIMINAR EXCEPCIÓN: ${id}`);
  return result;
};

export const createAppointment = async (formData, actor) => {
  const payload = {
    reserva_id: formData.reserva_id || null,
    mascota_id: formData.mascota_id || null,
    groomer_id: formData.groomer_id || null,
    servicio_id: formData.servicio_id || null,
    fecha_hora_inicio: toTimestamp(formData.fecha_hora_inicio),
    fecha_hora_fin: toTimestamp(formData.fecha_hora_fin),
    estado: formData.estado || 'programada',
    notas_cliente: normalizeNullableText(formData.notas_cliente),
  };

  const result = await baseMutation({ table: 'citas', operation: 'insert', payload });
  if (!result.error) await safeLog(actor, `CREAR CITA: ${payload.fecha_hora_inicio}`);
  return result;
};

export const updateAppointment = async (id, formData, actor) => {
  const payload = {
    reserva_id: formData.reserva_id || null,
    mascota_id: formData.mascota_id || null,
    groomer_id: formData.groomer_id || null,
    servicio_id: formData.servicio_id || null,
    fecha_hora_inicio: toTimestamp(formData.fecha_hora_inicio),
    fecha_hora_fin: toTimestamp(formData.fecha_hora_fin),
    estado: formData.estado || 'programada',
    notas_cliente: normalizeNullableText(formData.notas_cliente),
  };

  const result = await baseMutation({ table: 'citas', operation: 'update', payload, id });
  if (!result.error) await safeLog(actor, `ACTUALIZAR CITA: ${id}`);
  return result;
};

export const cancelAppointment = async (id, actor) => {
  const result = await baseMutation({
    table: 'citas',
    operation: 'update',
    id,
    payload: { estado: 'cancelada' },
  });

  if (!result.error) await safeLog(actor, `CANCELAR CITA: ${id}`);
  return result;
};

export const deleteAppointment = async (id, actor) => {
  const result = await baseMutation({ table: 'citas', operation: 'delete', id });
  if (!result.error) await safeLog(actor, `ELIMINAR CITA: ${id}`);
  return result;
};
