import React from 'react';
import { ShieldAlert, Headset, MessageSquare } from 'lucide-react';
import PopModal from './PopModal';
import PopButton from './PopButton';

/**
 * InactiveAccountModal — Aviso para usuarios con cuenta suspendida.
 */
const InactiveAccountModal = ({ isOpen, onClose }) => {
  return (
    <PopModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Cuenta Suspendida"
    >
      <div className="flex flex-col items-center text-center py-6">
        <div className="w-24 h-24 bg-amber-50 border-[4px] border-black rounded-[2.5rem] flex items-center justify-center mb-6 shadow-[8px_8px_0px_0px_black] animate-bounce">
          <ShieldAlert size={48} className="text-amber-500" strokeWidth={3} />
        </div>

        <h3 className="text-2xl font-black uppercase italic mb-4">Acceso Restringido</h3>
        
        <p className="text-xs font-bold text-slate-500 leading-relaxed mb-8 max-w-xs">
          Tu cuenta se encuentra <span className="text-black">Inactiva</span> por el momento. 
          Por favor, ponte en contacto con el personal de <span className="text-[var(--primary)]">Recepción</span> o un <span className="text-[var(--primary)]">Administrador</span> para reactivar tu acceso.
        </p>

        <div className="w-full space-y-4">
          <PopButton 
            variant="secondary" 
            onClick={() => window.open('https://wa.me/59170000000', '_blank')}
            className="flex items-center justify-center gap-2"
          >
            <MessageSquare size={18} /> Contactar vía WhatsApp
          </PopButton>
          
          <button 
            onClick={onClose}
            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-black transition-colors"
          >
            Entendido, cerrar
          </button>
        </div>
      </div>
    </PopModal>
  );
};

export default InactiveAccountModal;
