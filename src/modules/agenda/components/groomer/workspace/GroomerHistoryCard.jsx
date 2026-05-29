import React from 'react';
import PropTypes from 'prop-types';
import { ArrowLeft, Clock, Dog, Thermometer, Bug, Scissors, CheckCircle, FileText, ArrowRight, ShieldAlert } from 'lucide-react';

const DEFAULT_BEFORE = 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=400&fit=crop';
const DEFAULT_AFTER = 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&h=400&fit=crop';

export default function GroomerHistoryCard({ appointment, onClose }) {
  if (!appointment) return null;

  const ficha = appointment.ficha || {};
  const fotos = appointment.fotos || [];
  const serviceName = appointment.servicio?.nombre || appointment.servicio_nombre || 'Servicio Estética';
  
  const beforePhoto = fotos.find((f) => f.tipo_momento === 'antes')?.url_foto || DEFAULT_BEFORE;
  const afterPhoto = fotos.find((f) => f.tipo_momento === 'despues')?.url_foto || DEFAULT_AFTER;

  const formattedDate = appointment.fecha_hora_inicio
    ? new Date(appointment.fecha_hora_inicio).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    : new Date().toLocaleDateString('es-ES');

  const groomerName = appointment.groomer_nombre || 'Estilista';

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-['Nunito',sans-serif] flex flex-col items-center">
      <div className="w-full max-w-3xl">
        <button
          type="button"
          onClick={onClose}
          className="mb-6 flex items-center gap-2 font-black uppercase text-sm hover:-translate-x-2 transition-transform bg-white border-[3px] border-black px-4 py-2 rounded-xl shadow-[4px_4px_0px_0px_black] cursor-pointer"
        >
          <ArrowLeft size={16} /> Volver a Agenda
        </button>

        {/* Tarjeta estilo Recibo/Timeline */}
        <div className="bg-[#FFFAEC] border-[6px] border-black rounded-[2rem] shadow-[16px_16px_0px_0px_black] overflow-hidden relative">
          <div className="h-6 w-full bg-[#FFFAEC] border-b-4 border-black border-dashed opacity-50 mb-4" />

          <div className="px-6 md:px-10 pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
              <div>
                <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-1">Historia Clínica</h2>
                <p className="font-bold text-slate-600 uppercase tracking-widest text-sm flex flex-wrap items-center gap-2">
                  <Clock size={14} /> {formattedDate} &bull; Estilista: {groomerName}
                </p>
              </div>
              <div className="bg-black text-white px-4 py-2 rounded-xl border-[3px] border-black font-black uppercase text-sm shadow-[4px_4px_0px_0px_#34d399] rotate-2 shrink-0">
                Completada ✓
              </div>
            </div>

            <div className="bg-white border-[4px] border-black rounded-2xl p-5 mb-8 shadow-inner flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-yellow-400 rounded-full border-[3px] border-black flex items-center justify-center shrink-0">
                  <Dog size={32} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Paciente</p>
                  <h3 className="text-2xl font-black uppercase leading-none text-slate-800">
                    {appointment.mascota?.nombre || appointment.mascota_nombre || 'Mascota'}
                  </h3>
                </div>
              </div>
              <div className="text-center md:text-right">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Servicio Realizado</p>
                <h3 className="text-xl font-black uppercase text-emerald-600">{serviceName}</h3>
              </div>
            </div>

            {/* Comparación de Fotos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <span className="bg-black text-white px-2 py-1 text-[10px] font-black uppercase tracking-widest rounded-md border-2 border-black inline-block">
                  Foto Antes
                </span>
                <div className="aspect-square bg-slate-200 border-[4px] border-black rounded-2xl overflow-hidden grayscale contrast-125 shadow-sm">
                  <img src={beforePhoto} className="w-full h-full object-cover" alt="Antes" />
                </div>
              </div>
              
              <div className="space-y-2 relative">
                <span className="bg-emerald-400 text-black px-2 py-1 text-[10px] font-black uppercase tracking-widest rounded-md border-2 border-black inline-block shadow-[1px_1px_0px_0px_black]">
                  Foto Después
                </span>
                <div className="aspect-square bg-white border-[4px] border-black rounded-2xl overflow-hidden shadow-[8px_8px_0px_0px_#34d399]">
                  <img src={afterPhoto} className="w-full h-full object-cover" alt="Después" />
                </div>
                <div className="hidden md:flex absolute top-1/2 -left-6 bg-white border-[4px] border-black w-10 h-10 rounded-full items-center justify-center shadow-[4px_4px_0px_0px_black] z-10">
                  <ArrowRight size={20} strokeWidth={4} />
                </div>
              </div>
            </div>

            {/* Diagnóstico de Ingreso */}
            <div className="mb-8">
              <h4 className="font-black uppercase text-sm mb-3 border-b-2 border-black/10 pb-1">Diagnóstico de Ingreso</h4>
              <div className="flex flex-wrap gap-3">
                <div className="bg-white border-[3px] border-black px-3 py-2 rounded-xl flex items-center gap-2 font-black text-xs uppercase shadow-sm">
                  <Thermometer size={16} className="text-blue-500" /> Peso: {ficha.peso_actual || '0.0'} Kg
                </div>
                
                {ficha.estado_ingreso_pulgas && (
                  <div className="bg-rose-100 border-[3px] border-black px-3 py-2 rounded-xl flex items-center gap-2 font-black text-xs uppercase text-rose-700 shadow-[2px_2px_0px_0px_#e11d48]">
                    <Bug size={16} /> Alerta: Pulgas
                  </div>
                )}
                
                {ficha.estado_ingreso_nudos && (
                  <div className="bg-amber-100 border-[3px] border-black px-3 py-2 rounded-xl flex items-center gap-2 font-black text-xs uppercase text-amber-700 shadow-sm">
                    <Scissors size={16} /> Nudos Extremos
                  </div>
                )}

                {ficha.estado_ingreso_heridas && (
                  <div className="bg-purple-100 border-[3px] border-black px-3 py-2 rounded-xl flex items-center gap-2 font-black text-xs uppercase text-purple-700 shadow-sm">
                    <ShieldAlert size={16} /> Alerta: Heridas
                  </div>
                )}
                
                {!ficha.estado_ingreso_pulgas && !ficha.estado_ingreso_nudos && !ficha.estado_ingreso_heridas && (
                  <div className="bg-emerald-50 border-[3px] border-black px-3 py-2 rounded-xl flex items-center gap-2 font-black text-xs uppercase text-emerald-700 shadow-sm">
                    <CheckCircle size={16} /> Sin Novedades Clínicas
                  </div>
                )}
              </div>
            </div>

            {/* Notas y Recomendaciones */}
            <div className="space-y-4">
              {ficha.observaciones_groomer && (
                <div className="bg-blue-50 border-[3px] border-black border-l-[8px] p-4 rounded-r-2xl shadow-sm border-l-blue-500">
                  <h4 className="font-black uppercase text-[10px] text-blue-800 tracking-widest mb-1">
                    Observaciones del Groomer
                  </h4>
                  <p className="font-bold text-slate-800 italic">&ldquo;{ficha.observaciones_groomer}&rdquo;</p>
                </div>
              )}
              
              {ficha.recomendaciones_post && (
                <div className="bg-purple-50 border-[3px] border-black border-l-[8px] border-l-purple-500 p-4 rounded-r-2xl shadow-sm">
                  <h4 className="font-black uppercase text-[10px] text-purple-800 tracking-widest mb-1">
                    Recomendaciones Post-Estética
                  </h4>
                  <p className="font-bold text-slate-800 leading-normal whitespace-pre-line">&ldquo;{ficha.recomendaciones_post}&rdquo;</p>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}

GroomerHistoryCard.propTypes = {
  appointment: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};
