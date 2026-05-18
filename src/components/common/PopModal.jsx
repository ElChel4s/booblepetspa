import { X } from 'lucide-react';

/**
 * PopModal — Contenedor modal reutilizable estilo Neo-Brutalism.
 * Bloquea el scroll de fondo y se cierra con botón X o clic en backdrop.
 */
const PopModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white border-[6px] border-black rounded-[3.5rem] shadow-[15px_15px_0px_0px_black] w-full max-w-2xl max-h-[95vh] overflow-y-auto p-8 md:p-10 relative">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:rotate-90 transition-transform bg-slate-100 rounded-full border-2 border-black active:scale-90"
        >
          <X size={20} strokeWidth={4} />
        </button>

        {/* Título */}
        <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter mb-8 pr-12 border-b-8 border-slate-100 pb-4 leading-none">
          {title}
        </h2>

        {children}
      </div>
    </div>
  );
};

export default PopModal;
