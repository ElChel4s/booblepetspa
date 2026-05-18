import { Heart, Bell, ShoppingBag, Scissors, LogIn } from 'lucide-react';
import SmartShortcut from '../common/SmartShortcut';

/**
 * Header — Smart Hub principal de la aplicación.
 *
 * Responsive:
 *  - Mobile: Logo + User Hub compacto (carrito + avatar). Sin shortcuts (van en BottomNav).
 *  - Desktop (md+): Logo + SmartShortcuts + User Hub completo con favoritos, notif y nombre.
 */
const Header = ({ cartCount, favCount, notifCount, onOpenProfile, onOpenAuth, user, petCount, roleLabel, variant = 'private' }) => {
  const displayName = user?.nombre_completo || 'Usuario';
  const avatarSeed = user?.avatar_seed || 'Felix';
  const secondaryLabel = user?.rol === 'cliente'
    ? `${petCount} Peluditos`
    : roleLabel;
  const isPublic = variant === 'public';
  return (
    <header className="px-4 py-3 md:px-6 flex flex-row justify-between items-center gap-3 mb-6 md:mb-10">

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
          <div className="hidden md:flex items-center gap-2 border-r-[3px] border-black/5 pr-4 pl-1">
            <button className="relative p-2 text-slate-300 hover:text-rose-500 transition-all group">
              <Heart size={20} className="group-hover:fill-rose-500 transition-all" />
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-black text-[9px] w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                {favCount}
              </span>
            </button>

            <button className="relative p-2 text-slate-300 hover:text-[var(--primary)] transition-all group">
              <Bell size={20} className="group-hover:rotate-12 transition-all" />
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-black text-[9px] w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                {notifCount}
              </span>
            </button>

            <button className="relative p-2.5 bg-black text-white rounded-xl hover:bg-[var(--primary)] transition-all shadow-md active:scale-90">
              <ShoppingBag size={20} strokeWidth={3} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[var(--secondary)] text-black font-black text-[9px] w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-md animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Carrito mobile (siempre visible) */}
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
            <button
              type="button"
              className="flex items-center gap-2 bg-black text-white rounded-2xl px-4 py-2 border-[3px] border-black shadow-[4px_4px_0px_0px_black] font-black text-[10px] uppercase tracking-widest hover:translate-y-1 hover:shadow-none transition-all"
              onClick={onOpenAuth}
            >
              <LogIn size={16} strokeWidth={3} /> Ingresar / Registrarse
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="flex items-center gap-3 group cursor-pointer text-left"
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
            <div className="w-9 h-9 md:w-11 md:h-11 rounded-full border-[3px] border-black shadow-inner overflow-hidden group-hover:scale-105 transition-transform">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`}
                alt="Usuario"
                className="w-full h-full object-cover"
              />
            </div>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
