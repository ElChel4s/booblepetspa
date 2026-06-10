import { useState } from 'react';
import { Heart, Bell, ShoppingBag, Scissors, LogIn, Check, Package, CreditCard, Star, Calendar, X, Info } from 'lucide-react';
import SmartShortcut from '../common/SmartShortcut';
import PwaInstallButton from '../common/PwaInstallButton';
import { useNotifications } from '../../store/NotificationContext';
import { useNavigation } from '../../store/NavigationContext';

const timeAgo = (dateStr) => {
  const date = new Date(dateStr);
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " años";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " meses";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " d";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " h";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " m";
  return "ahora";
};

const getNotifIcon = (tipo) => {
  switch (tipo) {
    case 'cita': return <Calendar size={16} className="text-blue-500" />;
    case 'pago': return <CreditCard size={16} className="text-green-500" />;
    case 'stock': return <Package size={16} className="text-amber-500" />;
    case 'encuesta': return <Star size={16} className="text-purple-500" />;
    case 'seguridad': return <Info size={16} className="text-rose-500" />;
    default: return <Bell size={16} className="text-slate-500" />;
  }
};

/**
 * Header — Smart Hub principal de la aplicación.
 *
 * Responsive:
 *  - Mobile: Logo + User Hub compacto (carrito + campana + avatar). Sin shortcuts. Drawer de Notifs.
 *  - Desktop (md+): Logo + SmartShortcuts + User Hub completo con Popover de Notifs.
 */
