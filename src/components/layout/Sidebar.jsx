import React from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../store/AuthContext';
import { useNavigation } from '../../store/NavigationContext';
import {
  Zap, Settings,
  Home, ClipboardCheck, Users, CreditCard,
  BarChart3, Calendar,
  Activity, BookOpen, Droplets, Package, Wallet, Monitor, PawPrint, Scissors, History
} from 'lucide-react';
import { getDefaultModule } from '../../utils/rbac';

// Mapa de ítems de nav: id = módulo al que navegan
const NAV_BY_ROLE = {
  cliente: [
    { id: 'tienda', icon: <Home />, label: 'Tienda' },
    { id: 'mascotas', icon: <PawPrint />, label: 'Mascotas' },
    { id: 'reservar', icon: <Calendar />, label: 'Reservar' },
    { id: 'historial', icon: <BookOpen />, label: 'Historial' },
  ],
  groomer: [
    { id: 'turnos', icon: <ClipboardCheck />, label: 'Mis Turnos' },
    { id: 'atencion', icon: <Activity />, label: 'En Atención' },
    { id: 'historial', icon: <BookOpen />, label: 'Historial' },
    { id: 'insumos', icon: <Droplets />, label: 'Insumos' },
  ],
  admin: [
    { id: 'reports', icon: <BarChart3 />, label: 'Inicio' },
    { id: 'users', icon: <Users />, label: 'Usuarios' },
    { id: 'agenda', icon: <Calendar />, label: 'Agenda' },
    { id: 'grooming', icon: <Activity />, label: 'Grooming' },
    { id: 'services', icon: <Scissors />, label: 'Servicios' },
    { id: 'inventory', icon: <Package />, label: 'Inventario' },
    {id: 'finance', icon: <Wallet />, label: 'Finanzas' },
    { id: 'audit', icon: <History />, label: 'Auditoría' },
  ],
  recepcion: [
    { id: 'agenda', icon: <Calendar />, label: 'Agenda' },
    { id: 'clients', icon: <Users />, label: 'Clientes' },
    { id: 'monitor', icon: <Monitor />, label: 'Monitor' },
    { id: 'cash', icon: <CreditCard />, label: 'Caja' },
  ],
};

/**
 * Sidebar — Navegación vertical de la app.
 * Snake (cliente) o Pop Slim (admin).
 * Usa NavigationContext para marcar el ítem activo.
 */
const Sidebar = ({ onOpenSettings }) => {
  const { rolActual, setProfileMode } = useAuth();
  const { activeModule, setActiveModule } = useNavigation();
  const navItems = NAV_BY_ROLE[rolActual] || NAV_BY_ROLE.cliente;

  const isPopRole = rolActual === 'admin' || rolActual === 'recepcion';

  return (
    <aside className="hidden md:flex fixed left-6 top-1/2 -translate-y-1/2 z-50 flex-col items-center gap-5">
      {/* Logo condensado */}
      <button
        onClick={() => setActiveModule(getDefaultModule(rolActual))}
        className="bg-black text-white p-4 rounded-[1.5rem] border-[4px] border-black shadow-[4px_4px_0px_0px_var(--primary)] mb-2 hover:rotate-12 transition-transform cursor-pointer active:scale-90"
        aria-label="Ir al inicio"
      >
        <Zap size={24} className="fill-current" />
      </button>

      {/* Nav Items */}
      <nav className={`flex flex-col gap-4 relative ${isPopRole ? 'bg-black/10 p-2 rounded-[2rem]' : ''}`}>
        {navItems.map((item, i) => {
          const isActive = activeModule === item.id;
          let translateClass = '';
          if (!isPopRole) {
            translateClass = i % 2 === 0 ? 'translate-x-1.5' : '-translate-x-1.5';
          }
          return (
            <div
              key={item.id}
              className={`group relative transform transition-all duration-300 ${translateClass} hover:translate-x-0`}
            >
              {/* Aura hover */}
              <div className="absolute inset-[-4px] bg-white/40 backdrop-blur-md -z-10 rounded-full border-2 border-white/80 opacity-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-110 shadow-sm" />

              <button
                onClick={() => {
                  if (item.id === 'users') {
                    setProfileMode(rolActual === 'admin' || rolActual === 'recepcion' ? 'directory' : 'self');
                  }
                  setActiveModule(item.id);
                }}
                className={`p-4 rounded-full border-[3.5px] border-black shadow-[5px_5px_0px_0px_black] transition-all hover:scale-110 active:scale-95 ${
                  isActive
                    ? 'bg-[var(--primary)] text-white shadow-[5px_5px_0px_0px_black]'
                    : 'bg-[var(--card)] hover:bg-[var(--primary)] hover:text-white'
                }`}
              >
                {React.cloneElement(item.icon, { size: 20, strokeWidth: 3 })}
              </button>

              {/* Tooltip */}
              <div className="absolute left-16 top-1/2 -translate-y-1/2 px-4 py-2 bg-black text-white rounded-2xl font-black text-[10px] uppercase opacity-0 group-hover:opacity-100 group-hover:translate-x-4 transition-all whitespace-nowrap z-[60] tracking-widest shadow-xl">
                {item.label}
              </div>
            </div>
          );
        })}

        {/* Ajustes */}
        <button
          onClick={onOpenSettings}
          className="p-3 mt-2 text-slate-400 hover:rotate-90 hover:text-[var(--primary)] transition-all"
        >
          <Settings size={22} />
        </button>
      </nav>
    </aside>
  );
};

Sidebar.propTypes = {
  onOpenSettings: PropTypes.func,
};

export default Sidebar;
