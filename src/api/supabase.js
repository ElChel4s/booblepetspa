import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Inicialización del cliente de Supabase
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!supabase) {
  console.warn('⚠️ Supabase no se ha inicializado. Revisa tus variables de entorno en el archivo .env');
}


/**
 * Helper para manejar errores de Supabase de forma consistente
 */
export const handleSupabaseError = (error, customMsg = 'Error en la base de datos') => {
  if (error) {
    console.error(`[Supabase Error]: ${customMsg}`, error);
    throw error;
  }
};
