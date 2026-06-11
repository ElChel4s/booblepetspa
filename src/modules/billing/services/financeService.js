import { supabase, handleSupabaseError } from '../../../api/supabase';
import { IS_REAL_AUTH } from '../../../config';

const delay = (ms = 150) => new Promise((res) => setTimeout(res, ms));

/**
 * Obtiene los pedidos web que han subido un comprobante de pago y están pendientes de validación.
 */
export const getPendingWebOrders = async () => {
  if (!IS_REAL_AUTH) {
    await delay();
    return [];
  }

  // Obtenemos los comprobantes pendientes, uniendo la info del cliente, el pedido y los productos
  const { data, error } = await supabase
    .from('comprobantes_pago')
    .select(`
      id,
      monto,
      url_comprobante,
      fecha_envio,
      pedido_id,
      perfiles!comprobantes_pago_cliente_id_fkey (
        nombre_completo
      ),
      pedidos (
        id,
        monto_total,
        codigo_seguimiento,
        detalle_pedidos (
          cantidad,
          precio_unitario_snap,
          productos (
            nombre
          )
        )
      )
    `)
    .eq('estado', 'pendiente')
    .order('fecha_envio', { ascending: false });

  handleSupabaseError(error, 'Error al obtener pedidos web pendientes');

  // Mapeamos al formato esperado por la UI
  return (data || []).map(comp => ({
    id: comp.id,
    pedido_id: comp.pedido_id,
    cliente: comp.perfiles?.nombre_completo || 'Cliente Anónimo',
    fecha_hora: new Date(comp.fecha_envio).toLocaleString(),
    total: comp.monto,
    comprobante_url: comp.url_comprobante,
    codigo_pedido: comp.pedidos?.codigo_seguimiento,
    productos: (comp.pedidos?.detalle_pedidos || []).map(det => ({
      nombre: det.productos?.nombre || 'Producto Desconocido',
      cantidad: det.cantidad,
      precio: det.precio_unitario_snap
    }))
  }));
};

/**
 * Aprueba o rechaza un comprobante de pago web.
 */
export const validateWebOrder = async (comprobanteId, pedidoId, nuevoEstado, adminId) => {
  if (!IS_REAL_AUTH) {
    await delay();
    return true;
  }

  // 1. Actualizar estado del comprobante
  const { error: compError } = await supabase
    .from('comprobantes_pago')
    .update({ 
      estado: nuevoEstado,
      revisado_por: adminId,
      fecha_revision: new Date().toISOString()
    })
    .eq('id', comprobanteId);
    
  handleSupabaseError(compError, 'Error al validar el comprobante');

  // 2. Si se aprobó, actualizar el estado del pedido
  if (nuevoEstado === 'aprobado' && pedidoId) {
    const { error: pedError } = await supabase
      .from('pedidos')
      .update({ estado_pago: 'completado', estado_pedido: 'en_preparacion' })
      .eq('id', pedidoId);
      
    handleSupabaseError(pedError, 'Error al actualizar el estado del pedido');
    
    // (Opcional) Aquí también podríamos generar un registro en la tabla `pagos` 
    // o restar el stock de `productos` si no se hizo al momento de crear el pedido.
  }

  return true;
};

/**
 * Obtiene toda la data financiera (ingresos y egresos) para el dashboard.
 */
export const getFinanceDashboardData = async () => {
  if (!IS_REAL_AUTH) {
    await delay();
    return { incomes: [], expenses: [] };
  }

  // 1. Obtener Egresos (egresos_caja)
  const { data: egresos, error: eError } = await supabase
    .from('egresos_caja')
    .select('*')
    .order('fecha', { ascending: false });
    
  handleSupabaseError(eError, 'Error al cargar los egresos');

  // 2. Obtener Ingresos Físicos (pagos)
  // Join pagos → facturas → reservas para obtener fecha_creacion (la fecha real de la transacción)
  const { data: pagosFisicos, error: pError } = await supabase
    .from('pagos')
    .select(`
      id, monto_pagado, metodo_pago, referencia_transaccion,
      factura:facturas(
        id, monto_total, estado_factura,
        reserva:reservas(fecha_creacion),
        cliente:perfiles!facturas_cliente_id_fkey(nombre_completo)
      )
    `);
    
  handleSupabaseError(pError, 'Error al cargar los pagos en caja');

  // 3. Obtener Ingresos Web Aprobados (comprobantes_pago)
  const { data: pagosWeb, error: pwError } = await supabase
    .from('comprobantes_pago')
    .select('id, monto, fecha_revision, perfiles!comprobantes_pago_cliente_id_fkey(nombre_completo)')
    .eq('estado', 'aprobado')
    .order('fecha_revision', { ascending: false });
    
  handleSupabaseError(pwError, 'Error al cargar ingresos web');

  // Mapeo unificado de Egresos
  const mappedExpenses = (egresos || []).map(e => ({
    id: `egr-${e.id}`,
    fecha: e.fecha,
    tipo: 'egreso',
    concepto: e.descripcion || 'Gasto Operativo',
    monto: e.monto,
    categoria: e.categoria
  }));

  // Mapeo unificado de Ingresos Físicos
  const mappedIncomeFisico = (pagosFisicos || []).map(p => {
    // Resolver la fecha más precisa disponible: reserva → factura → hoy
    const fechaReserva = p.factura?.reserva?.fecha_creacion;
    const fechaFinal = fechaReserva || new Date().toISOString();
    const clienteNombre = p.factura?.cliente?.nombre_completo;

    return {
      id: `ing-pos-${p.id}`,
      fecha: fechaFinal,
      tipo: 'ingreso',
      concepto: clienteNombre
        ? `Cobro POS: ${clienteNombre} (${p.referencia_transaccion || 'POS'})`
        : `Cobro en Caja (${p.referencia_transaccion || 'POS'})`,
      monto: p.monto_pagado,
      metodo: p.metodo_pago
    };
  });

  // Mapeo unificado de Ingresos Web
  const mappedIncomeWeb = (pagosWeb || []).map(pw => ({
    id: `ing-web-${pw.id}`,
    fecha: pw.fecha_revision,
    tipo: 'ingreso',
    concepto: `Pedido Web: ${pw.perfiles?.nombre_completo || 'Cliente'}`,
    monto: pw.monto,
    metodo: 'qr'
  }));

  return {
    incomes: [...mappedIncomeFisico, ...mappedIncomeWeb],
    expenses: mappedExpenses
  };
};

