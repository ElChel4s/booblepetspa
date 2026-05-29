import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { AuthProvider, useAuth } from './store/AuthContext';
import { ThemeProvider, useTheme } from './store/ThemeContext';
import { NavigationProvider, useNavigation } from './store/NavigationContext';
import { ToastProvider } from './store/ToastContext';
import { ReceptionAlertProvider } from './store/ReceptionAlertContext';

import Header from './components/layout/Header';
import SettingsModal from './components/layout/SettingsModal';
import { DevToggle } from './components/DevToggle';
import { Zap, AlertTriangle } from 'lucide-react';
import AuthApp from './modules/auth/AuthApp';
import { IS_REAL_AUTH } from './config';
import PlaceholderView from './components/common/PlaceholderView';
import ResetPasswordFromEmail from './components/ResetPasswordFromEmail';
import { supabase } from './api/supabase';
import AdminLayout from './components/layout/roles/AdminLayout';
import ReceptionLayout from './components/layout/roles/ReceptionLayout';
import GroomerLayout from './components/layout/roles/GroomerLayout';
import ClientLayout from './components/layout/roles/ClientLayout';

// Módulos
import AgendaModule from './modules/agenda/AgendaModule';
import StoreView from './modules/inventory/views/StoreView';
import AdminDashboardView from './modules/reports/views/AdminDashboardView';
import ClientsModule from './modules/clients/ClientsModule';
import ClientPetsView from './modules/clients/views/ClientPetsView';
import AuditDashboardView from './modules/auth/views/AuditDashboardView';
import ForcePasswordChangeModal from './modules/auth/components/ForcePasswordChangeModal';
import ServicesModule from './modules/services/ServicesModule';
import GroomingModule from './modules/grooming/GroomingModule';

import './index.css';

import { canAccess, getDefaultModule } from './utils/rbac';

const buildAddToCartHandler = (setCount, setAdded) => (id) => {
  setCount((prev) => prev + 1);
  setAdded(id);
  setTimeout(() => setAdded(null), 800);
};

// ─── Renderiza el módulo activo ───────────────────────────────────────────────
const ModuleRenderer = ({ onAddToCart, isAdded }) => {
  const { activeModule, setActiveModule } = useNavigation();
  const { rolActual } = useAuth();

  // Verificación de Permisos
  const hasAccess = canAccess(rolActual, activeModule);

  useEffect(() => {
    if (!hasAccess && rolActual) {
      console.warn(`[RBAC] Acceso denegado a '${activeModule}' para el rol '${rolActual}'`);
      setActiveModule(getDefaultModule(rolActual));
    }
  }, [hasAccess, activeModule, rolActual, setActiveModule]);

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-rose-50 text-rose-500 border-[4px] border-black rounded-[2.5rem] flex items-center justify-center mb-6 shadow-[8px_8px_0px_0px_black] rotate-3">
          <AlertTriangle size={48} strokeWidth={3} />
        </div>
        <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2">Acceso <span className="text-rose-500">Restringido</span></h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No tienes permisos para ver este módulo.</p>
      </div>
    );
  }

  const placeholders = {
    agenda: { title: 'Agenda', subtitle: 'Reservas y calendario operativo' },
    reservar: { title: 'Reservar', subtitle: 'Agenda tu cita de spa' },
    historial: { title: 'Historial', subtitle: 'Fotos, notas y boletas' },
    turnos: { title: 'Mis Turnos', subtitle: 'Lista de pacientes del dia' },
    atencion: { title: 'En Atencion', subtitle: 'Checklist y ficha activa' },
    insumos: { title: 'Insumos', subtitle: 'Control de shampoo y consumibles' },
    services: { title: 'Servicios', subtitle: 'Catalogo y precios' },
    finance: { title: 'Finanzas', subtitle: 'Ingresos, egresos y reportes' },
    monitor: { title: 'Monitor', subtitle: 'Estado en tiempo real' },
    cash: { title: 'Caja', subtitle: 'Cobros y arqueos' },
  };

  if (activeModule === 'clients' || activeModule === 'users') {
    return <ClientsModule />;
  }

  if (activeModule === 'mascotas') {
    return <ClientPetsView />;
  }

  if (activeModule === 'inventory') {
    return <StoreView onAddToCart={onAddToCart} isAdded={isAdded} />;
  }

  if (
    activeModule === 'agenda' ||
    activeModule === 'turnos' ||
    activeModule === 'atencion' ||
    activeModule === 'reservar'
  ) {
    return <AgendaModule />;
  }

  if (activeModule === 'services') {
    return <ServicesModule />;
  }

  if (activeModule === 'grooming') {
    return <GroomingModule />;
  }

  if (activeModule === 'reports') {
    return <AdminDashboardView />;
  }

  if (activeModule === 'audit') {
    return <AuditDashboardView setView={setActiveModule} />;
  }

  if (placeholders[activeModule]) {
    const data = placeholders[activeModule];
    return <PlaceholderView title={data.title} subtitle={data.subtitle} />;
  }

  return <StoreView onAddToCart={onAddToCart} isAdded={isAdded} />;
};

