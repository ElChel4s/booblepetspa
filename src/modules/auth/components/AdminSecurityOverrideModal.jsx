import React from 'react';
import { AlertTriangle, Key, ShieldCheck } from 'lucide-react';
import PopModal from './PopModal';
import PopInput from './PopInput';
import PopButton from './PopButton';

const AdminSecurityOverrideModal = ({ isOpen, onClose, onConfirm }) => {
  return (
    <PopModal isOpen={isOpen} onClose={onClose} title="Forzar Seguridad" isDanger={true}>
      <div className="bg-rose-50 border-2 border-rose-200 p-6 rounded-2xl mb-8 flex items-start gap-4">
        <AlertTriangle className="text-rose-600 shrink-0 mt-1" />
        <p className="text-[10px] font-black uppercase text-rose-600 leading-relaxed">
          Estás realizando una acción crítica. Al sobreescribir la contraseña, el usuario perderá su clave actual y podrá entrar con esta nueva inmediatamente sin requerir confirmación de email.
        </p>
      </div>
      <PopInput label="Asignar Nueva Contraseña" icon={Key} type="password" placeholder="Nueva Clave Administrativa..." onChange={() => {}} />
      <div className="mt-8">
        <PopButton variant="danger" icon={ShieldCheck} onClick={onConfirm}>
          Ejecutar Override
        </PopButton>
      </div>
    </PopModal>
  );
};

export default AdminSecurityOverrideModal;
