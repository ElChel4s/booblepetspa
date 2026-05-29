import React from 'react';
import PropTypes from 'prop-types';
import { Info, MessageSquare } from 'lucide-react';

export default function PatientClinicalInfo({ activeApp }) {
  const mascota = activeApp?.mascota || {};
  const tamano = mascota.tamano || 'No Definido';
  const temperamento = mascota.temperamento || 'No Definido';
  const alergias = mascota.alergias || 'Ninguna';
  const notasCliente = activeApp?.notas_cliente || activeApp?.notes_cliente || '';

  return (
    <div className="bg-blue-50 border-[3px] border-blue-200 border-dashed rounded-2xl p-4 relative mt-2">
      <div className="absolute -top-3 -left-3 bg-blue-500 text-white w-8 h-8 flex items-center justify-center rounded-full border-2 border-black">
        <Info size={16} strokeWidth={3} />
      </div>
      <h4 className="font-black text-blue-900 uppercase text-xs mb-3 ml-4 tracking-widest">
        Información del Paciente
      </h4>
      
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-white border-2 border-blue-200 rounded-lg p-2 text-center shadow-sm">
          <p className="text-[9px] uppercase font-black text-slate-400">Tamaño</p>
          <p className="font-bold text-xs capitalize text-slate-700">{tamano}</p>
        </div>
        <div className="bg-white border-2 border-blue-200 rounded-lg p-2 text-center shadow-sm">
          <p className="text-[9px] uppercase font-black text-slate-400">Carácter Base</p>
          <p className="font-bold text-xs capitalize text-slate-700">{temperamento}</p>
        </div>
        <div className="bg-white border-2 border-rose-200 rounded-lg p-2 text-center shadow-sm">
          <p className="text-[9px] uppercase font-black text-rose-400">Alergias</p>
          <p className="font-black text-xs text-rose-600 truncate" title={alergias}>
            {alergias}
          </p>
        </div>
      </div>
      
      {notasCliente && (
        <div className="bg-yellow-100 border-2 border-yellow-300 rounded-lg p-3 flex gap-2 items-start shadow-sm">
          <MessageSquare size={14} className="text-yellow-700 mt-0.5 shrink-0" />
          <div>
            <p className="text-[9px] uppercase font-black text-yellow-700">Nota del Cliente</p>
            <p className="font-bold text-xs text-slate-800 leading-snug">
              &ldquo;{notasCliente}&rdquo;
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

PatientClinicalInfo.propTypes = {
  activeApp: PropTypes.object,
};
