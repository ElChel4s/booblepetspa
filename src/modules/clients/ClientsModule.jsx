import { useState, useCallback } from 'react';
import { useAuth } from '../../store/AuthContext';
import { mockUsers } from '../../utils/data';
import { useClients } from './hooks/useClients';

import AdminDirectoryView from './views/AdminDirectoryView';
import UserFileView from './views/UserFileView';
import PetDetailView from './views/PetDetailView';

/**
 * ClientsModule — Orquestador del módulo de Clientes & Mascotas.
 *
 * Maneja la navegación interna del módulo:
 *   Admin:   Directorio → Expediente usuario → Detalle mascota
 *   Cliente: Expediente propio → Detalle mascota
 *   Groomer: Detalle mascota asignada en turno
 *
 * El estado de navegación interno (selectedUser, selectedPet) vive aquí
 * para no contaminar el estado global de la app.
 */
const ClientsModule = () => {
  const { rolActual, currentUser, profileMode, setProfileMode } = useAuth();

  // Estado de navegación interna
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPet, setSelectedPet] = useState(null);
  const { loadUsers } = useClients();

  // Callback para cuando un usuario es desactivado/reactivado
  const handleUserUpdated = useCallback(() => {
    setSelectedUser(null);  // Volver al directorio
    loadUsers();            // Recargar la lista fresca de Supabase
  }, [loadUsers]);

  // Usuario autenticado simulado (en producción vendrá de Supabase Auth)
  const resolvedUser = currentUser || mockUsers[0];

  // Dueño de la mascota seleccionada (para PetDetailView)
  const petOwner = selectedPet
    ? mockUsers.find((u) => selectedUser?.id === u.id || u.id === selectedPet.owner_id)
    : null;

  // ── Admin o Cliente: con selección de mascota ──
  if (selectedPet) {
    return (
      <PetDetailView
        pet={selectedPet}
        owner={petOwner}
        onBack={() => setSelectedPet(null)}
        mode={rolActual}
      />
    );
  }

  // ── Admin o Recepción: directorio → expediente usuario ──
  if (rolActual === 'admin' || rolActual === 'recepcion') {
    if (profileMode === 'self') {
      return (
        <UserFileView
          user={resolvedUser}
          viewerRole={rolActual}
          viewingProfileMode="personal"
          onBack={() => setProfileMode('directory')}
          onSelectPet={setSelectedPet}
        />
      );
    }
    if (selectedUser) {
      return (
        <UserFileView
          user={selectedUser}
          viewerRole={rolActual}
          viewingProfileMode="admin_view"
          onBack={() => setSelectedUser(null)}
          onSelectPet={setSelectedPet}
          onUserUpdated={handleUserUpdated}
        />
      );
    }
    return <AdminDirectoryView onSelectUser={setSelectedUser} canCreate={rolActual === 'admin'} />;
  }

  // ── Cliente/Groomer: expediente propio ──
  return (
    <UserFileView
      user={resolvedUser}
      viewerRole={rolActual}
      viewingProfileMode="personal"
      onBack={() => {}}
      onSelectPet={setSelectedPet}
    />
  );
};

export default ClientsModule;
