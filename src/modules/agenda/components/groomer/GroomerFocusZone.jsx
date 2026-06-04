import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Play, Pause, CheckCircle2, Sparkles } from 'lucide-react';
import { PetTag } from './GroomerUI';

const formatTimerValue = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const GroomerFocusZone = ({ activeApp, onStart, onPause, onFinish, saving }) => {
  const [activeTimer, setActiveTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const estDuration = activeApp
    ? (activeApp.servicio?.duracion_base_minutos || 60) +
      (activeApp.modificadores_aplicados?.reduce((sum, mod) => sum + Number(mod.tiempo_extra_minutos || 0), 0) || 0)
    : 60;

  useEffect(() => {
    if (!activeApp) {
      setActiveTimer(0);
      setIsTimerRunning(false);
      return;
    }

    const isRunning = activeApp.estado === 'en_proceso';
    setIsTimerRunning(isRunning);

    const saved = localStorage.getItem(`groomer_timer_${activeApp.id}`);
    let parsed = saved ? parseInt(saved, 10) : 0;

    if (isRunning) {
      const lastActive = localStorage.getItem(`groomer_timer_last_active_${activeApp.id}`);
      if (lastActive) {
        const diff = Math.floor((Date.now() - parseInt(lastActive, 10)) / 1000);
        parsed += Math.max(0, diff);
      }
    }
    setActiveTimer(parsed);
  }, [activeApp]);

  useEffect(() => {
    let interval;
    if (isTimerRunning && activeApp) {
      interval = setInterval(() => {
        setActiveTimer((prev) => {
          const next = prev + 1;
          localStorage.setItem(`groomer_timer_${activeApp.id}`, next.toString());
          localStorage.setItem(`groomer_timer_last_active_${activeApp.id}`, Date.now().toString());
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, activeApp]);

  useEffect(() => {
    if (activeApp && !isTimerRunning) {
      localStorage.removeItem(`groomer_timer_last_active_${activeApp.id}`);
    }
  }, [isTimerRunning, activeApp]);

  if (!activeApp) return null;

  const handleFinishClick = () => {
    localStorage.removeItem(`groomer_timer_${activeApp.id}`);
    localStorage.removeItem(`groomer_timer_last_active_${activeApp.id}`);
    onFinish(activeApp.id);
  };

  const progressPercentage = (activeTimer / (estDuration * 60)) * 100;
  const isOvertime = progressPercentage >= 100;
  const isWarning = progressPercentage >= 80 && !isOvertime;
  const emoji = activeApp.mascota?.especie?.toLowerCase() === 'gato' ? '🐈' : '🐶';

  return (
    <div
      className={`animate-in zoom-in-95 duration-300 rounded-[3rem] p-6 md:p-8 border-[6px] border-black transition-all shadow-[12px_12px_0px_0px_black] relative overflow-hidden ${
        activeApp.estado === 'pausada'
          ? 'bg-slate-200 text-black shadow-[12px_12px_0px_0px_black]'
          : isOvertime
          ? 'bg-rose-500 text-white shadow-[12px_12px_0px_0px_#881337]'
          : 'bg-[var(--primary)] text-white'
      }`}
    >
      {/* State label */}
      <div className="absolute top-0 right-0 bg-black text-white px-6 py-2 rounded-bl-[2rem] border-b-[4px] border-l-[4px] border-black font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
        {activeApp.estado === 'pausada' ? <Pause size={14} /> : <Sparkles size={14} />}
        {activeApp.estado === 'pausada' ? 'En Pausa' : 'Servicio en curso'}
      </div>

      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-end gap-6 mb-8 mt-4">
        <div>
          <h2 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter leading-none mb-2">
            {activeApp.mascota?.nombre || activeApp.mascota_nombre || 'Mascota'}{' '}
            <span className="text-4xl">{emoji}</span>
          </h2>
          <p
            className={`text-sm md:text-base font-black uppercase tracking-wider ${
              activeApp.estado === 'pausada' ? 'text-slate-600' : 'text-teal-900'
            }`}
          >
            {activeApp.servicio?.nombre || 'Servicio'}
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {activeApp.modificadores_aplicados?.length ? (
              activeApp.modificadores_aplicados.map((mod) => (
                <PetTag key={mod.id} tag={mod} />
              ))
            ) : (
              <span className="text-[10px] font-bold opacity-60 uppercase">
                Sin modificadores
              </span>
            )}
          </div>
        </div>

        {/* Big Clock */}
        <div
          className={`text-center p-5 rounded-[2rem] border-[5px] w-full md:w-auto shadow-inner ${
            activeApp.estado === 'pausada'
              ? 'bg-white border-black text-black'
              : isOvertime
              ? 'bg-black border-white text-rose-500 animate-pulse'
              : 'bg-black border-black text-[var(--secondary)]'
          }`}
        >
          <span className="block text-[10px] font-black uppercase opacity-70 mb-1">
            {isOvertime ? '¡TIEMPO EXCEDIDO!' : 'Tiempo Real'}
          </span>
          <span className="text-6xl md:text-7xl font-black tabular-nums tracking-tighter leading-none">
            {formatTimerValue(activeTimer)}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-10 bg-black/10 p-4 rounded-[2rem]">
        <div className="flex justify-between text-[11px] font-black uppercase mb-3 px-1">
          <span
            className={activeApp.estado === 'pausada' ? 'text-slate-700' : 'text-white'}
          >
            {isOvertime ? 'Límite superado' : 'Progreso de tina'}
          </span>
          <span
            className={activeApp.estado === 'pausada' ? 'text-slate-700' : 'text-white'}
          >
            Meta: {estDuration} min
          </span>
        </div>
        <div className="h-6 rounded-full border-[4px] border-black overflow-hidden bg-white/20 relative">
          <div
            className={`absolute top-0 left-0 h-full transition-all duration-1000 ${
              isOvertime
                ? 'bg-rose-900 w-full'
                : isWarning
                ? 'bg-amber-400'
                : activeApp.estado === 'pausada'
                ? 'bg-slate-400'
                : 'bg-[var(--secondary)]'
            }`}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Button panel */}
      <div className="grid grid-cols-2 gap-4">
        {activeApp.estado === 'pausada' ? (
          <button
            onClick={() => onStart(activeApp.id)}
            disabled={saving}
            className="bg-emerald-400 text-black py-6 rounded-[2rem] border-[5px] border-black font-black text-xl uppercase tracking-widest shadow-[6px_6px_0px_0px_black] hover:translate-y-0.5 hover:shadow-[4px_4px_0px_0px_black] active:shadow-none active:translate-y-2 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <Play fill="currentColor" size={28} /> Reanudar
          </button>
        ) : (
          <button
            onClick={() => onPause(activeApp.id)}
            disabled={saving}
            className="bg-amber-400 text-black py-6 rounded-[2rem] border-[5px] border-black font-black text-xl uppercase tracking-widest shadow-[6px_6px_0px_0px_black] hover:translate-y-0.5 hover:shadow-[4px_4px_0px_0px_black] active:shadow-none active:translate-y-2 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <Pause fill="currentColor" size={28} /> Pausar
          </button>
        )}
        <button
          onClick={handleFinishClick}
          disabled={saving}
          className="bg-black text-white py-6 rounded-[2rem] border-[5px] border-black font-black text-xl uppercase tracking-widest shadow-[6px_6px_0px_0px_var(--secondary)] hover:translate-y-0.5 hover:shadow-[4px_4px_0px_0px_var(--secondary)] active:shadow-none active:translate-y-2 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <CheckCircle2 size={28} /> Terminar
        </button>
      </div>
    </div>
  );
};

GroomerFocusZone.propTypes = {
  activeApp: PropTypes.shape({
    id: PropTypes.string.isRequired,
    estado: PropTypes.string.isRequired,
    mascota_nombre: PropTypes.string,
    mascota: PropTypes.shape({
      nombre: PropTypes.string,
      especie: PropTypes.string,
    }),
    servicio: PropTypes.shape({
      nombre: PropTypes.string,
      duracion_base_minutos: PropTypes.number,
    }),
    modificadores_aplicados: PropTypes.array,
  }),
  onStart: PropTypes.func.isRequired,
  onPause: PropTypes.func.isRequired,
  onFinish: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};

export default GroomerFocusZone;
