import { useState, useCallback } from 'react';
import * as clientsService from '../services/clientsService';

/**
 * useClients — Hook de estado para el módulo de Clientes y Mascotas.
 *
 * Centraliza carga, búsqueda y selección de usuarios/mascotas.
 * Preparado para swap a Supabase: solo cambiar clientsService.
 */
export const useClients = () => {
  const [users, setUsers] = useState([]);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadUsers = useCallback(async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const data = query
        ? await clientsService.searchUsers(query)
        : await clientsService.getUsers();
      setUsers(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPetsByOwner = useCallback(async (ownerId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await clientsService.getPetsByOwnerId(ownerId);
      setPets(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    users,
    pets,
    loading,
    error,
    loadUsers,
    loadPetsByOwner,
  };
};
