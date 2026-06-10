import { supabase, handleSupabaseError } from '../../../api/supabase';
import { IS_REAL_AUTH } from '../../../config';
import { getCategorias } from './adminInventoryService';

const delay = (ms = 120) => new Promise((res) => setTimeout(res, ms));

export const getPosCategories = async () => {
  return await getCategorias();
};

export const getPosProducts = async () => {
  if (!IS_REAL_AUTH) {
    await delay();
    return [];
  }
  const { data, error } = await supabase.from('productos').select('*').order('nombre');
  handleSupabaseError(error, 'Error al obtener productos para TPV');
  return data || [];
};

export const procesarVentaMostrador = async ({ items, metodoPago, clienteId, total, recepcionistaId }) => {
  if (!IS_REAL_AUTH) {
    await delay(500);
    return { exito: true, pedidoId: `mock-pedido-${Date.now()}` };
  }

  // 1. Crear Pedido
  const { data: pedido, error: pedError } = await supabase.from('pedidos').insert([{
    cliente_id: clienteId,
    monto_total: total,
    estado_pedido: 'completado',
    estado_pago: 'completado'
  }]).select().single();
  handleSupabaseError(pedError, 'Error al crear el pedido');

  // 2. Insertar Detalle de Pedidos
  const detalles = items.map(item => ({
    pedido_id: pedido.id,
    producto_id: item.id,
    cantidad: item.qty,
    precio_unitario_snap: item.precio_base
  }));
  const { error: detError } = await supabase.from('detalle_pedidos').insert(detalles);
  handleSupabaseError(detError, 'Error al guardar el detalle del pedido');

  // 3. Crear Factura
  const { data: factura, error: facError } = await supabase.from('facturas').insert([{
    cliente_id: clienteId,
    pedido_id: pedido.id,
    monto_total: total,
    estado_factura: 'emitida'
  }]).select().single();
  handleSupabaseError(facError, 'Error al emitir factura');

  // 4. Crear Pago
  const { error: pagoError } = await supabase.from('pagos').insert([{
    factura_id: factura.id,
    metodo_pago: metodoPago,
    monto_pagado: total
  }]);
  handleSupabaseError(pagoError, 'Error al registrar el pago');

  // 5. Registrar Movimientos y Actualizar Stock (Secuencial por seguridad en cliente)
  for (const item of items) {
    // 5.a Movimiento Histórico
    const { error: movError } = await supabase.from('movimientos_inventario').insert([{
      producto_id: item.id,
      usuario_id: recepcionistaId,
      tipo: 'salida',
      categoria_motivo: 'venta_mostrador',
      cantidad: item.qty,
      detalle: `Venta Mostrador - Pedido ${pedido.id}`
    }]);
    if (movError) console.error("Error insertando movimiento:", movError);

    // 5.b Actualizar Stock
    const nuevoStock = item.stock_actual - item.qty;
    const { error: stockError } = await supabase.from('productos').update({
      stock_actual: nuevoStock
    }).eq('id', item.id);
    if (stockError) console.error("Error actualizando stock:", stockError);
  }

  return { exito: true, pedidoId: pedido.id, facturaId: factura.id };
};
