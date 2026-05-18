import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import PopModal from './PopModal';
import PopButton from './PopButton';

const RevokeSessionConfirmModal = ({ isOpen, onClose, selectedSession, onConfirm }) => {
  return (
    <PopModal isOpen={isOpen} onClose={onClose} title="Confirmar Desvinculación" isDanger={true}>
      <div className="flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-rose-100 border-[4px] border-rose-600 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle size={36} className="text-rose-600" />
        </div>
        <p className="text-sm font-black uppercase leading-relaxed text-rose-600 mb-2">¿Estás completamente seguro?</p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-8 leading-relaxed max-w-md">
          {selectedSession?.current
            ? 'Esto cerrará tu sesión en este dispositivo inmediatamente.'
            : `Se cerrará la sesión en ${selectedSession?.name}. Tendrás que volver a ingresar tus datos para acceder desde allí.`}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 mt-4">
        <PopButton variant="outline" onClick={onClose} full={true}>Cancelar</PopButton>
        <PopButton variant="danger" icon={ShieldCheck} onClick={onConfirm} full={true}>Sí, desvincular</PopButton>
      </div>
    </PopModal>
  );
};

export default RevokeSessionConfirmModal;
