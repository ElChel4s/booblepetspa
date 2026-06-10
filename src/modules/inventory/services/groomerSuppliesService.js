import { supabase } from '../../../api/supabase';

// Helper for error handling
const handleSupabaseError = (error, context) => {
  if (error) {
    console.error(`[Supabase Error] ${context}:`, error);
    throw new Error(error.message);
  }
};

/**
 * Obtener productos configurados como insumos
 */
export const fetchInsumos = async () => {
  const { data, error } = await supabase
    .from('productos')
    .select('*, categorias_productos(nombre)')
    .eq('es_insumo', true)
    .order('nombre', { ascending: true });

  handleSupabaseError(error, 'Error al obtener insumos');
  return data;
};

/**
 * Registrar un retiro de insumo por un groomer
 * @param {string} producto_id 
 * @param {string} groomer_id 
 * @param {number} cantidad 
 * @param {string} motivo 
 */
export const registrarRetiroInsumo = async (producto_id, groomer_id, cantidad, motivo) => {
  // 1. Registrar en retiros_insumo
  const { data: retiro, error: retiroError } = await supabase
    .from('retiros_insumo')
    .insert([{
      producto_id,
      groomer_id,
      cantidad,
      motivo
    }])
    .select()
    .single();

  handleSupabaseError(retiroError, 'Error al registrar el retiro de insumo');

  // Si existe un trigger en la BD, la inserción anterior ya debería descontar 
  // stock de productos e insertar en movimientos_inventario. 
  // Por precaución o si el trigger no cubre movimientos_inventario, 
  // podríamos llamar al RPC o hacerlo manual, pero asumimos que el trigger lo hace.
  
  return retiro;
};
