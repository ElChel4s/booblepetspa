import { supabase, handleSupabaseError } from '../../../api/supabase';
import { IS_REAL_AUTH } from '../../../config';

// Constants
export const CATEGORIAS_MOVIMIENTO = {
  ingreso: [
    { id: 'compra_proveedor', label: 'Compra a Proveedor' },
    { id: 'devolucion_cliente', label: 'Devolución de Cliente' },
    { id: 'ajuste_positivo', label: 'Ajuste (Sobró/Encontrado)' }
  ],
  salida: [
    { id: 'uso_interno', label: 'Uso Interno en Spa' },
    { id: 'venta_mostrador', label: 'Venta Directa a Cliente' },
    { id: 'merma_dano', label: 'Merma (Daño/Vencido)' },
    { id: 'ajuste_negativo', label: 'Ajuste (Pérdida/Robo)' }
  ]
};

const delay = (ms = 120) => new Promise((res) => setTimeout(res, ms));

export const getCategorias = async () => {
  if (!IS_REAL_AUTH) {
    await delay();
    return [
      { id: 'cat1', nombre: 'Baño y Estética' },
      { id: 'cat2', nombre: 'Juguetes' },
      { id: 'cat3', nombre: 'Nutrición' }
    ];
  }
  const { data, error } = await supabase.from('categorias_productos').select('*');
  handleSupabaseError(error, 'Error al obtener categorías');
  return data || [];
};

export const getPerfilesAdmin = async () => {
  if (!IS_REAL_AUTH) {
    await delay();
    return [
      { id: 'g1', nombre_completo: 'Elena S. (Groomer)', rol: 'groomer' },
      { id: 'g2', nombre_completo: 'Carlos R. (Estilista)', rol: 'groomer' },
      { id: 'r1', nombre_completo: 'Recepción Principal', rol: 'recepcion' }
    ];
  }
  const { data, error } = await supabase.from('perfiles').select('id, nombre_completo, rol');
  handleSupabaseError(error, 'Error al obtener perfiles');
  return data || [];
};

export const getProductos = async () => {
  if (!IS_REAL_AUTH) {
    await delay();
    return [];
  }
  const { data, error } = await supabase.from('productos').select('*').order('nombre');
  handleSupabaseError(error, 'Error al obtener productos');
  return data || [];
};

export const getMovimientos = async () => {
  if (!IS_REAL_AUTH) {
    await delay();
    return [];
  }
  const { data, error } = await supabase.from('movimientos_inventario').select('*').order('fecha', { ascending: false });
  handleSupabaseError(error, 'Error al obtener movimientos');
  return data || [];
};

export const upsertProducto = async (producto) => {
  if (!IS_REAL_AUTH) {
    await delay(300);
    return { ...producto, id: producto.id || `p_${Date.now()}` };
  }
  
  if (!producto.id) {
    // Insert new
    const { data, error } = await supabase.from('productos').insert([{
      nombre: producto.nombre,
      categoria_id: producto.categoria_id,
      precio_base: producto.precio_base,
      stock_minimo_alerta: producto.stock_minimo_alerta,
      stock_actual: producto.stock_actual,
      es_insumo: producto.es_insumo
    }]).select().single();
    handleSupabaseError(error, 'Error al crear producto');
    return data;
  } else {
    // Update
    const { data, error } = await supabase.from('productos').update({
      nombre: producto.nombre,
      categoria_id: producto.categoria_id,
      precio_base: producto.precio_base,
      stock_minimo_alerta: producto.stock_minimo_alerta,
      es_insumo: producto.es_insumo
      // NOTE: stock_actual shouldn't be updated directly via ABM once created, only via movements.
    }).eq('id', producto.id).select().single();
    handleSupabaseError(error, 'Error al actualizar producto');
    return data;
  }
};

/**
 * Handles all stock movements and corresponding records in other tables
 * according to the selected motive.
 */
export const registrarMovimiento = async (payload, productoInfo) => {
  if (!IS_REAL_AUTH) {
    await delay(300);
    return { ...payload, id: `m_${Date.now()}`, fecha: new Date().toISOString() };
  }

  const { producto_id, usuario_id, tipo, categoria_motivo, cantidad, detalle } = payload;
  const qty = parseInt(cantidad);
  
  // To ensure atomic transactions in Supabase, we should ideally use a stored procedure (RPC).
  // However, since we can't create an RPC from the client, we will execute sequential queries
  // and handle failures as best as possible. (In a real production app, an RPC is strictly recommended here).

  let movResult;

  // 1. Determine extra table inserts
  if (tipo === 'salida' && categoria_motivo === 'venta_mostrador') {
    // A) Insert Pedido
    const { data: pedido, error: pedError } = await supabase.from('pedidos').insert([{
      cliente_id: usuario_id, // Recepcionista who makes the sale, or generic 'mostrador' client if implemented
      monto_total: productoInfo.precio_base * qty,
      estado_pedido: 'completado',
      estado_pago: 'completado'
    }]).select().single();
    handleSupabaseError(pedError, 'Error al crear pedido');

    // B) Insert Detalle Pedido
    const { error: detError } = await supabase.from('detalle_pedidos').insert([{
      pedido_id: pedido.id,
      producto_id: producto_id,
      cantidad: qty,
      precio_unitario_snap: productoInfo.precio_base
    }]);
    handleSupabaseError(detError, 'Error al crear detalle de pedido');
  } 
  else if (tipo === 'salida' && categoria_motivo === 'uso_interno') {
    // A) Insert Retiro Insumo
    const { error: retError } = await supabase.from('retiros_insumo').insert([{
      producto_id: producto_id,
      groomer_id: usuario_id, // Responsible groomer
      cantidad: qty,
      motivo: detalle || 'Retiro interno desde almacén'
    }]);
    handleSupabaseError(retError, 'Error al registrar retiro de insumo');
  }

  // 2. Insert Movimiento Log
  const { data: movimiento, error: movError } = await supabase.from('movimientos_inventario').insert([{
    producto_id,
    usuario_id,
    tipo,
    categoria_motivo,
    cantidad: qty,
    detalle
  }]).select().single();
  handleSupabaseError(movError, 'Error al registrar movimiento en historial');
  movResult = movimiento;

  // 3. Update Stock in Productos
  const nuevoStock = tipo === 'ingreso' ? productoInfo.stock_actual + qty : productoInfo.stock_actual - qty;
  const { error: updateError } = await supabase.from('productos').update({
    stock_actual: nuevoStock
  }).eq('id', producto_id);
  handleSupabaseError(updateError, 'Error al actualizar el stock del producto');

  return { mov: movResult, nuevoStock };
};
