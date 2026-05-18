import { Phone, Mail, ChevronRight } from 'lucide-react';

/**
 * UserCard — Tarjeta de usuario en el directorio Admin.
 * Muestra avatar, nombre, rol, contacto y botón de expediente.
 */
const UserCard = ({ user, index, onSelect }) => {
  const rotations = ['rotate-1', '-rotate-1', 'rotate-0'];
  const isInactive = user.activo === false;

  return (
    <div
      className={`bg-[var(--card)] border-[4px] border-black p-8 rounded-[3rem] shadow-[8px_8px_0px_0px_black] hover:-translate-y-2 transition-all duration-300 group relative overflow-hidden ${rotations[index % 3]} ${isInactive ? 'grayscale opacity-60' : ''}`}
    >
      {/* Badge INACTIVO */}
      {isInactive && (
        <div className="absolute top-4 left-4 bg-slate-800 text-white text-[8px] font-black uppercase px-3 py-1 rounded-xl border-2 border-black tracking-widest z-10">
          ⛔ Inactivo
        </div>
      )}

      {/* Avatar + Rol */}
      <div className="flex justify-between items-start mb-6">
        <div className="w-16 h-16 rounded-2xl border-[3.5px] border-black bg-slate-50 overflow-hidden shadow-[4px_4px_0px_0px_black] shrink-0">
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatar_seed}`}
            alt={user.nombre_completo}
            className="w-full h-full object-cover"
          />
        </div>
        <span
          className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border-2 border-black ${
            user.rol === 'groomer'
              ? 'bg-indigo-500 text-white'
              : 'bg-[var(--secondary)] text-black'
          }`}
        >
          {user.rol}
        </span>
      </div>

      {/* Nombre */}
      <h3 className="text-2xl font-black uppercase italic leading-none mb-3 group-hover:text-[var(--primary)] transition-colors">
        {user.nombre_completo}
      </h3>

      {/* Contacto */}
      <div className="space-y-1 mb-6 opacity-60">
        <p className="text-[10px] font-bold uppercase flex items-center gap-2">
          <Phone size={11} strokeWidth={3} /> {user.telefono}
        </p>
        <p className="text-[10px] font-bold uppercase flex items-center gap-2">
          <Mail size={11} strokeWidth={3} /> {user.email}
        </p>
      </div>

      {/* Acción */}
      <button
        onClick={() => onSelect(user)}
        className="w-full bg-black text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[var(--primary)] transition-all flex items-center justify-center gap-2"
      >
        Abrir Expediente <ChevronRight size={16} strokeWidth={4} />
      </button>
    </div>
  );
};

export default UserCard;
