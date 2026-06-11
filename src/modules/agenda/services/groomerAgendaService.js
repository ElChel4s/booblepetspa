import { supabase } from '../../../api/supabase';

const NOT_CONFIGURED_ERROR = new Error('Supabase no está configurado');

const updateCita = async (citaId, payload) => {
  if (!supabase) {
    return { data: null, error: NOT_CONFIGURED_ERROR };
  }

  return supabase.from('citas').update(payload).eq('id', citaId).select('*').single();
};

export const startAppointment = async (citaId) => updateCita(citaId, { estado: 'en_proceso' });

export const pauseAppointment = async (citaId) => updateCita(citaId, { estado: 'pausada' });

export const finishAppointment = async (citaId) => updateCita(citaId, { estado: 'completada' });

export const saveFicha = async (payload) => {
  if (!supabase) {
    return { data: null, error: NOT_CONFIGURED_ERROR };
  }

  const cleanedPayload = {
    cita_id: payload.cita_id,
    nivel_suciedad: payload.nivel_suciedad || null,
    estado_ingreso_nudos: Boolean(payload.estado_ingreso_nudos),
    estado_ingreso_pulgas: Boolean(payload.estado_ingreso_pulgas),
    estado_ingreso_heridas: Boolean(payload.estado_ingreso_heridas),
    temperamento_actual: payload.temperamento_actual || null,
    peso_actual: payload.peso_actual || null,
    observaciones_groomer: payload.observaciones_groomer || null,
    recomendaciones_post: payload.recomendaciones_post || null,
  };

  return supabase.from('fichas_grooming').upsert(cleanedPayload, { onConflict: 'cita_id' }).select('*').single();
};

export const toggleChecklistItem = async (itemId, completado) => {
  if (!supabase) {
    return { data: null, error: NOT_CONFIGURED_ERROR };
  }

  return supabase
    .from('checklist_seguimiento')
    .update({ completado })
    .eq('id', itemId)
    .select('*')
    .single();
};

/**
 * Inicializa la ficha y el checklist para la cita de manera resiliente (self-healing).
 */
export const initFichaAndChecklist = async (citaId) => {
  if (!supabase) {
    return { data: null, error: NOT_CONFIGURED_ERROR };
  }

  // 1. Obtener o crear ficha_grooming
  let { data: ficha, error: fetchFichaError } = await supabase
    .from('fichas_grooming')
    .select('*')
    .eq('cita_id', citaId)
    .maybeSingle();

  if (fetchFichaError) return { error: fetchFichaError };

  if (!ficha) {
    const { data: newFicha, error: insertFichaError } = await supabase
      .from('fichas_grooming')
      .insert({ cita_id: citaId })
      .select('*')
      .single();

    if (insertFichaError) return { error: insertFichaError };
    ficha = newFicha;
  }

  // 2. Obtener o crear checklist_seguimiento para esta ficha
  const { data: existingChecklist, error: fetchChecklistError } = await supabase
    .from('checklist_seguimiento')
    .select('*')
    .eq('ficha_id', ficha.id);

  if (fetchChecklistError) return { error: fetchChecklistError };

  if (!existingChecklist || existingChecklist.length === 0) {
    // Buscar tareas_disponibles
    let { data: tasks, error: fetchTasksError } = await supabase
      .from('tareas_disponibles')
      .select('*');

    if (fetchTasksError) return { error: fetchTasksError };

    // Si tareas_disponibles está vacía, sembrar las por defecto
    if (!tasks || tasks.length === 0) {
      const defaultTasks = [
        { nombre: 'Corte de Uñas y Limpieza de Oídos' },
        { nombre: 'Baño (1er y 2do Shampoo)' },
        { nombre: 'Secado y Cepillado' },
        { nombre: 'Corte / Arreglo Final' }
      ];

      const { data: seededTasks, error: seedError } = await supabase
        .from('tareas_disponibles')
        .insert(defaultTasks)
        .select('*');

      if (seedError) return { error: seedError };
      tasks = seededTasks;
    }

    // Insertar el checklist inicial para cada tarea
    const checklistPayloads = tasks.map((task) => ({
      ficha_id: ficha.id,
      tarea_id: task.id,
      completado: false
    }));

    const { error: checklistInsertError } = await supabase
      .from('checklist_seguimiento')
      .insert(checklistPayloads);

    if (checklistInsertError) return { error: checklistInsertError };
  }

  return { data: ficha, error: null };
};

