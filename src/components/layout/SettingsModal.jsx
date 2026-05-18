import { useTheme } from '../../store/ThemeContext';
import { useAuth } from '../../store/AuthContext';
import { Settings, Home, Rocket, Scissors, Users } from 'lucide-react';

/**
 * SettingsModal — Panel de control PWA.
 * Permite cambiar el tema de color (6 opciones) y el rol activo (cliente / admin).
 * Se cierra automáticamente al seleccionar un rol.
 */
const SettingsModal = ({ isOpen, onClose }) => {
  const { currentTheme, setCurrentTheme, THEMES } = useTheme();
  const { rolActual, setRolActual } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-3xl animate-in fade-in duration-300">
      <div className="bg-[var(--card)] w-full max-w-xl rounded-[3.5rem_1rem_4rem_1rem] border-8 border-black shadow-2xl p-10 relative overflow-y-auto max-h-[90vh]">
        
        {/* Título */}
        <h2 className="text-4xl font-black tracking-tighter uppercase italic mb-10 border-b-8 border-black pb-4 flex items-center gap-4">
          <Settings size={40} className="text-[var(--primary)]" />
          Consola PWA
        </h2>

        {/* Selector de Temas */}
        <div className="mb-12">
          <h3 className="font-black text-xs uppercase text-slate-400 mb-6 tracking-[0.5em] border-b-4 border-slate-100 pb-2">
            Paleta de Colores (6)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.values(THEMES).map((t) => (
              <button
                key={t.id}
                onClick={() => setCurrentTheme(t.id)}
                className={`p-4 rounded-[1.5rem] border-4 transition-all flex flex-col items-center gap-2 ${
                  currentTheme === t.id
                    ? 'border-black bg-white shadow-[4px_4px_0px_0px_black] scale-105'
                    : 'border-slate-100'
                }`}
              >
                <span className="text-3xl">{t.icon}</span>
                <span className="text-[10px] font-black uppercase text-center leading-tight text-slate-700">
                  {t.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Selector de Rol */}
        <div className="mb-12">
          <h3 className="font-black text-xs uppercase text-slate-400 mb-6 tracking-[0.5em] border-b-4 border-slate-100 pb-2">
            Entorno de Usuario
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {/* Cliente */}
            <button
              onClick={() => { setRolActual('cliente'); onClose(); }}
              className={`p-6 rounded-[2rem] border-4 transition-all flex flex-col items-center gap-3 ${
                rolActual === 'cliente'
                  ? 'border-black bg-white shadow-[6px_6px_0px_0px_black] scale-105'
                  : 'border-slate-100 opacity-40'
              }`}
            >
              <Home size={28} strokeWidth={3} />
              <span className="text-[9px] font-black uppercase text-center leading-tight text-slate-700">
                Cliente
              </span>
            </button>

            {/* Admin */}
            <button
              onClick={() => { setRolActual('admin'); onClose(); }}
              className={`p-6 rounded-[2rem] border-4 transition-all flex flex-col items-center gap-3 ${
                rolActual === 'admin'
                  ? 'border-black bg-white shadow-[6px_6px_0px_0px_black] scale-105'
                  : 'border-slate-100 opacity-40'
              }`}
            >
              <Rocket size={28} strokeWidth={3} />
              <span className="text-[9px] font-black uppercase text-center leading-tight text-slate-700">
                Admin
              </span>
            </button>

            {/* Groomer */}
            <button
              onClick={() => { setRolActual('groomer'); onClose(); }}
              className={`p-6 rounded-[2rem] border-4 transition-all flex flex-col items-center gap-3 ${
                rolActual === 'groomer'
                  ? 'border-black bg-white shadow-[6px_6px_0px_0px_black] scale-105'
                  : 'border-slate-100 opacity-40'
              }`}
            >
              <Scissors size={28} strokeWidth={3} />
              <span className="text-[9px] font-black uppercase text-center leading-tight text-slate-700">
                Groomer
              </span>
            </button>

            {/* Recepción */}
            <button
              onClick={() => { setRolActual('recepcion'); onClose(); }}
              className={`p-6 rounded-[2rem] border-4 transition-all flex flex-col items-center gap-3 ${
                rolActual === 'recepcion'
                  ? 'border-black bg-white shadow-[6px_6px_0px_0px_black] scale-105'
                  : 'border-slate-100 opacity-40'
              }`}
            >
              <Users size={28} strokeWidth={3} />
              <span className="text-[9px] font-black uppercase text-center leading-tight text-slate-700">
                Recepción
              </span>
            </button>
          </div>
        </div>

        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="w-full bg-black text-white font-black py-6 rounded-[2rem] shadow-[10px_10px_0px_0px_var(--primary)] hover:translate-y-2 hover:shadow-none transition-all text-xl uppercase tracking-widest italic border-b-[10px] border-black/20"
        >
          ¡Listo!
        </button>
      </div>
    </div>
  );
};

export default SettingsModal;