/**
 * Registra un nuevo egreso de caja y opcionalmente sube un comprobante.
 */
export const registerExpense = async (expenseData, file, userId) => {
  if (!IS_REAL_AUTH) {
    await delay(800);
    return true;
  }

  let fileUrl = null;

  // 1. Subir archivo si existe
  if (file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `egreso_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `egresos/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('comprobantes')
      .upload(filePath, file);

    handleSupabaseError(uploadError, 'Error al subir la imagen del egreso');

    if (uploadData) {
      const { data: publicUrlData } = supabase.storage
        .from('comprobantes')
        .getPublicUrl(filePath);
      fileUrl = publicUrlData.publicUrl;
    }
  }

  // 2. Registrar en base de datos
  const { error } = await supabase
    .from('egresos_caja')
    .insert([{
      monto: expenseData.monto,
      categoria: expenseData.categoria,
      descripcion: expenseData.descripcion,
      url_factura: fileUrl,
      registrado_por: userId
    }]);

  handleSupabaseError(error, 'Error al guardar el egreso en la base de datos');

  return true;
};

/**
 * Obtiene las citas finalizadas (completadas) que aún no han sido cobradas (facturadas).
 */
export const getPendingPosBookings = async () => {
  if (!IS_REAL_AUTH) return [];

  // Obtenemos citas con estado 'completada'
  // y que la reserva_id no esté en la tabla facturas
  const { data, error } = await supabase
    .from('citas')
    .select(`
      id,
      reserva_id,
      estado,
      fecha_hora_inicio,
      reservas (
        id,
        estado_general,
        total_reserva
      ),
      mascotas (
        id,
        nombre,
        especie,
        raza
      ),
      perfiles!citas_cliente_id_fkey_mock (
        id,
        nombre_completo,
        telefono,
        datos_clientes (
          ci_nit,
          puntos_lealtad
        )
      ),
      servicios (
        id,
        nombre,
        precio_base
      )
    `)
    .eq('estado', 'completada')
    .order('fecha_hora_inicio', { ascending: false });

  // Como la foreign key directa al cliente a veces es a través de reserva, 
  // haremos una consulta a reservas si la de arriba falla, o usaremos una más simple:
  // Es más seguro consultar Reservas que tengan citas completadas.
  
  const { data: reservasCobrables, error: rError } = await supabase
    .from('reservas')
    .select(`
      id,
      cliente_id,
      fecha_creacion,
      perfiles!reservas_cliente_id_fkey (
        nombre_completo,
        telefono,
        datos_clientes (ci_nit, puntos_lealtad)
      ),
      citas (
        id,
        estado,
        fecha_hora_inicio,
        mascotas (nombre, especie, raza),
        servicios (id, nombre, precio_base)
      )
    `)
    .neq('estado_general', 'completada'); // Asumimos que cuando se cobra, se pasa a 'completada'

  if (rError) {
    console.error(rError);
    return [];
  }

  // Comparador para validar si el servicio se realizó el día de hoy (según hora local)
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();

  const isToday = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getFullYear() === todayYear &&
           d.getMonth() === todayMonth &&
           d.getDate() === todayDate;
  };

  // Filtramos solo las reservas que tengan al menos una cita completada
  const reservasValidas = (reservasCobrables || []).filter(r => 
    r.citas && r.citas.some(c => c.estado === 'completada')
  );

  return reservasValidas.map(r => {
    // Tomamos la info de la mascota de la primera cita completada (simplificación)
    const citaConMascota = r.citas.find(c => c.mascotas && c.estado === 'completada');
    const mascota = citaConMascota?.mascotas || { nombre: 'Desconocido', especie: 'Desconocido', raza: '' };
    
    // Extraemos los servicios de las citas completadas
    const servicios = r.citas
      .filter(c => c.estado === 'completada')
      .map(c => ({
        id: c.servicios?.id,
        nombre: c.servicios?.nombre,
        precio: c.servicios?.precio_base || 0
      }));

    return {
      id: r.id,
      cliente_id: r.cliente_id,
      cliente: r.perfiles?.nombre_completo || 'Cliente Invitado',
      telefono: r.perfiles?.telefono || '',
      nitCi: r.perfiles?.datos_clientes?.[0]?.ci_nit || '',
      razonSocial: r.perfiles?.nombre_completo || '',
      mascota: mascota.nombre,
      especie: mascota.especie,
      raza: mascota.raza,
      fecha_hora: new Date(r.fecha_creacion).toLocaleString(),
      puntos_lealtad: r.perfiles?.datos_clientes?.[0]?.puntos_lealtad || 0,
      servicios
    };
  });
};

