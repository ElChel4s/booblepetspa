import { supabase, handleSupabaseError } from '../../../api/supabase';
import { IS_REAL_AUTH } from '../../../config';

const delay = (ms = 150) => new Promise((res) => setTimeout(res, ms));

export const getStoreCatalog = async () => {
  if (!IS_REAL_AUTH) {
    await delay();
    // Fallback simulado
    return { productos: [], servicios: [], modificadores: [] };
  }

  // 1. Obtener Productos Activos
  const { data: prods, error: pError } = await supabase
    .from('productos')
    .select('*, categorias_productos(nombre)')
    .order('nombre');
  handleSupabaseError(pError, 'Error al cargar productos de la tienda');

  // Mapear al formato de UI esperado
  const productos = (prods || []).map(p => ({
    id: p.id,
    tipo: 'producto',
    nombre: p.nombre,
    precio_base: p.precio_base,
    categoria: p.categorias_productos?.nombre || 'General',
    emoji: p.es_insumo ? '🧴' : '📦',
    stock: p.stock_actual,
    descripcion: 'Producto de alta calidad para el cuidado de tu mascota.',
    color: 'bg-emerald-400'
  }));

  // 2. Obtener Servicios Activos
  const { data: servs, error: sError } = await supabase
    .from('servicios')
    .select('*')
    .order('nombre');
  handleSupabaseError(sError, 'Error al cargar servicios del spa');

  const servicios = (servs || []).map(s => ({
    id: s.id,
    tipo: 'servicio',
    nombre: s.nombre,
    precio_base: s.precio_base,
    categoria: s.categoria || 'SPA',
    emoji: s.icon_name === 'Scissors' ? '✂️' : '🛁',
    duracion: s.duracion_base_minutos,
    descripcion: s.descripcion || 'Servicio profesional para el bienestar de tu compañero.',
    pasos: [
      { titulo: 'Preparación', desc: 'Revisión y acondicionamiento inicial.' },
      { titulo: 'Servicio Principal', desc: 'Ejecución profesional del servicio contratado.' },
      { titulo: 'Finalización', desc: 'Toques finales y entrega de mascota.' }
    ],
    color: 'bg-cyan-400'
  }));

  // 3. Obtener Modificadores de Servicio (para recargos dinámicos)
  const { data: mods, error: mError } = await supabase
    .from('modificadores_servicio')
    .select('*');
  handleSupabaseError(mError, 'Error al cargar modificadores');

  return { productos, servicios, modificadores: mods || [] };
};

export const getUserPets = async (userId) => {
  if (!IS_REAL_AUTH || !userId) return [];
  const { data, error } = await supabase.from('mascotas').select('*').eq('dueno_id', userId);
  handleSupabaseError(error, 'Error al obtener tus mascotas');
  
  return (data || []).map(m => ({
    id: m.id,
    nombre: m.nombre,
    especie: m.especie,
    raza: m.raza,
    tamano: m.tamano,
    temperamento: m.temperamento,
    avatar: m.especie === 'gato' ? '🐈' : '🐕'
  }));
};

/**
 * Procesa la orden proveniente del cliente web.
 * Maneja inserciones mixtas: Pedidos de productos y Reservas de servicios.
 */
export const procesarOrdenWeb = async (cart, guestData, scheduleData, clientId = null, comprobanteFile = null) => {
  if (!IS_REAL_AUTH) {
    await delay(600);
    return { success: true, orderCode: 'BP-MOCK' };
  }

  const productos = cart.filter(i => i.tipo === 'producto');
  const servicios = cart.filter(i => i.tipo === 'servicio');
  
  const guestClientUUID = '99999999-9999-9999-9999-999999999999'; // UUID comodin para invitados si es necesario, o null

  let lastPedidoId = null;
  let totalMontoProductos = 0;

  // 1. FLUJO PRODUCTOS -> public.pedidos & public.detalle_pedidos
  if (productos.length > 0) {
    totalMontoProductos = productos.reduce((acc, p) => acc + (p.precio_final * p.qty), 0);
    
    const { data: pedido, error: pedError } = await supabase.from('pedidos').insert([{
      cliente_id: clientId || guestClientUUID,
      monto_total: totalMontoProductos,
      estado_pedido: 'pendiente',
      estado_pago: 'pendiente'
    }]).select().single();
    handleSupabaseError(pedError, 'Error al procesar el pedido de productos');

    lastPedidoId = pedido.id;

    const detalles = productos.map(p => ({
      pedido_id: pedido.id,
      producto_id: p.id,
      cantidad: p.qty,
      precio_unitario_snap: p.precio_final
    }));
    
    const { error: detError } = await supabase.from('detalle_pedidos').insert(detalles);
    handleSupabaseError(detError, 'Error al procesar el detalle del pedido');
  }

  // 2. FLUJO SERVICIOS -> public.reservas & public.citas
  if (servicios.length > 0) {
    const totalReserva = servicios.reduce((acc, s) => acc + (s.precio_final * s.qty), 0);

    const { data: reserva, error: resError } = await supabase.from('reservas').insert([{
      cliente_id: clientId || guestClientUUID,
      estado_general: 'pendiente',
      origen: 'web',
      total_reserva: totalReserva,
      nombre_invitado: guestData?.nombre || null,
      telefono_invitado: guestData?.telefono || null,
      ci_invitado: guestData?.ci || null
    }]).select().single();
    handleSupabaseError(resError, 'Error al procesar la reserva del spa');

    const citas = servicios.map(s => {
      // Calculamos fecha fin estimando la duracion (muy basico)
      const duracionEstimadaMs = (s.duracion || 60) * 60000;
      const fechaHoraInicioStr = `${scheduleData.fecha}T${scheduleData.hora}:00`;
      const fechaHoraInicio = new Date(fechaHoraInicioStr);
      const fechaHoraFin = new Date(fechaHoraInicio.getTime() + duracionEstimadaMs);

      return {
        reserva_id: reserva.id,
        servicio_id: s.id,
        mascota_id: s.pet_asignado ? s.pet_asignado.id : null,
        fecha_hora_inicio: fechaHoraInicio.toISOString(),
        fecha_hora_fin: fechaHoraFin.toISOString(),
        estado: 'programada'
      };
    });

    const { error: citasError } = await supabase.from('citas').insert(citas);
    handleSupabaseError(citasError, 'Error al agendar las citas individuales');
  }

  // 3. Subir comprobante y registrar si aplica (Pagos QR de productos)
  if (lastPedidoId && comprobanteFile) {
    const fileExt = comprobanteFile.name.split('.').pop();
    const fileName = `${lastPedidoId}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('comprobantes')
      .upload(filePath, comprobanteFile);
    
    handleSupabaseError(uploadError, 'Error al subir el comprobante al servidor');

    const { data: publicUrlData } = supabase.storage
      .from('comprobantes')
      .getPublicUrl(filePath);

    const { error: compError } = await supabase.from('comprobantes_pago').insert([{
      pedido_id: lastPedidoId,
      url_comprobante: publicUrlData.publicUrl,
      monto_declarado: totalMontoProductos,
      estado_validacion: 'pendiente'
    }]);
    
    handleSupabaseError(compError, 'Error al registrar el comprobante en la base de datos');
  }

  // Generamos codigo aleatorio para mostrar al cliente
  const orderCode = 'BP-' + Math.random().toString(36).substr(2, 5).toUpperCase();
  return { success: true, orderCode };
};