/**
 * Añade una foto a la tabla fotos_grooming
 */
export const addGroomingPhoto = async (fichaId, urlFoto, tipoMomento) => {
  if (!supabase) return { data: null, error: NOT_CONFIGURED_ERROR };

  // Eliminar foto previa del mismo momento si existiese para evitar duplicados del mismo tipo (ej. un 'antes' y un 'despues')
  await supabase
    .from('fotos_grooming')
    .delete()
    .eq('ficha_id', fichaId)
    .eq('tipo_momento', tipoMomento);

  return supabase
    .from('fotos_grooming')
    .insert({
      ficha_id: fichaId,
      url_foto: urlFoto,
      tipo_momento: tipoMomento
    })
    .select('*')
    .single();
};

/**
 * Elimina una foto de la tabla fotos_grooming
 */
export const removeGroomingPhoto = async (photoId) => {
  if (!supabase) return { data: null, error: NOT_CONFIGURED_ERROR };

  return supabase
    .from('fotos_grooming')
    .delete()
    .eq('id', photoId);
};

/**
 * Sugerir recargo / Añadir modificador
 */
export const addCitaModifier = async (citaId, modificadorId, precio) => {
  if (!supabase) return { data: null, error: NOT_CONFIGURED_ERROR };

  return supabase
    .from('cita_modificadores_aplicados')
    .insert({
      cita_id: citaId,
      modificador_id: modificadorId,
      precio_aplicado: precio
    })
    .select('*')
    .single();
};

/**
 * Quitar recargo sugerido / Eliminar modificador
 */
export const removeCitaModifier = async (citaId, modificadorId) => {
  if (!supabase) return { data: null, error: NOT_CONFIGURED_ERROR };

  return supabase
    .from('cita_modificadores_aplicados')
    .delete()
    .eq('cita_id', citaId)
    .eq('modificador_id', modificadorId);
};

/**
 * Obtener lista de insumos (productos donde es_insumo = true)
 */
export const getInsumosList = async () => {
  if (!supabase) return { data: [], error: null };

  let { data: insumos, error: fetchError } = await supabase
    .from('productos')
    .select('id, nombre, stock_actual, stock_minimo_alerta')
    .eq('es_insumo', true)
    .order('nombre', { ascending: true });

  if (fetchError) return { data: [], error: fetchError };

  // Si no hay insumos, sembrar algunos iniciales para simulación
  if (!insumos || insumos.length === 0) {
    const defaultInsumos = [
      { nombre: 'Shampoo Medicado (Clorhexidina)', precio_base: 50, stock_actual: 5, stock_minimo_alerta: 2, es_insumo: true },
      { nombre: 'Acondicionador Desenredante', precio_base: 40, stock_actual: 12, stock_minimo_alerta: 3, es_insumo: true },
      { nombre: 'Perfume Hipoalergénico', precio_base: 30, stock_actual: 8, stock_minimo_alerta: 2, es_insumo: true }
    ];

    const { data: seededInsumos, error: seedError } = await supabase
      .from('productos')
      .insert(defaultInsumos)
      .select('*');

    if (seedError) return { data: [], error: seedError };
    insumos = seededInsumos;
  }

  return { data: insumos, error: null };
};

/**
 * Registrar retiro de insumo y descontar stock
 */
export const withdrawInsumo = async (productoId, groomerId, citaId) => {
  if (!supabase) return { error: NOT_CONFIGURED_ERROR };

  // 1. Insertar registro en retiros_insumo
  const { error: insertError } = await supabase
    .from('retiros_insumo')
    .insert({
      producto_id: productoId,
      groomer_id: groomerId,
      cantidad: 1,
      motivo: `Apertura de insumo desde módulo de grooming`
    });

  if (insertError) return { error: insertError };

  // 2. Obtener stock actual
  const { data: prod, error: fetchError } = await supabase
    .from('productos')
    .select('stock_actual')
    .eq('id', productoId)
    .single();

  if (fetchError || !prod) {
    return { error: fetchError || new Error('Producto no encontrado') };
  }

  // 3. Descontar en productos
  const newStock = Math.max(0, (prod.stock_actual || 0) - 1);
  const { error: updateError } = await supabase
    .from('productos')
    .update({ stock_actual: newStock })
    .eq('id', productoId);

  // 4. Insertar en movimientos_inventario
  if (!updateError) {
    await supabase.from('movimientos_inventario').insert({
      producto_id: productoId,
      usuario_id: groomerId,
      tipo: 'salida',
      categoria_motivo: 'Uso Interno',
      cantidad: 1,
      detalle: `Apertura de insumo desde módulo de grooming (Cita: ${citaId})`
    });
  }

  return { error: updateError };
};