/**
 * Obtiene los productos disponibles para agregar en la caja física.
 */
export const getPosProducts = async () => {
  if (!IS_REAL_AUTH) return [];

  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .gt('stock_actual', 0); // Solo con stock

  handleSupabaseError(error, 'Error al cargar productos en caja');

  return (data || []).map(p => ({
    id: p.id,
    nombre: p.nombre,
    precio_base: p.precio_base,
    stock_actual: p.stock_actual,
    emoji: p.es_insumo ? '🧴' : '📦'
  }));
};

/**
 * Procesa el pago físico en caja (factura, pago, actualiza reserva y stock).
 */
export const processPosPayment = async (invoiceData, adminId) => {
  if (!IS_REAL_AUTH) {
    await delay(800);
    return true;
  }

  // 1. Crear la Factura
  const { data: factura, error: fError } = await supabase
    .from('facturas')
    .insert([{
      reserva_id: invoiceData.reserva_id, // Necesitamos pasar el ID de reserva original
      nit_ci: invoiceData.nitCi,
      razon_social: invoiceData.razonSocial,
      monto_total: invoiceData.total,
      estado_factura: 'emitida'
    }])
    .select().single();

  handleSupabaseError(fError, 'Error al emitir factura');

  // 2. Registrar el Pago
  const { error: pError } = await supabase
    .from('pagos')
    .insert([{
      factura_id: factura.id,
      metodo_pago: invoiceData.metodoPago,
      monto_pagado: invoiceData.total,
      referencia_transaccion: 'POS'
    }]);

  handleSupabaseError(pError, 'Error al registrar el pago');

  // 3. Actualizar estado de la reserva a completada/pagada
  if (invoiceData.reserva_id) {
    await supabase
      .from('reservas')
      .update({ estado_general: 'completada' })
      .eq('id', invoiceData.reserva_id);
  }

  // 4. Reducir stock de productos vendidos al paso
  if (invoiceData.productos && invoiceData.productos.length > 0) {
    for (const prod of invoiceData.productos) {
      // Necesitamos RPC o leer y actualizar
      const { data: currProd } = await supabase.from('productos').select('stock_actual').eq('id', prod.id).single();
      if (currProd) {
        await supabase
          .from('productos')
          .update({ stock_actual: currProd.stock_actual - prod.cantidad })
          .eq('id', prod.id);
      }
    }
  }

  return true;
};

/**
 * Obtiene todos los pedidos registrados en el sistema (para entregas e historial)
 */
export const getAllOrders = async () => {
  if (!IS_REAL_AUTH) {
    await delay();
    return [];
  }

  const { data, error } = await supabase
    .from('pedidos')
    .select(`
      id,
      cliente_id,
      monto_total,
      estado_pedido,
      estado_pago,
      codigo_seguimiento,
      perfiles!pedidos_cliente_id_fkey (
        nombre_completo,
        telefono
      ),
      detalle_pedidos (
        id,
        cantidad,
        precio_unitario_snap,
        productos (
          nombre
        )
      )
    `);

  handleSupabaseError(error, 'Error al obtener todos los pedidos');

  return (data || []).map(p => ({
    id: p.id,
    cliente: p.perfiles?.nombre_completo || 'Cliente Anónimo',
    telefono: p.perfiles?.telefono || 'N/A',
    monto_total: p.monto_total,
    estado_pedido: p.estado_pedido,
    estado_pago: p.estado_pago,
    codigo_seguimiento: p.codigo_seguimiento || `BP-${p.id.substring(0, 5).toUpperCase()}`,
    productos: (p.detalle_pedidos || []).map(det => ({
      nombre: det.productos?.nombre || 'Producto Desconocido',
      cantidad: det.cantidad,
      precio: det.precio_unitario_snap
    }))
  }));
};

/**
 * Marca un pedido como entregado en la base de datos.
 */
export const deliverOrder = async (pedidoId) => {
  if (!IS_REAL_AUTH) {
    await delay();
    return true;
  }

  const { error } = await supabase
    .from('pedidos')
    .update({ estado_pedido: 'entregado' })
    .eq('id', pedidoId);

  handleSupabaseError(error, 'Error al marcar el pedido como entregado');
  return true;
};


