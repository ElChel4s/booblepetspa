import React from 'react';
import { ShieldOff, ShieldCheck, AlertTriangle } from 'lucide-react';
import PopModal from './PopModal';
import PopButton from './PopButton';

/**
 * ToggleStatusModal — Modal de confirmación para activar/desactivar un usuario.
 */
const ToggleStatusModal = ({ isOpen, onClose, onConfirm, user, isActive, loading }) => {
  if (!user) return null;

  const isDeactivating = isActive !== false; // Si activo es null o true, se va a desactivar

  return (
    <PopModal
      isOpen={isOpen}
      onClose={onClose}
      title={isDeactivating ? 'Desactivar Cuenta' : 'Reactivar Cuenta'}
    >
      <div className="flex flex-col items-center text-center py-4">
        <div className={`w-20 h-20 border-[4px] border-black rounded-[2.5rem] flex items-center justify-center mb-6 shadow-[8px_8px_0px_0px_black] ${
          isDeactivating ? 'bg-amber-50' : 'bg-emerald-50'
        }`}>
          {isDeactivating
            ? <ShieldOff size={40} className="text-amber-500" strokeWidth={3} />
            : <ShieldCheck size={40} className="text-emerald-500" strokeWidth={3} />
          }
        </div>

        <h3 className="text-xl font-black uppercase italic mb-3">
          {isDeactivating ? '¿Desactivar a este usuario?' : '¿Reactivar a este usuario?'}
        </h3>

        <p className="text-[10px] font-bold text-slate-500 leading-relaxed mb-2">
          Usuario: <span className="text-black font-black">{user.nombre_completo || user.email}</span>
        </p>

        {isDeactivating && (
          <div className="flex items-start gap-2 bg-amber-50 border-2 border-amber-300 rounded-2xl p-3 mt-4 mb-6 text-left">
            <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[9px] font-bold text-amber-700 uppercase leading-relaxed">
              El usuario <strong>no podrá iniciar sesión</strong> hasta que sea reactivado por un administrador o recepcionista.
            </p>
          </div>
        )}

        {!isDeactivating && (
          <p className="text-[9px] font-bold text-slate-400 uppercase mb-6">
            El usuario podrá volver a acceder al sistema.
          </p>
        )}

        <div className="flex gap-3 w-full">
          <PopButton variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </PopButton>
          <PopButton
            variant={isDeactivating ? 'secondary' : 'primary'}
            onClick={onConfirm}
            className={`flex-1 ${isDeactivating ? '!bg-amber-500 !border-amber-700 !shadow-amber-700' : ''}`}
            disabled={loading}
          >
            {loading ? 'Procesando...' : isDeactivating ? 'Sí, Desactivar' : 'Sí, Reactivar'}
          </PopButton>
        </div>
      </div>
    </PopModal>
  );
};

export default ToggleStatusModal;
