import React from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, Zap, Clock, ShieldAlert } from 'lucide-react';
import { useClientLiveTracking } from '../../../../../store/ClientTrackingContext';

export default function ClientApprovalModal() {
  const { alertaExtra, handleApproveModifier, handleRejectModifier } = useClientLiveTracking();

  if (!alertaExtra) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/80 backdrop-blur-md flex justify-center items-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg border-[4px] border-black rounded-[2.5rem] shadow-[10px_10px_0px_0px_black] overflow-hidden flex flex-col relative">
        
        {/* Banner de Advertencia */}
        <div className="bg-rose-500 text-white p-5 border-b-[4px] border-black flex items-center gap-3">
          <ShieldAlert size={28} strokeWidth={3} className="animate-pulse" />
          <h3 className="font-black text-xl uppercase tracking-tighter">{alertaExtra.titulo || 'Tratamiento Recomendado'}</h3>
        </div>
        
        <div className="p-6 md:p-8 overflow-y-auto max-h-[70vh] space-y-6">
          <p className="font-bold text-sm text-slate-700 leading-tight">
            {alertaExtra.mensaje}
          </p>
          
          {/* Evidencia fotográfica del Groomer */}
          {alertaExtra.evidencia && (
            <div className="relative aspect-video border-[3px] border-black rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_black]">
              <span className="absolute top-2 left-2 bg-black text-white px-2.5 py-1 text-[9px] font-black uppercase rounded border border-white">
                Evidencia en Cabina
              </span>
              <img
                src={alertaExtra.evidencia}
                className="w-full h-full object-cover"
                alt="Evidencia clínica del estilista"
              />
            </div>
          )}

          {/* Detalles del Adicional */}
          <div className="bg-amber-50 border-[3px] border-black border-dashed rounded-xl p-5 shadow-sm space-y-2">
            <p className="text-[9px] font-black uppercase text-slate-500 tracking-wider">
              Detalle del Servicio Adicional
            </p>
            <div className="flex justify-between items-center">
              <span className="font-black text-base flex items-center gap-1.5">
                <Zap size={18} className="text-amber-500 fill-current" /> {alertaExtra.concepto}
              </span>
              <span className="font-black text-2xl text-rose-600">
                +${alertaExtra.precio}
              </span>
            </div>
            {alertaExtra.tiempoExtra > 0 && (
              <p className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1.5">
                <Clock size={12} /> Agrega aproximadamente {alertaExtra.tiempoExtra} minutos al servicio.
              </p>
            )}
          </div>

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button
              onClick={() => handleRejectModifier(alertaExtra.id)}
              className="flex-1 py-4 border-[3px] border-black rounded-2xl font-black uppercase text-xs tracking-wider shadow-[4px_4px_0px_0px_black] active:translate-y-1 active:shadow-none bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
            >
              Rechazar
            </button>
            <button
              onClick={() => handleApproveModifier(alertaExtra.id)}
              className="flex-[2] py-4 border-[3px] border-black rounded-2xl font-black uppercase text-xs tracking-wider shadow-[4px_4px_0px_0px_black] active:translate-y-1 active:shadow-none bg-rose-400 text-white hover:bg-rose-500 transition-all cursor-pointer"
            >
              Autorizar Cargo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