const Header = ({ cartCount, favCount, onOpenProfile, onOpenAuth, user, petCount, roleLabel, variant = 'private' }) => {
  const displayName = user?.nombre_completo || 'Usuario';
  const avatarSeed = user?.avatar_seed || 'Felix';
  const secondaryLabel = user?.rol === 'cliente'
    ? `${petCount} Peluditos`
    : roleLabel;
  const isPublic = variant === 'public';

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { setActiveModule } = useNavigation();
  const [showNotifDesktop, setShowNotifDesktop] = useState(false);
  const [showNotifMobile, setShowNotifMobile] = useState(false);

  const handleNotifClick = (notif) => {
    if (!notif.leido) markAsRead(notif.id);
    if (notif.link_modulo) setActiveModule(notif.link_modulo);
    setShowNotifDesktop(false);
    setShowNotifMobile(false);
  };

  const NotifList = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b-[3px] border-black bg-[var(--bg)] shrink-0">
        <h3 className="font-black italic uppercase tracking-tighter text-lg">Notificaciones</h3>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="text-[10px] font-bold text-slate-500 hover:text-[var(--primary)] uppercase flex items-center gap-1 transition-colors"
          >
            <Check size={12} strokeWidth={3} /> Marcar Leídas
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar bg-white p-2 flex flex-col gap-2">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
            <Bell size={32} className="opacity-20" />
            <p className="text-xs font-bold uppercase tracking-widest">Estás al día</p>
          </div>
        ) : (
          notifications.map(n => (
            <button
              key={n.id}
              onClick={() => handleNotifClick(n)}
              className={`flex items-start gap-3 p-3 rounded-xl border-[2.5px] text-left transition-all hover:scale-[1.01] active:scale-95 ${
                n.leido 
                  ? 'border-black/5 bg-slate-50 hover:border-black/20' 
                  : 'border-black bg-white shadow-[3px_3px_0px_0px_black]'
              }`}
            >
              <div className={`p-2 rounded-lg border-2 ${n.leido ? 'bg-slate-200 border-transparent' : 'bg-[var(--bg)] border-black'}`}>
                {getNotifIcon(n.tipo)}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={`text-[11px] font-black uppercase tracking-wider truncate ${n.leido ? 'text-slate-500' : 'text-black'}`}>
                    {n.titulo}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 shrink-0">
                    {timeAgo(n.created_at)}
                  </span>
                </div>
                <p className={`text-xs leading-snug line-clamp-2 ${n.leido ? 'text-slate-500' : 'text-slate-700 font-bold'}`}>
                  {n.mensaje}
                </p>
              </div>
              {!n.leido && <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-2" />}
            </button>
          ))
        )}
      </div>
    </div>
  );

  return (
    <>
      <header className="px-4 py-3 md:px-6 flex flex-row justify-between items-center gap-3 mb-6 md:mb-10 relative z-50">

        {/* ── Logo ── */}
        <div className="flex items-center gap-3 cursor-pointer group shrink-0">
          <div className="bg-black text-white p-2.5 md:p-3 rounded-[1.4rem] shadow-[4px_4px_0px_0px_var(--primary)] group-hover:rotate-12 transition-transform border-2 border-white/10 active:scale-90">
            <Scissors size={20} strokeWidth={3.5} className="rotate-90 md:w-6 md:h-6" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-black tracking-tighter leading-none italic uppercase">
              Bubble<span className="text-[var(--primary)]">Pet</span>
            </h1>
            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mt-0.5">
              PWA Pro Edition
            </span>
          </div>
        </div>

        {/* ── Shortcuts (solo desktop) ── */}
        {!isPublic && <SmartShortcut />}

        {/* ── User Hub ── */}
        <div className="flex items-center gap-2 md:gap-4 bg-white p-1.5 md:p-2 pr-3 md:pr-5 rounded-[5rem] border-[3.5px] border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] shrink-0">

          {!isPublic && (
            <div className="hidden md:flex items-center gap-2 border-r-[3px] border-black/5 pr-4 pl-1 relative">
              <button className="relative p-2 text-slate-300 hover:text-rose-500 transition-all group">
                <Heart size={20} className="group-hover:fill-rose-500 transition-all" />
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-black text-[9px] w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                  {favCount}
                </span>
              </button>

              <button 
                className={`relative p-2 transition-all group ${showNotifDesktop ? 'text-[var(--primary)]' : 'text-slate-300 hover:text-[var(--primary)]'}`}
                onClick={() => setShowNotifDesktop(!showNotifDesktop)}
              >
                <Bell size={20} className={showNotifDesktop ? 'rotate-12' : 'group-hover:rotate-12 transition-all'} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-black text-[9px] w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-sm animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Desktop Popover */}
              {showNotifDesktop && (
                <div className="absolute top-12 left-1/2 -translate-x-1/2 w-80 h-96 bg-white border-[3.5px] border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200 z-[100]">
                  <NotifList />
                </div>
              )}

              <button className="relative p-2.5 bg-black text-white rounded-xl hover:bg-[var(--primary)] transition-all shadow-md active:scale-90 ml-1">
                <ShoppingBag size={20} strokeWidth={3} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[var(--secondary)] text-black font-black text-[9px] w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-md animate-bounce">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Iconos mobile (campana + carrito) */}
          {!isPublic && (
            <button 
              className="md:hidden relative p-2 text-slate-300 hover:text-[var(--primary)] transition-all group"
              onClick={() => setShowNotifMobile(true)}
            >
              <Bell size={18} className="group-hover:rotate-12 transition-all" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-black text-[9px] w-4 h-4 rounded-full border-2 border-white flex items-center justify-center shadow-sm animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          )}

          <button className="md:hidden relative p-2 bg-black text-white rounded-xl hover:bg-[var(--primary)] transition-all shadow-md active:scale-90">
            <ShoppingBag size={18} strokeWidth={3} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[var(--secondary)] text-black font-black text-[9px] w-4 h-4 rounded-full border-2 border-white flex items-center justify-center shadow-md animate-bounce">
                {cartCount}
              </span>
            )}
          </button>

          {isPublic ? (
            <div className="flex items-center gap-2">
              <button className="hidden md:flex relative p-2.5 bg-black text-white rounded-xl hover:bg-[var(--primary)] transition-all shadow-md active:scale-90">
                <ShoppingBag size={20} strokeWidth={3} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[var(--secondary)] text-black font-black text-[9px] w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-md animate-bounce">
                    {cartCount}
                  </span>
                )}
              </button>
              <PwaInstallButton className="hidden md:flex" />
              <button
                type="button"
                className="flex items-center gap-2 bg-black text-white rounded-2xl px-4 py-2 border-[3px] border-black shadow-[4px_4px_0px_0px_black] font-black text-[10px] uppercase tracking-widest hover:translate-y-1 hover:shadow-none transition-all"
                onClick={onOpenAuth}
              >
                <LogIn size={16} strokeWidth={3} /> Ingresar
              </button>
            </div>
          ) : (
            <>
              <PwaInstallButton className="hidden md:flex mr-2" />
              <button
                type="button"
                className="flex items-center gap-3 group cursor-pointer text-left pl-1"
                onClick={onOpenProfile}
                aria-label="Ver perfil"
              >
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-black text-slate-800 leading-none group-hover:text-[var(--primary)] transition-colors">
                    {displayName}
                  </span>
                  <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider mt-1">
                    {secondaryLabel}
                  </span>
                </div>
                <div className="w-9 h-9 md:w-11 md:h-11 rounded-full border-[3px] border-black shadow-inner overflow-hidden group-hover:scale-105 transition-transform shrink-0">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`}
                    alt="Usuario"
                    className="w-full h-full object-cover"
                  />
                </div>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Cierre invisible para Popover Desktop */}
      {showNotifDesktop && (
        <div 
          className="fixed inset-0 z-40 hidden md:block" 
          onClick={() => setShowNotifDesktop(false)} 
        />
      )}

      {/* Drawer Mobile Notificaciones */}
      {showNotifMobile && (
        <div className="fixed inset-0 z-[9999] md:hidden flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-4 border-b-[3px] border-black bg-[var(--bg)] shrink-0">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowNotifMobile(false)}
                  className="p-2 bg-black text-white rounded-lg active:scale-90 transition-transform"
                >
                  <X size={20} strokeWidth={3} />
                </button>
                <h3 className="font-black italic uppercase tracking-tighter text-lg">Notificaciones</h3>
              </div>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 active:scale-90"
                >
                  <Check size={12} strokeWidth={3} /> Todas
                </button>
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <NotifList />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
