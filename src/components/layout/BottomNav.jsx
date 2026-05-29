import React from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../store/AuthContext';
import { useNavigation } from '../../store/NavigationContext';
import {
  Home, ClipboardCheck, Users, CreditCard,
  BarChart3, Calendar, Settings,
  Activity, BookOpen, Droplets, Package, Wallet, Monitor, PawPrint, Scissors, History
} from 'lucide-react';

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
    { id: 'finance', icon: <Wallet />, label: 'Finanzas' },
    { id: 'audit', icon: <History />, label: 'Auditoría' },
  ],
  recepcion: [
    { id: 'agenda', icon: <Calendar />, label: 'Agenda' },
    { id: 'clients', icon: <Users />, label: 'Clientes' },
    { id: 'monitor', icon: <Monitor />, label: 'Monitor' },
    { id: 'cash', icon: <CreditCard />, label: 'Caja' },
  ],
};

const BottomNav = ({ onOpenSettings }) => {
  const { rolActual, setProfileMode } = useAuth();
  const { activeModule, setActiveModule } = useNavigation();
  const navItems = NAV_BY_ROLE[rolActual] || NAV_BY_ROLE.cliente;

  return (
    <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-[80] w-[calc(100%-2rem)] max-w-sm">
      <div className="bg-white border-[3.5px] border-black rounded-[2rem] shadow-[5px_5px_0px_0px_black] px-3 py-2 flex items-center justify-between gap-1">
        {navItems.map((item) => {
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'users') {
                  setProfileMode(rolActual === 'admin' || rolActual === 'recepcion' ? 'directory' : 'self');
                }
                setActiveModule(item.id);
              }}
              className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-[1.2rem] transition-all duration-200 active:scale-90 ${
                isActive
                  ? 'bg-black text-white shadow-[3px_3px_0px_0px_var(--primary)]'
                  : 'text-slate-400 hover:text-[var(--primary)] hover:bg-[var(--bg)]'
              }`}
            >
              {React.cloneElement(item.icon, {
                size: 20,
                strokeWidth: isActive ? 3 : 2,
              })}
              <span className={`text-[9px] font-black uppercase tracking-wider leading-none ${isActive ? 'text-white' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Separador */}
        <div className="w-px h-8 bg-black/10 mx-1 shrink-0" />

        {/* Ajustes */}
        <button
          onClick={onOpenSettings}
          className="flex flex-col items-center gap-1 py-2 px-3 rounded-[1.2rem] text-slate-400 hover:text-[var(--primary)] hover:bg-[var(--bg)] transition-all active:scale-90"
        >
          <Settings size={20} strokeWidth={2} />
          <span className="text-[9px] font-black uppercase tracking-wider leading-none">Ajustes</span>
        </button>
      </div>
    </nav>
  );
};

BottomNav.propTypes = {
  onOpenSettings: PropTypes.func,
};

export default BottomNav;
