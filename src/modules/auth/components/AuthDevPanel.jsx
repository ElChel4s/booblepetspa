import React from 'react';
import { Settings } from 'lucide-react';

const AuthDevPanel = ({ view, setView, viewerRole, setViewerRole, viewingProfileMode, setViewingProfileMode }) => (
  <div className="fixed bottom-4 left-4 z-[999] bg-white border-[4px] border-black p-4 rounded-[2rem] shadow-[8px_8px_0px_0px_black] w-[300px]">
    <div className="flex items-center gap-2 mb-3 border-b-2 border-slate-100 pb-2">
      <Settings size={16} className="text-[var(--primary)] animate-spin-slow" />
      <p className="font-black text-[10px] uppercase tracking-widest text-black">Consola PWA (Dev)</p>
    </div>
    <div className="space-y-3">
      <div>
        <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Saltar a Vista:</p>
        <select
          onChange={(e) => setView(e.target.value)}
          value={view}
          className="w-full bg-slate-100 border-2 border-black rounded-xl p-2 text-[10px] font-black uppercase outline-none cursor-pointer"
        >
          <option value="login">1. Pantalla Login</option>
          <option value="register">2. Registro Clientes</option>
          <option value="verify_2fa">3. Verificación 2FA</option>
          <option value="verify_email">4. Verificar Correo (Código)</option>
          <option value="reset_request">5. Pedir Recuperar Contraseña</option>
          <option value="directory">6. Directorio (Admin/Recepción)</option>
          <option value="profile">7. Perfil / Expediente</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Tu Rol:</p>
          <select
            onChange={(e) => setViewerRole(e.target.value)}
            value={viewerRole}
            className="w-full bg-slate-100 border-2 border-black rounded-xl p-2 text-[10px] font-black uppercase outline-none cursor-pointer"
          >
            <option value="admin">Admin</option>
            <option value="recepcion">Recepción</option>
            <option value="groomer">Groomer</option>
            <option value="cliente">Cliente</option>
          </select>
        </div>
        <div>
          <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Modo Perfil:</p>
          <select
            onChange={(e) => setViewingProfileMode(e.target.value)}
            value={viewingProfileMode}
            className="w-full bg-[var(--secondary)] border-2 border-black rounded-xl p-2 text-[10px] font-black uppercase outline-none cursor-pointer"
          >
            <option value="personal">Personal</option>
            <option value="admin_view">Vista Admin</option>
          </select>
        </div>
      </div>
    </div>
  </div>
);

export default AuthDevPanel;
