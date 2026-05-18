import { supabase } from '../../../api/supabase';

/**
 * logsService — Gestión de logs de auditoría.
 */

// 1. Registrar un evento de auditoría
export const registerLog = async (userId, rol, action) => {
  const userAgent = navigator.userAgent;
  
  // Obtenemos IP
  let ip = "0.0.0.0";
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const json = await res.json();
    ip = json.ip;
  } catch (e) { console.warn("No se pudo obtener IP para el log"); }

  const { error } = await supabase
    .from('logs_auditoria')
    .insert({
      perfil_id: userId,
      rol: rol || 'cliente',
      ip_address: ip,
      navegador: userAgent,
      accion: action
    });

  if (error) console.error("Error al registrar log:", error.message);
  return { error };
};

// 2. Obtener logs generales (Solo Admin)
export const getAllLogs = async (limit = 100) => {
  const { data, error } = await supabase
    .from('logs_auditoria')
    .select(`
      *,
      perfiles (nombre_completo, email)
    `)
    .order('fecha', { ascending: false })
    .limit(limit);

  return { data, error };
};

// 3. Obtener logs de un usuario específico
export const getUserLogs = async (userId, limit = 5) => {
  const { data, error } = await supabase
    .from('logs_auditoria')
    .select('*')
    .eq('perfil_id', userId)
    .order('fecha', { ascending: false })
    .limit(limit);

  return { data, error };
};
