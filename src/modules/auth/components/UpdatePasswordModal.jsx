import React, { useState } from 'react';
import { Lock, Mail } from 'lucide-react';
import PopModal from './PopModal';
import PopInput from './PopInput';
import PopButton from './PopButton';

const UpdatePasswordModal = ({ isOpen, onClose, onSave }) => {
  const [modalPassStrength, setModalPassStrength] = useState(0);

  const calcModalStrength = (val) => {
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    setModalPassStrength(score);
  };

  return (
    <PopModal isOpen={isOpen} onClose={onClose} title="Actualizar Clave">
      <div className="bg-slate-50 border-2 border-black/10 p-4 rounded-2xl mb-8">
        <p className="text-[10px] font-black uppercase text-slate-500 leading-relaxed text-center">
          Para confirmar este cambio de seguridad, te enviaremos un código de 6 dígitos al correo de tu cuenta.
        </p>
      </div>

      <div className="relative">
        <PopInput 
          label="Nueva Contraseña" 
          icon={Lock} 
          type="password" 
          placeholder="••••••••" 
          containerClassName="mb-3" 
          onChange={(e) => calcModalStrength(e.target.value)} 
        />
        <div className="flex gap-2 px-2 mb-6">
          {[1, 2, 3, 4].map((level) => (
            <div 
              key={level} 
              className={`h-2 flex-1 rounded-full border-2 border-black transition-colors duration-300 ${
                modalPassStrength >= level 
                  ? (modalPassStrength < 2 ? 'bg-rose-500' : modalPassStrength < 4 ? 'bg-amber-400' : 'bg-emerald-400') 
                  : 'bg-slate-100'
              }`} 
            />
          ))}
        </div>
      </div>

      <PopInput label="Repetir Contraseña" icon={Lock} type="password" placeholder="••••••••" onChange={() => {}} />
      <div className="mt-8">
        <PopButton variant="primary" icon={Mail} onClick={onSave}>
          Guardar y Verificar
        </PopButton>
      </div>
    </PopModal>
  );
};

export default UpdatePasswordModal;
