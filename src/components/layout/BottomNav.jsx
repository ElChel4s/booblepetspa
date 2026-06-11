import React from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../store/AuthContext';
import { useNavigation } from '../../store/NavigationContext';
import {
  Home, ClipboardCheck, Users, CreditCard,
  BarChart3, Calendar, Settings,
  Activity, BookOpen, Droplets, Package, Wallet, PawPrint, Scissors, History
} from 'lucide-react';

const NAV_BY_ROLE = {
  cliente: [
    { id: 'tienda', icon: <Home />, label: 'Tienda' },
    { id: 'reservar', icon: <Calendar />, label: 'Reservar' },
    { id: 'mascotas', icon: <PawPrint />, label: 'Mascotas' },
    { id: 'historial', icon: <BookOpen />, label: 'Historial' },
  ],
  groomer: [
    { id: 'turnos', icon: <ClipboardCheck />, label: 'Mis Turnos' },
    { id: 'atencion', icon: <Activity />, label: 'En Atención' },
    { id: 'insumos', icon: <Droplets />, label: 'Insumos' },
    { id: 'tienda', icon: <Home />, label: 'Tienda' },
    { id: 'historial', icon: <History />, label: 'Historial' },
  ],
  admin: [
    { id: 'reports', icon: <BarChart3 />, label: 'Inicio' },
    { id: 'agenda', icon: <Calendar />, label: 'Agenda' },
    { id: 'users', icon: <Users />, label: 'Usuarios' },
    { id: 'inventory', icon: <Package />, label: 'Inventario' },
    { id: 'services', icon: <Scissors />, label: 'Servicios' },
    { id: 'finance', icon: <Wallet />, label: 'Finanzas' },
    { id: 'grooming', icon: <Activity />, label: 'Grooming' },
    { id: 'audit', icon: <History />, label: 'Auditoría' },
  ],
  recepcion: [
    { id: 'reports', icon: <BarChart3 />, label: 'Inicio' },
    { id: 'agenda', icon: <Calendar />, label: 'Agenda' },
    { id: 'inventory', icon: <Package />, label: 'Ventas' },
    { id: 'clients', icon: <Users />, label: 'Clientes' },
    { id: 'grooming', icon: <Activity />, label: 'Grooming' },
    { id: 'cash', icon: <CreditCard />, label: 'Caja' },
  ],
};

const BottomNav = ({ onOpenSettings }) => {
  const { rolActual, setProfileMode } = useAuth();
  const { activeModule, setActiveModule } = useNavigation();
  const navItems = NAV_BY_ROLE[rolActual] || NAV_BY_ROLE.cliente;

  return (
    <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-[80] w-[calc(100%-2rem)] max-w-md animate-in slide-in-from-bottom-8 duration-500">
      <div className="bg-white/90 backdrop-blur-md border-[3.5px] border-black rounded-[2rem] shadow-[5px_5px_0px_0px_black] px-2 py-2 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 flex-1 justify-around">
          {navItems.map((item) => {
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'users' || item.id === 'clients') {
                    setProfileMode(rolActual === 'admin' || rolActual === 'recepcion' ? 'directory' : 'self');
                  }
                  setActiveModule(item.id);
                }}
                className={`flex flex-col items-center gap-1 py-2 px-3 rounded-2xl transition-all duration-300 active:scale-90 relative ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-500 hover:text-[var(--primary)] hover:bg-slate-100/50'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-black rounded-2xl shadow-[3px_3px_0px_0px_var(--primary)] -z-10 animate-in zoom-in-75 duration-200"></div>
                )}
                {React.cloneElement(item.icon, {
                  size: 22,
                  strokeWidth: isActive ? 3 : 2,
                  className: isActive ? 'animate-bounce-short' : '',
                })}
                <span className={`text-[9px] font-black uppercase tracking-wider leading-none ${isActive ? 'text-white' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Separador */}
        <div className="w-1 h-8 bg-slate-200 rounded-full shrink-0 mx-1" />

        {/* Ajustes */}
        <button
          onClick={onOpenSettings}
          className="flex flex-col items-center gap-1 py-2 px-3 rounded-2xl text-slate-500 hover:text-[var(--primary)] hover:bg-slate-100/50 transition-all active:scale-90 shrink-0"
        >
          <Settings size={22} strokeWidth={2} />
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
