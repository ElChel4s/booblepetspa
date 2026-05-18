import React from 'react';
import { Search, Mail, Phone, ChevronRight, UserPlus, Shield, Users, Scissors, Headphones } from 'lucide-react';
import PopButton from './PopButton';

// ─── Mapa de estilos por rol ──────────────────────────────────────────────────
const ROL_CONFIG = {
  admin:     { label: 'Admin',      color: 'bg-black text-white',          icon: Shield },
  recepcion: { label: 'Recepción',  color: 'bg-teal-500 text-white',       icon: Headphones },
  groomer:   { label: 'Groomer',    color: 'bg-indigo-500 text-white',     icon: Scissors },
  cliente:   { label: 'Cliente',    color: 'bg-amber-400 text-black',      icon: Users },
};

// ─── Header ───────────────────────────────────────────────────────────────────
export const DirectoryHeader = ({ onSearch, searchQuery, onCreateUser, viewerRole, setView }) => (
  <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
    <div>
      <h2 className="text-5xl font-black italic uppercase tracking-tighter">
        Control de <span className="text-[var(--primary)]">Usuarios</span>
      </h2>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2 italic">
        Gestión centralizada del equipo y clientes
      </p>
    </div>

    <div className="flex gap-4 w-full md:w-auto">
      {/* Búsqueda en tiempo real */}
      <div className="relative flex-1 md:w-80">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="BUSCAR USUARIO..."
          className="w-full bg-white border-[3.5px] border-black rounded-2xl py-4 px-6 pr-12 font-black text-xs uppercase outline-none shadow-[6px_6px_0px_0px_black] focus:shadow-[6px_6px_0px_0px_var(--primary)] transition-all"
        />
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} strokeWidth={4} />
      </div>

      {/* Botón crear solo para admins */}
      {viewerRole === 'admin' && (
        <div className="flex gap-2">
          <PopButton
            variant="outline"
            icon={Shield}
            onClick={() => setView('audit_logs')}
            full={false}
            className="whitespace-nowrap bg-slate-50 border-slate-300"
          >
            Ver Auditoría
          </PopButton>
          <PopButton
            variant="primary"
            icon={UserPlus}
            onClick={onCreateUser}
            full={false}
            className="whitespace-nowrap"
          >
            Nuevo Usuario
          </PopButton>
        </div>
      )}
    </div>
  </header>
);

// ─── Filtros por Rol ──────────────────────────────────────────────────────────
const TABS = [
  { id: 'todos',     label: 'Todos',     accent: 'bg-slate-800' },
  { id: 'cliente',   label: 'Clientes',  accent: 'bg-amber-400' },
  { id: 'groomer',   label: 'Groomers',  accent: 'bg-indigo-500' },
  { id: 'recepcion', label: 'Recepción', accent: 'bg-teal-500' },
  { id: 'admin',     label: 'Admins',    accent: 'bg-black' },
];

export const DirectoryFilters = ({ activeTab, onTabChange, users }) => {
  const countByTab = (tabId) =>
    tabId === 'todos' ? users.length : users.filter(u => u.rol === tabId).length;

  return (
    <div className="flex gap-3 mb-10 overflow-x-auto pb-4">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onTabChange(t.id)}
          className={`flex items-center gap-2 px-5 py-2.5 border-[3px] border-black rounded-xl font-black text-[9px] uppercase tracking-widest transition-all hover:-translate-y-0.5 whitespace-nowrap ${
            activeTab === t.id
              ? `${t.accent} text-white shadow-[4px_4px_0px_0px_black] -translate-y-1`
              : 'bg-white text-slate-400'
          }`}
        >
          {t.label}
          <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-black border border-current/30 ${activeTab === t.id ? 'bg-white/20' : 'bg-slate-100'}`}>
            {countByTab(t.id)}
          </span>
        </button>
      ))}
    </div>
  );
};

// ─── Tarjeta de Usuario ───────────────────────────────────────────────────────
export const DirectoryCard = ({ user, index, onSelect }) => {
  const rolCfg = ROL_CONFIG[user.rol] || ROL_CONFIG.cliente;
  const RolIcon = rolCfg.icon;
  const isInactive = user.activo === false;

  return (
    <div
      className={`bg-white border-[4px] border-black p-8 rounded-[3rem] shadow-[10px_10px_0px_0px_black] hover:-translate-y-2 transition-all relative overflow-hidden group ${
        index % 3 === 0 ? 'rotate-1' : '-rotate-1'
      } ${isInactive ? 'grayscale opacity-60' : ''}`}
    >
      {/* Badge INACTIVO */}
      {isInactive && (
        <div className="absolute top-4 left-4 bg-slate-800 text-white text-[8px] font-black uppercase px-3 py-1 rounded-xl border-2 border-black tracking-widest z-10">
          ⛔ Inactivo
        </div>
      )}

      {/* Avatar + Badge rol */}
      <div className="flex justify-between items-start mb-6">
        <div className="w-16 h-16 rounded-2xl border-[3.5px] border-black bg-slate-50 overflow-hidden shadow-[4px_4px_0px_0px_black] group-hover:rotate-6 transition-transform">
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatar_url || user.nombre_completo || user.email}`}
            alt="avatar"
          />
        </div>
        <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase border-2 border-black ${rolCfg.color}`}>
          <RolIcon size={10} />
          {rolCfg.label}
        </span>
      </div>

      {/* Nombre */}
      <h3 className="text-xl font-black uppercase italic leading-none mb-4 truncate">
        {user.nombre_completo || user.nombre || 'Sin nombre'}
      </h3>

      {/* Info */}
      <div className="space-y-1.5 mb-8 opacity-60">
        {user.email && (
          <p className="text-[10px] font-bold uppercase flex items-center gap-2 truncate">
            <Mail size={12} /> {user.email}
          </p>
        )}
        {(user.telefono || user.tel) && (
          <p className="text-[10px] font-bold uppercase flex items-center gap-2">
            <Phone size={12} /> {user.telefono || user.tel}
          </p>
        )}
      </div>

      <PopButton variant="dark" onClick={onSelect} icon={ChevronRight}>
        Ver Expediente
      </PopButton>
    </div>
  );
};
