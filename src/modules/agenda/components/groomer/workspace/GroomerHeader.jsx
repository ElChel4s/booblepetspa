import React from 'react';
import PropTypes from 'prop-types';
import { Play, Pause, Clock, Dog, Minimize2 } from 'lucide-react';

const formatTimerValue = (totalSeconds) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  
  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export default function GroomerHeader({ activeApp, isPaused, onPauseToggle, activeTimer, onMinimize }) {
  const petName = activeApp?.mascota?.nombre || activeApp?.mascota_nombre || 'Paciente';
  const serviceName = activeApp?.servicio?.nombre || 'Servicio de Estética';

  return (
    <header className="bg-black text-white p-4 flex flex-col sm:flex-row justify-between items-center border-b-[4px] border-yellow-400 shadow-md z-20 gap-4">
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <div className="w-12 h-12 bg-yellow-400 rounded-full border-[3px] border-white flex items-center justify-center shrink-0">
          <Dog size={24} className="text-black" />
        </div>
        <div>
          <h2 className="text-2xl font-black uppercase italic leading-none">{petName}</h2>
          <p className="text-xs font-bold text-slate-300 uppercase tracking-wide mt-1">{serviceName}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
        <div className="flex items-center gap-2 bg-slate-800 border-2 border-slate-600 rounded-xl px-4 py-2 font-black text-yellow-400 font-mono text-xl">
          <Clock size={20} />
          <span>{formatTimerValue(activeTimer)}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onPauseToggle}
            className={`w-12 h-12 rounded-xl border-[3px] flex items-center justify-center shadow-[3px_3px_0px_0px_white] active:translate-y-1 active:shadow-none transition-all ${
              isPaused
                ? 'bg-amber-500 border-white text-black'
                : 'bg-slate-800 border-slate-600 text-white hover:bg-slate-700'
            }`}
            title={isPaused ? 'Reanudar Servicio' : 'Pausar Servicio'}
          >
            {isPaused ? <Play size={20} className="fill-current" /> : <Pause size={20} className="fill-current" />}
          </button>

          {onMinimize && (
            <button
              onClick={onMinimize}
              className="w-12 h-12 rounded-xl border-[3px] border-slate-600 bg-slate-800 text-white hover:bg-slate-700 flex items-center justify-center shadow-[3px_3px_0px_0px_white] active:translate-y-1 active:shadow-none transition-all"
              title="Minimizar Espacio de Trabajo"
            >
              <Minimize2 size={20} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

GroomerHeader.propTypes = {
  activeApp: PropTypes.object,
  isPaused: PropTypes.bool.isRequired,
  onPauseToggle: PropTypes.func.isRequired,
  activeTimer: PropTypes.number.isRequired,
  onMinimize: PropTypes.func,
};

