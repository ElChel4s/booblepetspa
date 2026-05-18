import { supabase, handleSupabaseError } from '../api/supabase';

/**
 * petsService — Gestión de mascotas.
 */

export const getPetsByOwner = async (ownerId) => {
  const { data, error } = await supabase
    .from('mascotas')
    .select('*')
    .eq('dueno_id', ownerId);
  
  return { data, error };
};

export const getPetDetail = async (id) => {
  const { data, error } = await supabase
    .from('mascotas')
    .select(`
      *,
      dueno:perfiles(*)
    `)
    .eq('id', id)
    .single();
  
  return { data, error };
};

export const createPet = async (petData) => {
  const { data, error } = await supabase
    .from('mascotas')
    .insert([petData])
    .select()
    .single();
  
  return { data, error };
};

export const updatePet = async (id, petData) => {
  const { data, error } = await supabase
    .from('mascotas')
    .update(petData)
    .eq('id', id)
    .select()
    .single();
  
  return { data, error };
};

export const deletePet = async (id) => {
  const { error } = await supabase
    .from('mascotas')
    .delete()
    .eq('id', id);
  
  return { error };
};
