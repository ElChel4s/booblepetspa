import { supabase } from '../../../../../../api/supabase';

/**
 * Obtener citas de hoy para el panel de Recepción con joins necesarios.
 */
export const getTodayCitas = async () => {
  if (!supabase) return { data: [], error: null };
  
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  return supabase
    .from('citas')
    .select(`
      id,
      reserva_id,
      groomer_id,
      servicio_id,
      fecha_hora_inicio,
      fecha_hora_fin,
      estado,
      notas_cliente,
      mascota:mascotas(
        id,
        nombre,
        especie,
        raza,
        dueno:perfiles!mascotas_dueno_id_fkey(id, nombre_completo, telefono)
      ),
      groomer:perfiles!citas_groomer_id_fkey(id, nombre_completo),
      servicio:servicios(id, nombre, precio_base),
      ficha:fichas_grooming(
        id,
        recomendaciones_post,
        estado_ingreso_nudos,
        estado_ingreso_pulgas,
        estado_ingreso_heridas,
        observaciones_groomer,
        checklist:checklist_seguimiento(
          id,
          completado,
          tarea_id,
          tarea:tareas_disponibles(id, nombre)
        )
      )
    `)
    .gte('fecha_hora_inicio', todayStart.toISOString())
    .lte('fecha_hora_inicio', todayEnd.toISOString())
    .order('fecha_hora_inicio', { ascending: true });
};

/**
 * Obtener modificadores aplicados a una lista de citas.
 */
export const getCitaModificadores = async (citaIds) => {
  if (!supabase || citaIds.length === 0) return { data: [], error: null };
  return supabase
    .from('cita_modificadores_aplicados')
    .select(`
      id,
      cita_id,
      precio_aplicado,
      modificador:modificadores_servicio(id, criterio, valor)
    `)
    .in('cita_id', citaIds);
};

/**
 * Dar ingreso a una mascota (cambiar estado a 'en_proceso' o 'en_espera').
 */
export const checkInCita = async (citaId) => {
  if (!supabase) return { error: new Error('Supabase no configurado') };
  return supabase
    .from('citas')
    .update({ estado: 'en_proceso' })
    .eq('id', citaId);
};

/**
 * Simular finalización del servicio por el groomer.
 * Crea una ficha_grooming básica y marca como 'completada'.
 */
export const completeServiceCita = async (citaId) => {
  if (!supabase) return { error: new Error('Supabase no configurado') };

  // 1. Crear ficha_grooming básica si no existe
  const { data: existingFicha } = await supabase
    .from('fichas_grooming')
    .select('id')
    .eq('cita_id', citaId)
    .maybeSingle();

  if (!existingFicha) {
    await supabase
      .from('fichas_grooming')
      .insert({
        cita_id: citaId,
        nivel_suciedad: 'Medio',
        recomendaciones_post: 'Se portó excelente. Sugerimos mantener este corte corto por la temporada de calor.',
        observaciones_groomer: 'Servicio completado correctamente.'
      });
  } else {
    await supabase
      .from('fichas_grooming')
      .update({
        recomendaciones_post: 'Se portó excelente. Sugerimos mantener este corte corto por la temporada de calor.',
        observaciones_groomer: 'Servicio completado correctamente.'
      })
      .eq('cita_id', citaId);
  }

  // 2. Cambiar estado de la cita a completada
  return supabase
    .from('citas')
    .update({ estado: 'completada' })
    .eq('id', citaId);
};

/**
 * Procesar Checkout POS (Factura + Pago).
 */
export const processCitaCheckout = async ({
  citaId,
  reservaId,
  clienteId,
  nitCi,
  razonSocial,
  metodoPago,
  montoTotal
}) => {
  if (!supabase) return { error: new Error('Supabase no configurado') };

  // 1. Crear Factura
  const { data: factura, error: facturaError } = await supabase
    .from('facturas')
    .insert({
      cliente_id: clienteId || null,
      reserva_id: reservaId || null,
      nit_ci: nitCi,
      razon_social: razonSocial,
      monto_total: montoTotal,
      estado_factura: 'emitida'
    })
    .select('*')
    .single();

  if (facturaError) return { error: facturaError };

  // 2. Registrar Pago
  const { error: pagoError } = await supabase
    .from('pagos')
    .insert({
      factura_id: factura.id,
      metodo_pago: metodoPago,
      monto_pagado: montoTotal
    });

  if (pagoError) return { error: pagoError };

  // 3. Marcar la cita como completada en la DB y asociarle la factura/pago
  // (Poner la cita en estado 'completada' y guardar localmente que ya se pagó,
  //  o simplemente podemos filtrar en la UI las citas que ya tienen factura emitida)
  return { data: factura, error: null };
};

/**
 * Obtener facturas para una lista de IDs de reserva.
 */
export const getFacturasForReservations = async (reservaIds) => {
  if (!supabase || !reservaIds || reservaIds.length === 0) return { data: [], error: null };
  return supabase
    .from('facturas')
    .select('id, reserva_id')
    .in('reserva_id', reservaIds);
};
