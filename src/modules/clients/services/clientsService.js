import { supabase, handleSupabaseError } from '../../../api/supabase';
import { mockUsers, mockPets } from '../../../utils/data';
import { IS_REAL_AUTH } from '../../../config';
import * as profilesService from '../../../services/profilesService';
import * as petsService from '../../../services/petsService';

/**
 * clientsService — Capa de acceso a datos del módulo Clientes.
 */

// Simula latencia de red para UX realista (solo en modo MOCK)
const delay = (ms = 120) => new Promise((res) => setTimeout(res, ms));

export const getUsers = async () => {
  if (!IS_REAL_AUTH) {
    await delay();
    return [...mockUsers];
  }
  const { data, error } = await profilesService.getAllProfiles();
  handleSupabaseError(error, 'Error al obtener usuarios');
  return data || [];
};

export const getUserById = async (id) => {
  if (!IS_REAL_AUTH) {
    await delay();
    return mockUsers.find((u) => u.id === id) ?? null;
  }
  const { data, error } = await profilesService.getProfile(id);
  handleSupabaseError(error, 'Error al obtener el perfil');
  return data;
};

export const getPetsByOwnerId = async (ownerId) => {
  if (!IS_REAL_AUTH) {
    await delay();
    return mockPets.filter((p) => p.owner_id === ownerId);
  }
  const { data, error } = await petsService.getPetsByOwner(ownerId);
  handleSupabaseError(error, 'Error al obtener mascotas');
  return data || [];
};

export const getPetById = async (id) => {
  if (!IS_REAL_AUTH) {
    await delay();
    return mockPets.find((p) => p.id === id) ?? null;
  }
  const { data, error } = await petsService.getPetDetail(id);
  handleSupabaseError(error, 'Error al obtener la mascota');
  return data;
};

export const searchUsers = async (query) => {
  if (!IS_REAL_AUTH) {
    await delay(80);
    const q = query.toLowerCase();
    return mockUsers.filter(
      (u) =>
        u.nombre_completo.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .ilike('nombre_completo', `%${query}%`);
  handleSupabaseError(error, 'Error en la búsqueda');
  return data || [];
};

// Mutaciones
export const createUser = async (userData) => {
  if (!IS_REAL_AUTH) {
    await delay(200);
    return { id: `u${Date.now()}`, ...userData, created_at: new Date().toISOString() };
  }
  // Para crear un usuario completo, usualmente se hace vía Auth y luego Perfil
  // Pero si es solo la tabla perfiles:
  const { data, error } = await supabase.from('perfiles').insert([userData]).select().single();
  handleSupabaseError(error, 'Error al crear usuario');
  return data;
};

export const updateUser = async (id, userData) => {
  if (!IS_REAL_AUTH) {
    await delay(200);
    return { id, ...userData };
  }
  const { error } = await profilesService.updateProfile(id, userData);
  handleSupabaseError(error, 'Error al actualizar usuario');
  return { id, ...userData };
};

export const createPet = async (petData) => {
  if (!IS_REAL_AUTH) {
    await delay(200);
    return { id: `m${Date.now()}`, ...petData };
  }
  const { data, error } = await petsService.createPet(petData);
  handleSupabaseError(error, 'Error al registrar mascota');
  return data;
};

export const updatePet = async (id, petData) => {
  if (!IS_REAL_AUTH) {
    await delay(200);
    return { id, ...petData };
  }
  const { data, error } = await petsService.updatePet(id, petData);
  handleSupabaseError(error, 'Error al actualizar mascota');
  return data;
};

