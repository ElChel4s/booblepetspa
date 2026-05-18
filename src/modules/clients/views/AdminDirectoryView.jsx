import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Shield, Users, Scissors, Headphones } from 'lucide-react';
import UserCard from '../components/UserCard';
import CreateUserModal from '../../auth/components/CreateUserModal';
import { useClients } from '../hooks/useClients';
import { useAuth } from '../../../store/AuthContext';

/**
 * AdminDirectoryView — Directorio maestro de usuarios (solo Admin).
 * Muestra tarjetas de todos los usuarios con búsqueda en tiempo real.
 */
const ROLE_TABS = [
  { id: 'todos',     label: 'Todos',     color: 'bg-slate-800' },
  { id: 'cliente',   label: 'Clientes',  color: 'bg-amber-400' },
  { id: 'groomer',   label: 'Groomers',  color: 'bg-indigo-500' },
  { id: 'recepcion', label: 'Recepción', color: 'bg-teal-500' },
  { id: 'admin',     label: 'Admins',    color: 'bg-black' },
];

const AdminDirectoryView = ({ onSelectUser, canCreate = true }) => {
  const { users, loading, loadUsers } = useClients();
  const { currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [activeRole, setActiveRole] = useState('todos');
  const [isNewUserOpen, setIsNewUserOpen] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSearch = (e) => {
    const q = e.target.value;
    setSearch(q);
    loadUsers(q);
  };

  // Excluir al admin logueado del listado
  const directoryUsers = useMemo(() => {
    return users.filter(u => u.id !== currentUser?.id);
  }, [users, currentUser]);

  // Filtro combinado: rol + búsqueda
  const filteredUsers = useMemo(() => {
    if (activeRole === 'todos') return directoryUsers;
    return directoryUsers.filter(u => u.rol === activeRole);
  }, [directoryUsers, activeRole]);

  // Conteo por rol (sin el admin logueado)
  const countByRole = (roleId) =>
    roleId === 'todos' ? directoryUsers.length : directoryUsers.filter(u => u.rol === roleId).length;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-4xl font-black italic uppercase tracking-tighter">
            Control de <span className="text-[var(--primary)]">Usuarios</span>
          </h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1">
            Gestión centralizada del equipo y clientes
          </p>
        </div>

        <div className="relative group w-full md:w-96">
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Buscar por nombre o email..."
            className="w-full bg-white border-[3.5px] border-black rounded-2xl py-4 px-6 pr-14 font-black text-xs uppercase outline-none shadow-[6px_6px_0px_0px_black] focus:shadow-none transition-all"
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} strokeWidth={4} />
        </div>
      </div>

      {/* Filtros por Rol */}
      <div className="flex gap-3 mb-10 overflow-x-auto pb-3">
        {ROLE_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveRole(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 border-[3px] border-black rounded-xl font-black text-[9px] uppercase tracking-widest transition-all hover:-translate-y-0.5 whitespace-nowrap ${
              activeRole === t.id
                ? `${t.color} text-white shadow-[4px_4px_0px_0px_black] -translate-y-1`
                : 'bg-white text-slate-400'
            }`}
          >
            {t.label}
            <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-black border border-current/30 ${activeRole === t.id ? 'bg-white/20' : 'bg-slate-100'}`}>
              {countByRole(t.id)}
            </span>
          </button>
        ))}
      </div>

      {/* Grid de tarjetas */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-10 h-10 border-4 border-black border-t-[var(--primary)] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {filteredUsers.map((user, i) => (
            <UserCard key={user.id} user={user} index={i} onSelect={onSelectUser} />
          ))}

          {canCreate && (
            <button
              onClick={() => setIsNewUserOpen(true)}
              className="border-[4px] border-dashed border-black/20 rounded-[3rem] p-12 flex flex-col items-center justify-center group hover:border-[var(--primary)] hover:bg-[var(--bg)] transition-all opacity-40 hover:opacity-100"
            >
              <Plus size={48} className="text-slate-300 group-hover:text-[var(--primary)] mb-2" strokeWidth={4} />
              <span className="font-black text-xs uppercase tracking-widest text-slate-300 group-hover:text-[var(--primary)]">
                Nuevo Usuario
              </span>
            </button>
          )}
        </div>
      )}

      {canCreate && (
        <CreateUserModal
          isOpen={isNewUserOpen}
          onClose={() => setIsNewUserOpen(false)}
          onCreated={() => { loadUsers(); }}
        />
      )}
    </div>
  );
};

export default AdminDirectoryView;
