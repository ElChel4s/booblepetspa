import React from 'react';
import { Smartphone, Key, AlertTriangle, ShieldCheck, ChevronRight, Monitor } from 'lucide-react';
import PopButton from './PopButton';
import { getCurrentSessionId } from '../services/sessionsService';

const SessionItem = ({ sess, onSelect }) => {
  const Icon = sess.tipo_dispositivo === 'mobile' ? Smartphone : Monitor;
  const isCurrent = sess.id === getCurrentSessionId();

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(sess)}
        className="w-full flex justify-between items-center bg-slate-50 p-3 rounded-xl border-2 border-black/5 cursor-pointer hover:border-black/20 hover:-translate-y-1 transition-all group text-left"
      >
        <div className="flex items-center gap-3">
          <Icon size={16} className={isCurrent ? 'text-emerald-500 shrink-0' : 'text-slate-400 shrink-0 group-hover:text-black transition-colors'} />
          <div className="min-w-0 text-left">
            <p className="text-[9px] font-black uppercase truncate">{sess.nombre_dispositivo}</p>
            <p className="text-[8px] font-bold text-slate-400">
              {isCurrent ? `Sesión Actual • IP: ${sess.ip_address}` : `${new Date(sess.last_active).toLocaleDateString()} • IP: ${sess.ip_address}`}
            </p>
          </div>
        </div>
        <ChevronRight size={14} className="text-slate-300 group-hover:text-black transition-colors" />
      </button>
    </li>
  );
};

const ProfileSecurityCard = ({ 
  user, 
  viewingProfileMode, 
  viewerRole, 
  setIs2FAModalOpen, 
  setIsPassModalOpen, 
  sessions, 
  setSelectedSession, 
  setIsSessionModalOpen,
  setIsAdminOverrideOpen,
  onToggleMFA
}) => {
  return (
    <div className="space-y-8">
      {viewingProfileMode === 'personal' && (
        <div className="bg-white border-[4px] border-black p-8 rounded-[3rem] shadow-[8px_8px_0px_0px_black] rotate-1">
          <h3 className="text-xl font-black uppercase italic mb-6 border-b-4 border-slate-100 pb-2">Seguridad</h3>

          {viewingProfileMode === 'personal' && (
            <div
              className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border-2 border-black/10 mb-4"
            >
              <div>
                <p className="text-[10px] font-black uppercase flex items-center gap-2"><Smartphone size={14} /> 2FA App</p>
                <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">Autenticación 2 Pasos</p>
              </div>
              <div 
                onClick={(e) => { e.stopPropagation(); onToggleMFA && onToggleMFA(); }}
                className={`w-14 h-8 rounded-full border-2 border-black p-1 cursor-pointer transition-colors ${user.mfa_activado ? 'bg-emerald-400' : 'bg-slate-200'}`}
              >
                <div className={`w-5 h-5 bg-white border-2 border-black rounded-full shadow-sm transition-transform ${user.mfa_activado ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </div>
            </div>
          )}

          {viewingProfileMode === 'personal' && (
            <button onClick={() => setIsPassModalOpen(true)} className="w-full bg-slate-100 border-2 border-black py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black hover:text-white transition-colors">
              <Key size={14} /> Cambiar Contraseña
            </button>
          )}

          {viewingProfileMode === 'personal' && (
            <div className="mt-8 border-t-4 border-dashed border-slate-100 pt-6">
              <h4 className="text-[9px] font-black uppercase text-slate-400 mb-4 tracking-widest">Sesiones Activas</h4>
              <ul className="space-y-3">
                {sessions.map((sess) => (
                  <SessionItem key={sess.id} sess={sess} onSelect={(item) => { setSelectedSession(item); setIsSessionModalOpen(true); }} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {viewingProfileMode === 'admin_view' && (viewerRole === 'admin' || viewerRole === 'recepcion') && (
        <div className="bg-black text-white border-[4px] border-rose-600 p-8 rounded-[3rem] shadow-[8px_8px_0px_0px_rose-600] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 text-rose-600 opacity-20"><AlertTriangle size={80} /></div>
          <h3 className="text-xl font-black uppercase italic mb-2 text-rose-500 relative z-10">Admin Override</h3>
          <p className="text-[9px] font-black uppercase text-slate-400 mb-6 tracking-widest relative z-10">Peligro: Acciones Directas</p>
          <PopButton variant="danger" icon={ShieldCheck} onClick={() => setIsAdminOverrideOpen(true)}>Forzar Reset Clave</PopButton>
        </div>
      )}
    </div>
  );
};

export default ProfileSecurityCard;
