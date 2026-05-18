import React from 'react';
import { LogOut, ArrowRight } from 'lucide-react';
import PopModal from './PopModal';
import PopButton from './PopButton';

const LogoutConfirmModal = ({ isOpen, onClose, onConfirm }) => {
  return (
    <PopModal isOpen={isOpen} onClose={onClose} title="Cerrar Sesión">
      <div className="flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-rose-50 border-[4px] border-rose-500 rounded-full flex items-center justify-center mb-6 shadow-[6px_6px_0px_0px_#f43f5e]">
          <LogOut size={40} className="text-rose-500 pr-1" strokeWidth={3} />
        </div>
        <h3 className="text-2xl font-black uppercase italic mb-2">¿Te vas tan pronto?</h3>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-8 leading-relaxed max-w-md">
          Tendrás que volver a ingresar tus credenciales la próxima vez que quieras acceder a tu cuenta de Bubble Pet Spa.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 mt-4">
        <PopButton variant="outline" onClick={onClose} full={true}>Mejor me quedo</PopButton>
        <PopButton variant="danger" icon={ArrowRight} onClick={onConfirm} full={true}>Sí, cerrar sesión</PopButton>
      </div>
    </PopModal>
  );
};

export default LogoutConfirmModal;
