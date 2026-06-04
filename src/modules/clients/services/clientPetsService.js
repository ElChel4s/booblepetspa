import { supabase } from '../../../api/supabase';

export const getPetsByOwner = async (ownerId) => {
  if (!supabase) return { data: [], error: null };
  return supabase
    .from('mascotas')
    .select('id, nombre, especie, raza, tamano, temperamento, alergias, foto_perfil_url')
    .eq('dueno_id', ownerId)
    .order('nombre');
};

export const createPet = async (ownerId, petData) => {
  if (!supabase) return { data: null, error: new Error('Supabase no configurado') };
  return supabase
    .from('mascotas')
    .insert({
      dueno_id: ownerId,
      nombre: petData.nombre,
      especie: petData.especie,
      raza: petData.raza || null,
      tamano: petData.tamano || null,
      temperamento: petData.temperamento || null,
      alergias: petData.alergias || null,
    })
    .select()
    .single();
};

export const updatePet = async (petId, petData) => {
  if (!supabase) return { data: null, error: new Error('Supabase no configurado') };
  return supabase
    .from('mascotas')
    .update(petData)
    .eq('id', petId)
    .select()
    .single();
};

export const deletePet = async (petId) => {
  if (!supabase) return { error: new Error('Supabase no configurado') };
  return supabase
    .from('mascotas')
    .delete()
    .eq('id', petId);
};
