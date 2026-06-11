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
      estado_aprobacion,
      modificador:modificadores_servicio(id, criterio, valor)
    `)
    .in('cita_id', citaIds);
};

/**
 * Agrega los pasos de un servicio adicional al checklist de la ficha de la cita.
 */
export const addExtraServiceStepsToChecklist = async (citaId, serviceName) => {
  if (!supabase) return { error: new Error('Supabase no configurado') };
  try {
    const { data: ficha, error: fichaError } = await supabase
      .from('fichas_grooming')
      .select('id')
      .eq('cita_id', citaId)
      .maybeSingle();

    if (fichaError) throw fichaError;
    if (!ficha) return { error: new Error('No se encontró ficha_grooming') };

    const fichaId = ficha.id;

    const { data: servicio, error: servicioError } = await supabase
      .from('servicios')
      .select('id')
      .eq('nombre', serviceName)
      .maybeSingle();

    if (servicioError) throw servicioError;
    if (!servicio) return { error: new Error(`No se encontró servicio: ${serviceName}`) };

    const { data: pasos, error: pasosError } = await supabase
      .from('pasos_servicio')
      .select('tarea_id')
      .eq('servicio_id', servicio.id)
      .order('orden', { ascending: true });

    if (pasosError) throw pasosError;
    if (!pasos || pasos.length === 0) return { data: [], error: null };

    const { data: checklistExistente, error: chkError } = await supabase
      .from('checklist_seguimiento')
      .select('tarea_id')
      .eq('ficha_id', fichaId);

    if (chkError) throw chkError;
    const tareasExistentes = new Set(checklistExistente?.map(item => item.tarea_id) || []);

    const nuevosPasos = pasos.filter(p => !tareasExistentes.has(p.tarea_id));
    if (nuevosPasos.length === 0) return { data: [], error: null };

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
    console.error(`[receptionControlService - addExtraServiceStepsToChecklist] error para ${serviceName}:`, err);
    return { error: err };
  }
};

/**
 * Actualizar el estado de aprobación de un modificador aplicado.
 */
export const updateCitaModifierStatus = async (appliedModifierId, newStatus) => {
  if (!supabase) return { error: new Error('Supabase no configurado') };
  try {
    // 1. Obtener cita_id y criterio del modificador antes de actualizar
    const { data: appliedMod, error: getError } = await supabase
      .from('cita_modificadores_aplicados')
      .select(`
        cita_id,
        modificador:modificadores_servicio(criterio, valor)
      `)
      .eq('id', appliedModifierId)
      .maybeSingle();

    if (getError) throw getError;
    if (!appliedMod) throw new Error('Modificador no encontrado');

    const citaId = appliedMod.cita_id;
    const isExtraService = appliedMod.modificador?.valor === 'Servicio Adicional';
    const serviceName = appliedMod.modificador?.criterio;

    // 2. Actualizar estado
    const { data, error } = await supabase
      .from('cita_modificadores_aplicados')
      .update({ estado_aprobacion: newStatus })
      .eq('id', appliedModifierId)
      .select();

    if (error) throw error;

    // 3. Si es aprobado y es servicio adicional, agregar pasos
    if (newStatus === 'aprobado' && isExtraService && serviceName) {
      await addExtraServiceStepsToChecklist(citaId, serviceName);
    }

    // 4. Crear notificaciones para el groomer y cliente
    const { data: cita } = await supabase
      .from('citas')
      .select('groomer_id, mascota:mascotas(nombre, dueno_id)')
      .eq('id', citaId)
      .maybeSingle();

    if (cita) {
      const mascotaNombre = cita.mascota?.nombre || 'la mascota';
      
      // Notificar al groomer
      if (cita.groomer_id) {
        await supabase
          .from('notificaciones')
          .insert({
            usuario_id: cita.groomer_id,
            rol_destino: 'groomer',
            titulo: newStatus === 'aprobado' ? 'Servicio Adicional Aprobado' : 'Servicio Adicional Rechazado',
            mensaje: newStatus === 'aprobado'
              ? `Recepción aprobó "${serviceName}" para ${mascotaNombre}. Se añadieron las tareas al checklist.`
              : `Recepción rechazó "${serviceName}" para ${mascotaNombre}.`,
            tipo: 'ficha',
            link_modulo: '/groomer/agenda'
          });
      }

      // Notificar al cliente
      if (cita.mascota?.dueno_id) {
        await supabase
          .from('notificaciones')
          .insert({
            usuario_id: cita.mascota.dueno_id,
            rol_destino: 'cliente',
            titulo: newStatus === 'aprobado' ? 'Servicio Adicional Confirmado' : 'Servicio Adicional Cancelado',
            mensaje: newStatus === 'aprobado'
              ? `Se ha aprobado la adición de "${serviceName}" para ${mascotaNombre}.`
              : `Se ha rechazado la adición de "${serviceName}" para ${mascotaNombre}.`,
            tipo: 'cita',
            link_modulo: '/cliente/citas'
          });
      }
    }

    return { data, error: null };
  } catch (err) {
    console.error('[receptionControlService] updateCitaModifierStatus error:', err);
    return { error: err };
  }
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
