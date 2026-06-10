import { supabase } from '../../../api/supabase';

export const getClientHistory = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('citas')
      .select(`
        id,
        fecha_hora_inicio,
        fecha_hora_fin,
        estado,
        mascotas ( nombre, especie, raza, foto_perfil_url ),
        servicios ( nombre, icon_name ),
        reservas!inner ( cliente_id ),
        fichas_grooming (
          id, observaciones_groomer, recomendaciones_post, nivel_suciedad,
          fotos_grooming ( url_foto, tipo_momento )
        ),
        encuestas_satisfaccion ( puntuacion_nps, comentario ),
        groomer:perfiles!citas_groomer_id_fkey ( nombre_completo, avatar_url )
      `)
      .eq('reservas.cliente_id', userId)
      .order('fecha_hora_inicio', { ascending: false });

    if (error) {
      console.error('Supabase query error (getClientHistory):', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Unexpected error in getClientHistory:', err);
    return { data: null, error: err };
  }
};

export const getGroomerHistory = async (groomerId) => {
  try {
    const { data, error } = await supabase
      .from('citas')
      .select(`
        id,
        fecha_hora_inicio,
        fecha_hora_fin,
        estado,
        mascotas ( nombre, especie, raza, foto_perfil_url ),
        servicios ( nombre, icon_name ),
        reservas!inner ( cliente_id ),
        fichas_grooming (
          id, observaciones_groomer, recomendaciones_post, nivel_suciedad,
          fotos_grooming ( url_foto, tipo_momento )
        ),
        encuestas_satisfaccion ( puntuacion_nps, comentario ),
        groomer:perfiles!citas_groomer_id_fkey ( nombre_completo, avatar_url )
      `)
      .eq('groomer_id', groomerId)
      .order('fecha_hora_inicio', { ascending: false });

    if (error) {
      console.error('Supabase query error (getGroomerHistory):', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Unexpected error in getGroomerHistory:', err);
    return { data: null, error: err };
  }
};