ModuleRenderer.propTypes = {
  onAddToCart: PropTypes.func,
  isAdded: PropTypes.any,
};


// ─── AppShell — accede a todos los contextos ─────────────────────────────────
const AppShell = () => {
  const { themeVars } = useTheme();
  const { setActiveModule } = useNavigation();
  const { rolActual, currentUser, petCount, openSelfProfile, mustChangePassword } = useAuth();

  const [cartCount, setCartCount] = useState(2);
  const [favCount] = useState(5);
  const [notifCount] = useState(3);
  const [isAdded, setIsAdded] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Carga Nunito desde Google Fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => link.remove();
  }, []);

  // El módulo activo se mantiene persistente gracias a NavigationContext
  // y se valida por rol en ModuleRenderer.



  const handleAddToCart = buildAddToCartHandler(setCartCount, setIsAdded);

  let roleLabel = 'Cliente';
  if (rolActual === 'admin') roleLabel = 'Admin';
  if (rolActual === 'recepcion') roleLabel = 'Recepción';
  if (rolActual === 'groomer') roleLabel = 'Groomer';

  const roleLayouts = {
    admin: AdminLayout,
    recepcion: ReceptionLayout,
    groomer: GroomerLayout,
    cliente: ClientLayout,
  };

  const ActiveLayout = roleLayouts[rolActual] || ClientLayout;

  return (
    <>
      <ActiveLayout themeVars={themeVars} onOpenSettings={() => setIsSettingsOpen(true)}>
        <Header
          cartCount={cartCount}
          favCount={favCount}
          notifCount={notifCount}
          onOpenProfile={() => {
            openSelfProfile();
            const profileModule = rolActual === 'admin' || rolActual === 'recepcion' ? 'users' : 'clients';
            setActiveModule(profileModule);
          }}
          user={currentUser}
          petCount={petCount}
          roleLabel={roleLabel}
        />

        <div className="px-4 md:px-8">
          <ModuleRenderer onAddToCart={handleAddToCart} isAdded={isAdded} />
        </div>
      </ActiveLayout>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <ForcePasswordChangeModal isOpen={mustChangePassword} />
      <DevToggle />
    </>
  );
};

const AuthGate = () => {
  const { isAuthenticated, loading } = useAuth();
  const [authView, setAuthView] = useState(null);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  // Detectar evento PASSWORD_RECOVERY de Supabase
  useEffect(() => {
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        console.log('[Auth] Password recovery detected');
        setIsRecoveryMode(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Si estamos en modo recuperación, mostrar la pantalla de nueva contraseña
  if (isRecoveryMode) {
    return (
      <ResetPasswordFromEmail 
        onComplete={() => {
          setIsRecoveryMode(false);
          setAuthView('login');
        }} 
      />
    );
  }

  // Si está cargando la sesión de Supabase, mostramos un Splash Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center animate-pulse">
        <div className="w-24 h-24 bg-[var(--primary)] rounded-[2rem] border-[4px] border-white flex items-center justify-center rotate-12 shadow-[10px_10px_0px_0px_rgba(255,255,255,0.2)]">
          <Zap size={48} className="text-white fill-current" />
        </div>
        <p className="mt-8 text-[10px] font-black uppercase text-white tracking-[0.5em] italic">Iniciando Bubble Pet Spa...</p>
      </div>
    );
  }

  if (IS_REAL_AUTH && !isAuthenticated) {
    if (authView) {
      return <AuthApp initialView={authView} />;
    }
    return <PublicShell onOpenAuth={(view) => setAuthView(view)} />;
  }

  return <AppShell />;
};


const PublicShell = ({ onOpenAuth }) => {
  const { themeVars } = useTheme();
  const [cartCount, setCartCount] = useState(0);
  const [isAdded, setIsAdded] = useState(null);

  const handleAddToCart = buildAddToCartHandler(setCartCount, setIsAdded);

  return (
    <div
      style={themeVars}
      className="min-h-screen bg-[var(--bg)] font-['Nunito',sans-serif] text-[var(--text)] flex flex-col relative overflow-hidden transition-colors duration-500"
    >
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(var(--border) 2px, transparent 2px)',
          backgroundSize: '35px 35px',
        }}
      />

      <main className="flex-1 flex flex-col w-full z-10 relative px-4 md:px-12 md:pt-8 pb-24">
        <Header
          cartCount={cartCount}
          favCount={0}
          notifCount={0}
          onOpenAuth={() => onOpenAuth('login')}
          variant="public"
        />

        <div className="px-0 md:px-4">
          <StoreView onAddToCart={handleAddToCart} isAdded={isAdded} />
        </div>
      </main>
    </div>
  );
};

PublicShell.propTypes = {
  onOpenAuth: PropTypes.func,
};

// ─── Root con providers ───────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <ReceptionAlertProvider>
        <ThemeProvider>
          <NavigationProvider>
            <ToastProvider>
              <AuthGate />
            </ToastProvider>
          </NavigationProvider>
        </ThemeProvider>
      </ReceptionAlertProvider>
    </AuthProvider>
  );
}