/**
 * Guarda el diagnóstico definitivo de la ficha y marca la cita como completada.
 */
export const saveAndFinishFicha = async (citaId, fichaForm, insumosUsados = [], groomerId = null) => {
  if (!supabase) return { error: NOT_CONFIGURED_ERROR };

  // 1. Actualizar ficha_grooming
  const { data: ficha, error: updateFichaError } = await supabase
    .from('fichas_grooming')
    .update({
      estado_ingreso_nudos: Boolean(fichaForm.nudos),
      estado_ingreso_pulgas: Boolean(fichaForm.pulgas),
      estado_ingreso_heridas: Boolean(fichaForm.heridas),
      peso_actual: fichaForm.peso ? parseFloat(fichaForm.peso) : null,
      temperamento_actual: fichaForm.temperamento || null,
      observaciones_groomer: fichaForm.observaciones_groomer || null,
      recomendaciones_post: fichaForm.recomendaciones_post || null,
      finalizado_at: new Date().toISOString()
    })
    .eq('cita_id', citaId)
    .select('*')
    .single();

  if (updateFichaError) return { error: updateFichaError };

  // 2. Subir foto "después" si existe
  if (fichaForm.foto_despues && ficha) {
    const { error: photoError } = await addGroomingPhoto(ficha.id, fichaForm.foto_despues, 'despues');
    if (photoError) return { error: photoError };
  }

  // 3. Notificar a recepción: marcar cita como completada
  const { error: updateCitaError } = await supabase
    .from('citas')
    .update({ estado: 'completada' })
    .eq('id', citaId);

  if (updateCitaError) return { error: updateCitaError };

  // 4. Guardar insumos consumidos manualmente e impactar inventario si aplica
  try {
    // Resolver groomer_id de la cita si no se proporcionó
    let currentGroomerId = groomerId;
    if (!currentGroomerId) {
      const { data: citaData } = await supabase
        .from('citas')
        .select('groomer_id')
        .eq('id', citaId)
        .single();
      if (citaData) {
        currentGroomerId = citaData.groomer_id;
      }
    }

    // Limpiar insumos previamente registrados para esta cita (resiliencia)
    await supabase
      .from('cita_insumos_usados')
      .delete()
      .eq('cita_id', citaId);

    // Procesar cada insumo
    for (const item of insumosUsados) {
      // a. Insertar registro de uso
      await supabase
        .from('cita_insumos_usados')
        .insert({
          cita_id: citaId,
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          abrio_nuevo: !!item.abrio_nuevo
        });

      // b. Si abrió un envase nuevo, descontar en productos y registrar retiros/movimientos
      if (item.abrio_nuevo) {
        // Consultar stock real antes de descontar para evitar inconsistencias
        const { data: prodData } = await supabase
          .from('productos')
          .select('stock_actual')
          .eq('id', item.producto_id)
          .single();

        const currentStock = prodData ? prodData.stock_actual : 0;
        const newStock = Math.max(0, currentStock - 1);

        // Descontar stock
        const { error: stockErr } = await supabase
          .from('productos')
          .update({ stock_actual: newStock })
          .eq('id', item.producto_id);

        if (!stockErr && currentGroomerId) {
          // Registrar en retiros_insumo
          await supabase
            .from('retiros_insumo')
            .insert({
              producto_id: item.producto_id,
              groomer_id: currentGroomerId,
              cantidad: 1,
              motivo: `Apertura de insumo nuevo desde checkout (Cita: ${citaId})`
            });

          // Registrar en movimientos_inventario
          await supabase
            .from('movimientos_inventario')
            .insert({
              producto_id: item.producto_id,
              usuario_id: currentGroomerId,
              tipo: 'salida',
              categoria_motivo: 'Uso Interno',
              cantidad: 1,
              detalle: `Apertura de insumo nuevo en checkout (Cita: ${citaId})`
            });
        }
      }
    }
  } catch (err) {
    console.error('Error al procesar insumos manuales:', err);
  }

  return { error: null };
};

