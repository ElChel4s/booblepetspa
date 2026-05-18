import { supabase } from '../../../api/supabase';

/**
 * sessionsService — Gestión de sesiones activas del usuario.
 */

// 1. Obtener todas las sesiones del usuario
export const getActiveSessions = async (userId) => {
  const { data, error } = await supabase
    .from('sesiones_activas')
    .select('*')
    .eq('perfil_id', userId)
    .order('last_active', { ascending: false });

  return { data, error };
};

// 2. Registrar la sesión actual
export const registerCurrentSession = async (userId) => {
  const userAgent = navigator.userAgent;
  let deviceName = "Navegador Web";
  let deviceType = "desktop";

  // Detección simple de dispositivo
  if (/Android/i.test(userAgent)) { deviceName = "Android Phone"; deviceType = "mobile"; }
  else if (/iPhone/i.test(userAgent)) { deviceName = "iPhone"; deviceType = "mobile"; }
  else if (/iPad/i.test(userAgent)) { deviceName = "iPad"; deviceType = "tablet"; }
  else if (/Windows/i.test(userAgent)) { deviceName = "Windows PC"; }
  else if (/Mac/i.test(userAgent)) { deviceName = "MacBook"; }

  // Obtenemos IP (opcional, usando un servicio gratuito)
  let ip = "0.0.0.0";
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const json = await res.json();
    ip = json.ip;
  } catch (e) { console.warn("No se pudo obtener IP"); }

  const { data, error } = await supabase
    .from('sesiones_activas')
    .upsert({
      perfil_id: userId,
      nombre_dispositivo: `${deviceName} (${navigator.vendor || 'Web'})`,
      tipo_dispositivo: deviceType,
      ip_address: ip,
      last_active: new Date()
    }, { onConflict: 'perfil_id, nombre_dispositivo' })
    .select()
    .single();

  // Guardar el ID de ESTA sesión en localStorage para identificarla luego
  if (data?.id) {
    localStorage.setItem('current_session_id', data.id);
  }

  return { data, error };
};

// Helper: obtener el ID de la sesión actual
export const getCurrentSessionId = () => {
  return localStorage.getItem('current_session_id');
};

// 3. Revocar una sesión (Cerrar sesión remotamente)
export const revokeSession = async (sessionId) => {
  const { error } = await supabase
    .from('sesiones_activas')
    .delete()
    .eq('id', sessionId);
    
  return { error };
};
