import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Check, Zap } from 'lucide-react';
import Badge from './Badge';
import { supabase } from '../../../../../../api/supabase';

const PET_EMOJI = { Perro: '🐶', Gato: '🐱', Conejo: '🐰', Ave: '🦜', Otro: '🐾' };

export default function GroomingCard({ cita, extras = [], onComplete }) {
  const petName = cita.mascota?.nombre || 'Mascota';
  const petEmoji = PET_EMOJI[cita.mascota?.especie] || '🐾';
  const groomerName = cita.groomer?.nombre_completo || 'Sin asignar';

  // Cargar orden de pasos para esta cita
  const [pasos, setPasos] = useState([]);
  useEffect(() => {
    const fetchPasos = async () => {
      if (!cita.servicio_id || !supabase) return;
      const { data } = await supabase
        .from('pasos_servicio')
        .select('tarea_id, orden')
        .eq('servicio_id', cita.servicio_id)
        .order('orden', { ascending: true });
      setPasos(data || []);
    };
    fetchPasos();
  }, [cita.servicio_id]);

  // Ordenar checklist según los pasos predefinidos del servicio
  const sortedChecklist = useMemo(() => {
    const list = [...(cita.ficha?.checklist || [])];
    if (pasos.length === 0 || list.length === 0) return list;

    const ordenMap = new Map(pasos.map((p) => [p.tarea_id, p.orden]));

    return list.sort((a, b) => {
      const ordA = ordenMap.has(a.tarea_id) ? ordenMap.get(a.tarea_id) : 999;
      const ordB = ordenMap.has(b.tarea_id) ? ordenMap.get(b.tarea_id) : 999;
      return ordA - ordB;
    });
  }, [cita.ficha?.checklist, pasos]);

  // Progreso y paso actual
  const totalItems = sortedChecklist.length;
  const doneItems = sortedChecklist.filter((item) => item.completado).length;
  const progressPercent = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  const currentStepIndex = sortedChecklist.findIndex((item) => !item.completado);
  let currentStepText = '';
  if (totalItems > 0) {
    if (currentStepIndex === -1) {
      currentStepText = 'Completado';
    } else {
      const currentStepName = sortedChecklist[currentStepIndex]?.tarea?.nombre || 'Tarea';
      currentStepText = `Paso ${currentStepIndex + 1} de ${totalItems}: ${currentStepName}`;
    }
  } else {
    currentStepText = 'Preparando...';
  }

  return (
    <div className="bg-white border-[3px] border-black rounded-2xl p-4 shadow-[4px_4px_0px_0px_black] flex flex-col gap-3 relative overflow-hidden group">
      <div className="absolute left-0 top-0 bottom-0 w-2 bg-blue-400" />
      
      <div className="flex justify-between items-center pl-2">
        <div>
          <h3 className="font-black text-lg uppercase leading-none mb-1 flex items-center gap-1.5 text-slate-800">
            <span className="text-2xl shrink-0 leading-none">{petEmoji}</span>
            {petName}
          </h3>
          <span className="text-[10px] font-black uppercase text-slate-500">
            Estilista: {groomerName}
          </span>
        </div>
        
        {/* Botón simular fin */}
        <button
          type="button"
          onClick={() => onComplete(cita.id)}
          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-emerald-300 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_black] active:translate-y-0.5 active:shadow-none transition-all group-hover:scale-110 cursor-pointer"
          title="Simular Fin de Servicio (Genera Ficha de Grooming)"
        >
          <Check size={14} strokeWidth={4} className="text-black" />
        </button>
      </div>

      {/* Extras/Modificadores aplicados */}
      {extras.length > 0 && (
        <div className="pl-2 flex flex-wrap gap-1">
          {extras.map((mod) => (
            <span
              key={mod.id}
              className="text-[9px] font-black uppercase bg-rose-100 border-2 border-black px-2 py-0.5 rounded-lg shadow-[2px_2px_0px_0px_black] text-rose-600 flex items-center gap-1 animate-in slide-in-from-left-2 duration-300"
            >
              <Zap size={10} className="fill-current" /> {mod.concepto} (+Bs. {mod.precio})
            </span>
          ))}
        </div>
      )}

      {/* Barra de progreso */}
      <div className="pl-2 mt-1">
        <div className="flex flex-col gap-1 text-[10px] font-black uppercase text-slate-600 mb-1.5">
          <div className="flex justify-between">
            <span>Progreso: {progressPercent}%</span>
            <span className="text-blue-600 font-extrabold normal-case">{currentStepText}</span>
          </div>
        </div>
        
        <div className="w-full h-4 bg-slate-200 rounded-full border-[3px] border-black overflow-hidden relative shadow-inner">
          <div
            className="h-full bg-blue-400 transition-all duration-1000 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSI+PC9yZWN0Pgo8cGF0aCBkPSJNMCAwTDggOFpNOCAwTDAgOFoiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIyIj48L3BhdGg+Cjwvc3ZnPg==')] opacity-50" />
        </div>
      </div>
    </div>
  );
}

GroomingCard.propTypes = {
  cita: PropTypes.shape({
    id: PropTypes.string.isRequired,
    servicio_id: PropTypes.string,
    groomer: PropTypes.shape({
      nombre_completo: PropTypes.string,
    }),
    mascota: PropTypes.shape({
      nombre: PropTypes.string,
      especie: PropTypes.string,
    }),
    ficha: PropTypes.shape({
      checklist: PropTypes.array,
    }),
  }).isRequired,
  extras: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      concepto: PropTypes.string,
      precio: PropTypes.number,
    })
  ),
  onComplete: PropTypes.func.isRequired,
};
