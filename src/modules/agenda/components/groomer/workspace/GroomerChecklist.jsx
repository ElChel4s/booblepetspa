import React from 'react';
import PropTypes from 'prop-types';
import { Check, Sparkles } from 'lucide-react';

export default function GroomerChecklist({ checklist, onToggleTask, saving }) {
  const total = checklist.length;
  const completedCount = checklist.filter((t) => t.completado).length;
  const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Barra de Progreso */}
      <div className="bg-white border-[4px] border-black rounded-3xl p-5 shadow-[8px_8px_0px_0px_black] mb-8">
        <div className="flex justify-between items-end mb-2">
          <h3 className="font-black text-xl uppercase">Progreso del Servicio</h3>
          <span className="text-3xl font-black text-emerald-500">{progressPercent}%</span>
        </div>
        <div className="w-full h-8 bg-slate-200 rounded-full border-[4px] border-black overflow-hidden relative shadow-inner">
          <div
            className="h-full bg-emerald-400 transition-all duration-500 ease-out flex items-center justify-end pr-2"
            style={{ width: `${progressPercent}%` }}
          >
            {progressPercent > 10 && <Sparkles size={16} className="text-white opacity-50 animate-pulse" />}
          </div>
        </div>
      </div>

      {/* TAREAS */}
      <div className="flex flex-col gap-4">
        <h4 className="font-black text-sm uppercase text-slate-500 tracking-widest pl-2">
          Tareas Asignadas ({completedCount}/{total})
        </h4>
        
        {checklist.map((item, idx) => {
          const isDone = !!item.completado;
          const taskName = item.tarea?.nombre || `Tarea ${idx + 1}`;
          const isBlocked = idx > 0 && !checklist[idx - 1].completado;
          
          return (
            <button
              key={item.id}
              type="button"
              disabled={saving || isBlocked}
              onClick={() => onToggleTask(item.id, isDone)}
              className={`w-full text-left p-5 border-[4px] rounded-2xl font-black uppercase text-lg sm:text-xl transition-all flex items-center justify-between group cursor-pointer ${
                isDone
                  ? 'bg-emerald-100 border-black text-emerald-800 scale-[0.98] opacity-70 shadow-none'
                  : isBlocked
                  ? 'bg-slate-100 border-slate-300 text-slate-400 opacity-45 cursor-not-allowed shadow-none'
                  : 'bg-white border-black shadow-[6px_6px_0px_0px_black] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_black]'
              }`}
            >
              <span className="flex items-center gap-4">
                <span
                  className={`w-8 h-8 rounded-full border-[3px] flex items-center justify-center shrink-0 transition-colors ${
                    isDone
                      ? 'bg-emerald-400 border-black'
                      : isBlocked
                      ? 'bg-slate-200 border-slate-300'
                      : 'bg-slate-100 border-black group-hover:bg-yellow-200'
                  }`}
                >
                  {isDone ? <Check size={16} strokeWidth={4} /> : <span className="text-xs font-black">{idx + 1}</span>}
                </span>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 tracking-wider">
                    Paso {idx + 1} de {total} {isBlocked && '🔒'}
                  </span>
                  <span className="leading-tight mt-0.5">{taskName}</span>
                </div>
              </span>
              {!isDone && !isBlocked && (
                <span className="text-[10px] text-slate-400 tracking-widest group-hover:text-black shrink-0 transition-colors">
                  TOCAR
                </span>
              )}
              {isBlocked && (
                <span className="text-[9px] text-slate-400 tracking-wider shrink-0 uppercase italic font-bold">
                  Bloqueado
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

GroomerChecklist.propTypes = {
  checklist: PropTypes.array.isRequired,
  onToggleTask: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};
