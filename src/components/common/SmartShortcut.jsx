import { useAuth } from '../../store/AuthContext';
import { useNavigation } from '../../store/NavigationContext';
import { Calendar, History, PlusCircle, AlertTriangle, Plus } from 'lucide-react';

/**
 * SmartShortcut — Acciones rápidas del header, contextuales por rol y módulo activo.
 * Solo visible en desktop (hidden lg:flex).
 */
const SmartShortcut = () => {
  const { rolActual } = useAuth();
  const { activeModule } = useNavigation();

  // Módulo de Clientes / CRM
  if (activeModule === 'clients') {
    return (
      <div className="hidden lg:flex items-center gap-4">
        <button className="flex items-center gap-2 bg-[var(--primary)] text-white px-5 py-2.5 rounded-2xl border-[3.5px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black text-xs uppercase hover:translate-y-1 transition-all active:shadow-none">
          <Plus size={16} strokeWidth={3} /> Nuevo Registro
        </button>
      </div>
    );
  }

  // Módulo Admin (panel/reportes)
  if (rolActual === 'admin') {
    return (
      <div className="hidden lg:flex items-center gap-4">
        <button className="flex items-center gap-2 bg-emerald-400 text-white px-5 py-2.5 rounded-2xl border-[3.5px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black text-xs uppercase hover:translate-y-1 transition-all active:shadow-none">
          <PlusCircle size={16} strokeWidth={3} /> Check-in
        </button>
        <button className="flex items-center gap-2 bg-white border-[3.5px] border-black px-4 py-2.5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black text-xs uppercase hover:translate-y-1 transition-all">
          <AlertTriangle size={16} className="text-rose-500" /> Stock (2)
        </button>
      </div>
    );
  }

  // Módulo Tienda (cliente)
  return (
    <div className="hidden lg:flex items-center gap-4">
      <button className="flex items-center gap-2 bg-[var(--primary)] text-white px-5 py-2.5 rounded-2xl border-[3.5px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black text-xs uppercase hover:translate-y-1 transition-all active:shadow-none">
        <Calendar size={16} strokeWidth={3} /> Agendar Turno
      </button>
      <button className="flex items-center gap-2 bg-white border-[3.5px] border-black px-5 py-2.5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black text-xs uppercase hover:translate-y-1 transition-all">
        <History size={16} className="text-indigo-500" /> Historial
      </button>
    </div>
  );
};

export default SmartShortcut;
