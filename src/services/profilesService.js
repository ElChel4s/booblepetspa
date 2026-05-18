import { supabase, handleSupabaseError } from '../api/supabase';

/**
 * profilesService — Gestión de perfiles de usuario (Admin, Recepción, Groomer, Cliente).
 */

export const getProfile = async (id) => {
  // Obtenemos el perfil base
  const { data: profile, error } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return { data: null, error };

  // Dependiendo del rol, traemos datos adicionales
  if (profile.rol === 'cliente') {
    const { data: clientData } = await supabase
      .from('datos_clientes')
      .select('*')
      .eq('perfil_id', id)
      .maybeSingle();
    return { data: { ...profile, ...clientData }, error: null };
  }

  if (profile.rol === 'groomer') {
    const { data: groomerData } = await supabase
      .from('datos_groomers')
      .select('*')
      .eq('perfil_id', id)
      .maybeSingle();
    return { data: { ...profile, ...groomerData }, error: null };
  }


  return { data: profile, error: null };
};

export const getProfileByEmail = async (email) => {
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .eq('email', email)
    .single();
  return { data, error };
};

export const updateProfile = async (id, data) => {
  const { nombre_completo, telefono, avatar_url, mfa_activado, email, ...extraData } = data;

  // 1. Actualizar tabla base perfiles
  const { error: profileError } = await supabase
    .from('perfiles')
    .update({ 
      nombre_completo, 
      telefono, 
      avatar_url, 
      mfa_activado,
      email,
      updated_at: new Date() 
    })
    .eq('id', id);

  if (profileError) return { error: profileError };

  // 2. Upsert en tablas específicas según rol (por si no existe el registro extra)
  if (data.rol === 'cliente') {
    const { error: clientError } = await supabase
      .from('datos_clientes')
      .upsert({
        perfil_id: id,
        ci_nit: extraData.ci_nit,
        direccion: extraData.direccion
      });
    if (clientError) return { error: clientError };
  }

  if (data.rol === 'groomer') {
    const { error: groomerError } = await supabase
      .from('datos_groomers')
      .upsert({
        perfil_id: id,
        especialidad: extraData.especialidad,
        biografia: extraData.biografia
      });
    if (groomerError) return { error: groomerError };
  }

  return { error: null };
};

export const getAllProfiles = async (roleFilter = null) => {
  let query = supabase.from('perfiles').select('*');
  
  if (roleFilter && roleFilter !== 'todos') {
    query = query.eq('rol', roleFilter);
  }

  const { data, error } = await query;
  return { data, error };
};

export const deleteProfile = async (id) => {
  // Llamamos a la función de Postgres que borra en Auth y en Public
  const { error } = await supabase.rpc('admin_delete_user', {
    target_user_id: id
  });
  
  if (error) {
    handleSupabaseError(error, 'Error al eliminar el usuario completamente');
    return { error };
  }

  return { error: null };
};


/**
 * createUserByAdmin — El admin crea un usuario.
 * Contraseña temporal = CI del usuario.
 * Después del registro se envía un correo de recuperación
 * para que el usuario establezca su propia contraseña.
 */
export const createUserByAdmin = async (formData) => {
  const { nombre_completo, email, telefono, rol, ci_nit, direccion, especialidad, biografia } = formData;

  // La contraseña temporal es su CI (o un fallback genérico si no tiene CI)
  const tempPassword = ci_nit || 'BubblePetSpa2024!';

  // 1. Crear usuario en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: tempPassword,
    options: {
      data: {
        full_name: nombre_completo,
        role: rol,
        phone: telefono,
        id_card: ci_nit,
        address: direccion,
      }
    }
  });

  if (authError) return { data: null, error: authError };
  const userId = authData.user?.id;
  if (!userId) return { data: null, error: new Error('No se pudo obtener el ID del usuario') };

  // 2. Insertar perfil base
  const { error: profileError } = await supabase.from('perfiles').upsert([{
    id: userId,
    email,
    nombre_completo,
    rol,
    telefono,
  }]);
  if (profileError) return { data: null, error: profileError };

  // 3. Insertar datos específicos del rol
  if (rol === 'cliente') {
    await supabase.from('datos_clientes').upsert([{ perfil_id: userId, ci_nit, direccion }]);
  }
  if (rol === 'groomer') {
    await supabase.from('datos_groomers').upsert([{ perfil_id: userId, especialidad, biografia }]);
  }

  // 4. Enviar correo para que el usuario establezca su propia contraseña
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/?recovery=true'
  });

  return { data: { id: userId, email, nombre_completo, rol }, error: null };
};

/**
 * toggleUserStatus — Cambia el estado activo/inactivo de un usuario (Soft Delete).
 */
export const toggleUserStatus = async (userId, activeStatus) => {
  const { error } = await supabase
    .from('perfiles')
    .update({ activo: activeStatus })
    .eq('id', userId);

  return { error };
};
