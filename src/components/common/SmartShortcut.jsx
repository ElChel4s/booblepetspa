import { useAuth } from '../../store/AuthContext';
import { useNavigation } from '../../store/NavigationContext';
import { Calendar, History, PlusCircle, AlertTriangle, Plus, CreditCard, ClipboardCheck, Activity } from 'lucide-react';

/**
 * SmartShortcut — Acciones rápidas del header, contextuales por rol y módulo activo.
 * Solo visible en desktop (hidden lg:flex).
 */
const SmartShortcut = () => {
  const { rolActual } = useAuth();
  const { activeModule, setActiveModule } = useNavigation();

  // Módulo de Clientes / CRM (Admin, Recepción, Groomer)
  if (activeModule === 'clients' && (rolActual === 'admin' || rolActual === 'recepcion' || rolActual === 'groomer')) {
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
        <button 
          onClick={() => setActiveModule('agenda')}
          className="flex items-center gap-2 bg-emerald-400 text-white px-5 py-2.5 rounded-2xl border-[3.5px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black text-xs uppercase hover:translate-y-1 transition-all active:shadow-none"
        >
          <PlusCircle size={16} strokeWidth={3} /> Check-in
        </button>
        <button 
          onClick={() => setActiveModule('inventory')}
          className="flex items-center gap-2 bg-white border-[3.5px] border-black px-4 py-2.5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black text-xs uppercase hover:translate-y-1 transition-all"
        >
          <AlertTriangle size={16} className="text-rose-500" /> Stock (2)
        </button>
      </div>
    );
  }

  // Módulo Recepción
  if (rolActual === 'recepcion') {
    return (
      <div className="hidden lg:flex items-center gap-4">
        <button 
          onClick={() => setActiveModule('agenda')}
          className="flex items-center gap-2 bg-emerald-400 text-white px-5 py-2.5 rounded-2xl border-[3.5px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black text-xs uppercase hover:translate-y-1 transition-all active:shadow-none"
        >
          <Calendar size={16} strokeWidth={3} /> Nueva Cita
        </button>
        <button 
          onClick={() => setActiveModule('cash')}
          className="flex items-center gap-2 bg-white border-[3.5px] border-black px-5 py-2.5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black text-xs uppercase hover:translate-y-1 transition-all"
        >
          <CreditCard size={16} className="text-indigo-500" /> Nueva Venta
        </button>
      </div>
    );
  }

  // Módulo Groomer
  if (rolActual === 'groomer') {
    return (
      <div className="hidden lg:flex items-center gap-4">
        <button 
          onClick={() => setActiveModule('turnos')}
          className="flex items-center gap-2 bg-[var(--primary)] text-white px-5 py-2.5 rounded-2xl border-[3.5px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black text-xs uppercase hover:translate-y-1 transition-all active:shadow-none"
        >
          <ClipboardCheck size={16} strokeWidth={3} /> Mis Turnos
        </button>
        <button 
          onClick={() => setActiveModule('atencion')}
          className="flex items-center gap-2 bg-white border-[3.5px] border-black px-5 py-2.5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black text-xs uppercase hover:translate-y-1 transition-all"
        >
          <Activity size={16} className="text-indigo-500" /> En Atención
        </button>
      </div>
    );
  }

  // Módulo Cliente
  if (rolActual === 'cliente') {
    return (
      <div className="hidden lg:flex items-center gap-4">
        <button 
          onClick={() => setActiveModule('reservar')}
          className="flex items-center gap-2 bg-[var(--primary)] text-white px-5 py-2.5 rounded-2xl border-[3.5px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black text-xs uppercase hover:translate-y-1 transition-all active:shadow-none"
        >
          <Calendar size={16} strokeWidth={3} /> Agendar Turno
        </button>
        <button 
          onClick={() => setActiveModule('historial')}
          className="flex items-center gap-2 bg-white border-[3.5px] border-black px-5 py-2.5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black text-xs uppercase hover:translate-y-1 transition-all"
        >
          <History size={16} className="text-indigo-500" /> Historial
        </button>
      </div>
    );
  }

  return null;
};

export default SmartShortcut;
