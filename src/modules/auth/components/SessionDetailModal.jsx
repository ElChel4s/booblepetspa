import React from 'react';
import { Smartphone, LogOut, Monitor } from 'lucide-react';
import PopModal from './PopModal';
import PopInput from './PopInput';
import PopButton from './PopButton';

const SessionDetailModal = ({ isOpen, onClose, selectedSession, onRevokeClick }) => {
  if (!selectedSession) return null;

  const Icon = selectedSession.tipo_dispositivo === 'mobile' ? Smartphone : Monitor;
  const isCurrent = navigator.userAgent.includes(selectedSession.nombre_dispositivo.split(' (')[0]);

  return (
    <PopModal isOpen={isOpen} onClose={onClose} title="Detalle de Sesión">
      <div className="animate-in fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 bg-slate-50 border-[4px] border-black rounded-[2.5rem] flex items-center justify-center mb-4 shadow-[6px_6px_0px_0px_black]">
            <Icon size={40} className={isCurrent ? 'text-emerald-500' : 'text-slate-400'} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {isCurrent ? 'Dispositivo Actual' : 'Dispositivo Vinculado'}
          </p>
        </div>

        <PopInput
          label="Nombre del Dispositivo"
          icon={Icon}
          value={selectedSession.nombre_dispositivo}
          disabled
        />

        <div className="bg-slate-50 border-2 border-black/10 rounded-2xl p-6 mb-8 space-y-4">
          <div className="flex justify-between items-center border-b-2 border-black/5 pb-2">
            <span className="text-[9px] font-black uppercase text-slate-400">Ubicación</span>
            <span className="text-[10px] font-black uppercase text-right">{selectedSession.ubicacion || 'Bolivia'}</span>
          </div>
          <div className="flex justify-between items-center border-b-2 border-black/5 pb-2">
            <span className="text-[9px] font-black uppercase text-slate-400">Dirección IP</span>
            <span className="text-[10px] font-black uppercase">{selectedSession.ip_address}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-black uppercase text-slate-400">Última Actividad</span>
            <span className="text-[10px] font-black uppercase text-emerald-600">
              {new Date(selectedSession.last_active).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {!isCurrent && (
            <PopButton variant="danger" icon={LogOut} onClick={onRevokeClick}>
              Desvincular Dispositivo
            </PopButton>
          )}
          {isCurrent && (
            <p className="text-[9px] font-black uppercase text-center text-slate-400 italic">
              Esta es tu sesión actual
            </p>
          )}
        </div>
      </div>
    </PopModal>
  );
};

export default SessionDetailModal;
