import { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { Settings, Home, Rocket, Scissors, Users, Download } from 'lucide-react';
import { IS_REAL_AUTH } from '../../config';

import { usePwaInstall } from '../../hooks/usePwaInstall';

/**
 * SettingsModal — Panel de control y PWA.
 * Muestra opciones de PWA y cambio de rol (si no es auth real).
 */
const SettingsModal = ({ isOpen, onClose }) => {
  const { rolActual, setRolActual } = useAuth();
  const { isInstallable, installApp } = usePwaInstall();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-3xl animate-in fade-in duration-300">
      <div className="bg-[var(--card)] w-full max-w-xl rounded-[3.5rem_1rem_4rem_1rem] border-8 border-black shadow-2xl p-10 relative overflow-y-auto max-h-[90vh]">
        
        {/* Título */}
        <h2 className="text-4xl font-black tracking-tighter uppercase italic mb-10 border-b-8 border-black pb-4 flex items-center gap-4">
          <Settings size={40} className="text-[var(--primary)]" />
          Ajustes
        </h2>

        {/* Instalar PWA */}
        <div className="mb-12">
          <h3 className="font-black text-xs uppercase text-slate-400 mb-6 tracking-[0.5em] border-b-4 border-slate-100 pb-2">
            Aplicación
          </h3>
          <div className="flex flex-col gap-4 items-start">
            {isInstallable ? (
               <button
                 onClick={installApp}
                 className="flex items-center gap-3 bg-[var(--primary)] text-white px-6 py-4 rounded-[1.5rem] font-black uppercase tracking-widest border-4 border-black shadow-[4px_4px_0px_0px_black] hover:translate-y-1 hover:shadow-none transition-all active:scale-95"
               >
                 <Download size={24} />
                 Instalar Aplicación
               </button>
            ) : (
               <div className="p-4 bg-slate-50 border-4 border-slate-100 rounded-[1.5rem] flex items-center gap-3 w-full">
                 <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0 border-2 border-slate-200">
                   <Download size={20} className="text-slate-400" />
                 </div>
                 <div>
                   <p className="font-black text-slate-700 leading-tight">App Instalada o No Soportada</p>
                   <p className="text-xs text-slate-400 font-bold">Si usas iOS, usa la opción "Compartir" &gt; "Añadir a inicio".</p>
                 </div>
               </div>
            )}
          </div>
        </div>

        {/* Selector de Rol */}
        {!IS_REAL_AUTH && (
          <div className="mb-12">
            <h3 className="font-black text-xs uppercase text-slate-400 mb-6 tracking-[0.5em] border-b-4 border-slate-100 pb-2">
              Entorno de Usuario
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {/* Cliente */}
              <button
                onClick={() => { setRolActual('cliente'); onClose(); }}
                className={`p-6 rounded-[2rem] border-4 transition-all flex flex-col items-center gap-3 ${
                  rolActual === 'cliente'
                    ? 'border-black bg-[var(--primary)] text-white shadow-[6px_6px_0px_0px_black] scale-105'
                    : 'border-slate-100 opacity-40 hover:opacity-100 hover:border-slate-300'
                }`}
              >
                <Home size={28} strokeWidth={3} />
                <span className="text-[9px] font-black uppercase text-center leading-tight">
                  Cliente
                </span>
              </button>

              {/* Admin */}
              <button
                onClick={() => { setRolActual('admin'); onClose(); }}
                className={`p-6 rounded-[2rem] border-4 transition-all flex flex-col items-center gap-3 ${
                  rolActual === 'admin'
                    ? 'border-black bg-[var(--primary)] text-white shadow-[6px_6px_0px_0px_black] scale-105'
                    : 'border-slate-100 opacity-40 hover:opacity-100 hover:border-slate-300'
                }`}
              >
                <Rocket size={28} strokeWidth={3} />
                <span className="text-[9px] font-black uppercase text-center leading-tight">
                  Admin
                </span>
              </button>

              {/* Groomer */}
              <button
                onClick={() => { setRolActual('groomer'); onClose(); }}
                className={`p-6 rounded-[2rem] border-4 transition-all flex flex-col items-center gap-3 ${
                  rolActual === 'groomer'
                    ? 'border-black bg-[var(--primary)] text-white shadow-[6px_6px_0px_0px_black] scale-105'
                    : 'border-slate-100 opacity-40 hover:opacity-100 hover:border-slate-300'
                }`}
              >
                <Scissors size={28} strokeWidth={3} />
                <span className="text-[9px] font-black uppercase text-center leading-tight">
                  Groomer
                </span>
              </button>

              {/* Recepción */}
              <button
                onClick={() => { setRolActual('recepcion'); onClose(); }}
                className={`p-6 rounded-[2rem] border-4 transition-all flex flex-col items-center gap-3 ${
                  rolActual === 'recepcion'
                    ? 'border-black bg-[var(--primary)] text-white shadow-[6px_6px_0px_0px_black] scale-105'
                    : 'border-slate-100 opacity-40 hover:opacity-100 hover:border-slate-300'
                }`}
              >
                <Users size={28} strokeWidth={3} />
                <span className="text-[9px] font-black uppercase text-center leading-tight">
                  Recepción
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="w-full bg-black text-white font-black py-6 rounded-[2rem] shadow-[10px_10px_0px_0px_var(--primary)] hover:translate-y-2 hover:shadow-none transition-all text-xl uppercase tracking-widest italic border-b-[10px] border-black/20"
        >
          ¡Cerrar!
        </button>
      </div>
    </div>
  );
};

export default SettingsModal;
