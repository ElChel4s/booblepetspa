import { supabase, handleSupabaseError } from '../../../api/supabase';
import { IS_REAL_AUTH } from '../../../config';
import * as profilesService from '../../../services/profilesService';

/**
 * authService — Gestión de autenticación.
 */
export const login = async (email, password) => {
  if (!IS_REAL_AUTH) {
    return { user: { email, id: 'mock-id', rol: 'admin', nombre_completo: 'Admin Mock' }, error: null };
  }
  
  if (!supabase) return { user: null, error: new Error('Supabase not initialized') };

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error('[Auth Error]: Error al iniciar sesión', error.message);
    return { user: null, error };
  }

  // Si el login es exitoso, traemos el perfil completo
  const { data: profile } = await profilesService.getProfile(data.user.id);
  return { user: { ...data.user, ...profile }, error: null };
};

export const signInWithGoogle = async () => {
  if (!supabase) return { error: new Error('Supabase not initialized') };
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  });
  return { data, error };
};

export const register = async (email, password, metadata = {}) => {
  if (!IS_REAL_AUTH) {
    return { user: { email, id: 'mock-id' }, error: null };
  }

  if (!supabase) return { user: null, error: new Error('Supabase not initialized') };

  // 1. Registro en Auth (Solo guardamos metadata en Supabase Auth por ahora)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { 
      data: { 
        full_name: metadata.full_name,
        phone: metadata.phone,
        role: metadata.role || 'cliente',
        id_card: metadata.id_card,
        address: metadata.address,
        clave_modificada: false
      } 
    }
  });

  if (error) {
    handleSupabaseError(error, 'Error al registrarse');
    return { user: null, error };
  }

  return data;
};

export const verifyEmailCode = async (email, code) => {
  if (!supabase) return { error: new Error('Supabase not initialized') };
  
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: 'signup'
  });

  if (error) {
    handleSupabaseError(error, 'Código de verificación inválido');
    return { error };
  }

  // 2. AHORA QUE ESTÁ VERIFICADO, creamos el perfil real
  if (data.user) {
    const metadata = data.user.user_metadata;
    try {
      // Crear perfil base
      const { error: profileError } = await supabase.from('perfiles').upsert([{
        id: data.user.id,
        email: data.user.email,
        nombre_completo: metadata.full_name,
        rol: metadata.role || 'cliente',
        telefono: metadata.phone
      }]);

      if (profileError) throw profileError;

      // Crear datos de cliente si corresponde
      if (metadata.role === 'cliente') {
        await supabase.from('datos_clientes').upsert([{
          perfil_id: data.user.id,
          ci_nit: metadata.id_card,
          direccion: metadata.address
        }]);
      }
    } catch (e) {
      console.error("[Verification Error] Error creating profile after OTP:", e);
      // Podríamos devolver un error aquí si el perfil es crítico
    }
  }

  return { data, error: null };
};


export const resendOtp = async (email) => {
  if (!supabase) return { error: new Error('Supabase not initialized') };
  
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email
  });

  if (error) {
    handleSupabaseError(error, 'Error al reenviar el código');
    return { error };
  }

  return { error: null };
};



// ─── Password Management ─────────────────────────────────────────────────────

export const verifyCurrentPassword = async (email, password) => {
  if (!IS_REAL_AUTH) return { error: null };
  if (!supabase) return { error: new Error('Supabase not initialized') };
  
  // Intentamos un login silencioso para verificar la clave
  // NOTA: Esto puede degradar la sesión de AAL2 a AAL1 si hay MFA
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error };
};

export const updatePassword = async (newPassword) => {
  if (!IS_REAL_AUTH) return { error: null };
  if (!supabase) return { error: new Error('Supabase not initialized') };
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { error };
};

export const markPasswordAsChanged = async () => {
  if (!IS_REAL_AUTH) return { error: null };
  if (!supabase) return { error: new Error('Supabase not initialized') };
  const { error } = await supabase.auth.updateUser({ data: { clave_modificada: true } });
  return { error };
};

export const sendPasswordResetEmail = async (email) => {
  if (!IS_REAL_AUTH) return { error: null };
  if (!supabase) return { error: new Error('Supabase not initialized') };
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/?recovery=true'
  });
  return { error };
};


export const logout = async () => {
  if (!IS_REAL_AUTH) return { error: null };
  if (!supabase) return { error: null };

  const { error } = await supabase.auth.signOut();
  handleSupabaseError(error, 'Error al cerrar sesión');
  return { error };
};

export const getCurrentUser = async () => {
  if (!IS_REAL_AUTH) return { user: { id: 'mock-id', rol: 'admin', nombre_completo: 'Admin Mock' }, error: null };
  
  if (!supabase) return { user: null, error: null };

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { user: null, error: authError };

  // Traer perfil completo
  const { data: profile, error: profileError } = await profilesService.getProfile(user.id);
  return { user: { ...user, ...profile }, error: profileError };
};


export const listMfaFactors = async () => {
  if (!supabase) return { data: null, error: new Error('Supabase not initialized') };
  const { data, error } = await supabase.auth.mfa.listFactors();
  return { data, error };
};

export const unenrollMfaFactor = async (factorId) => {
  if (!supabase) return { error: new Error('Supabase not initialized') };
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  return { error };
};

export const mfaChallenge = async (factorId) => {
  if (!supabase) return { data: null, error: new Error('Supabase not initialized') };
  const { data, error } = await supabase.auth.mfa.challenge({ factorId });
  return { data, error };
};

export const mfaVerify = async (factorId, challengeId, code) => {
  if (!supabase) return { data: null, error: new Error('Supabase not initialized') };
  const { data, error } = await supabase.auth.mfa.verify({ factorId, challengeId, code });
  return { data, error };
};
