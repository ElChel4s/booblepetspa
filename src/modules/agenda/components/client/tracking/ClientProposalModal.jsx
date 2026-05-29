import React from 'react';
import PropTypes from 'prop-types';
import { X, Calendar, User, MessageSquare, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function ClientProposalModal({
  isOpen,
  onClose,
  cita,
  onAccept,
  onReject
}) {
  if (!isOpen || !cita) return null;

  const petName = cita.mascota?.nombre || 'tu mascota';
  const serviceName = cita.servicio?.nombre || 'Servicio';
  const originalGroomer = cita.groomer?.nombre_completo || 'Estilista Original';
  const suggestedGroomerName = cita.sugerencia_groomer_nombre || 'Nuevo Estilista';
  const suggestedGroomerAvatar = cita.sugerencia_groomer_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${suggestedGroomerName}`;

  // Formatear fecha original
  const formattedDate = new Date(cita.fecha_hora_inicio).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

  const hasNewDate = !!cita.sugerencia_fecha_hora_inicio;
  const suggestedFormattedDate = hasNewDate 
    ? new Date(cita.sugerencia_fecha_hora_inicio).toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    : null;

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/80 backdrop-blur-md flex justify-center items-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg border-[4px] border-black rounded-[2.5rem] shadow-[10px_10px_0px_0px_black] overflow-hidden relative flex flex-col">
        
        {/* Botón de cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-slate-100 border-[2px] border-black p-2 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <X size={16} strokeWidth={3} />
        </button>

        {/* Banner de propuesta */}
        <div className="bg-yellow-300 text-black p-5 border-b-[4px] border-black flex items-center gap-3">
          <AlertTriangle size={24} strokeWidth={3} className="animate-pulse" />
          <h3 className="font-black text-lg uppercase tracking-tighter">Propuesta de cambio de horario</h3>
        </div>

        <div className="p-6 md:p-8 space-y-6 overflow-y-auto max-h-[70vh]">
          
          {/* Mensaje de recepción */}
          <div className="bg-slate-50 border-[2.5px] border-black rounded-2xl p-4 flex gap-3 shadow-inner">
            <MessageSquare className="text-[var(--primary)] shrink-0 mt-1" size={20} strokeWidth={3} />
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 leading-none mb-1.5">Mensaje de Recepción</p>
              <p className="text-xs font-bold text-slate-700 leading-snug">
                "{cita.propuesta_mensaje || 'No hay tiempo extra disponible con el groomer solicitado en este horario.'}"
              </p>
            </div>
          </div>

          {/* Detalles del turno original */}
          <div className="text-xs font-bold text-slate-600 space-y-2 border-b-2 border-slate-100 pb-4">
            <p className="uppercase text-[9px] font-black text-slate-400">Detalles de tu cita original</p>
            <p className="flex items-center gap-2"><Calendar size={14} className="text-slate-400" /> {formattedDate}</p>
            <p className="flex items-center gap-2"><User size={14} className="text-slate-400" /> Mascota: <span className="font-black text-black">{petName}</span> ({serviceName})</p>
            <p className="flex items-center gap-2"><User size={14} className="text-slate-400" /> Groomer solicitado: <span className="font-black text-black">{originalGroomer}</span></p>
          </div>

          {/* Groomer Sugerido */}
          {cita.sugerencia_groomer_id && (
            <div className="space-y-3">
              <p className="uppercase text-[9px] font-black text-slate-400">Te sugerimos cambiar al groomer:</p>
              <div className="bg-emerald-50 border-[3px] border-black rounded-2xl p-4 flex items-center justify-between shadow-[3px_3px_0px_0px_black]">
                <div className="flex items-center gap-3">
                  <img
                    src={suggestedGroomerAvatar}
                    alt={suggestedGroomerName}
                    className="w-12 h-12 rounded-full border-2 border-black bg-white object-cover"
                  />
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 leading-none mb-1">Groomer Recomendado</p>
                    <h4 className="font-black text-sm uppercase leading-none text-emerald-950">
                      {suggestedGroomerName}
                    </h4>
                  </div>
                </div>
                <CheckCircle2 className="text-emerald-500 shrink-0" size={24} strokeWidth={3} />
              </div>
            </div>
          )}

          {/* Fecha Sugerida */}
          {hasNewDate && (
            <div className="space-y-3">
              <p className="uppercase text-[9px] font-black text-slate-400">Te sugerimos cambiar el horario a:</p>
              <div className="bg-blue-50 border-[3px] border-black rounded-2xl p-4 flex items-center justify-between shadow-[3px_3px_0px_0px_black]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-2 border-black bg-white flex items-center justify-center">
                    <Calendar size={20} className="text-blue-500" strokeWidth={3} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 leading-none mb-1">Nuevo Horario</p>
                    <h4 className="font-black text-sm uppercase leading-none text-blue-950">
                      {suggestedFormattedDate}
                    </h4>
                  </div>
                </div>
                <CheckCircle2 className="text-blue-500 shrink-0" size={24} strokeWidth={3} />
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button
              onClick={onReject}
              className="flex-1 py-4 border-[3px] border-black rounded-2xl font-black uppercase text-xs tracking-wider shadow-[4px_4px_0px_0px_black] active:translate-y-0.5 active:shadow-none bg-rose-100 text-rose-600 hover:bg-rose-200 transition-all cursor-pointer"
            >
              Rechazar y reprogramar
            </button>
            <button
              onClick={onAccept}
              className="flex-1 py-4 border-[3px] border-black rounded-2xl font-black uppercase text-xs tracking-wider shadow-[4px_4px_0px_0px_black] active:translate-y-0.5 active:shadow-none bg-[var(--primary)] text-white hover:bg-teal-600 transition-all cursor-pointer"
            >
              Aceptar cambio
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

ClientProposalModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  cita: PropTypes.object,
  onAccept: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired
};
