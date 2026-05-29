import PropTypes from 'prop-types';
import { Play, Timer, Edit3, CalendarDays } from 'lucide-react';
import { PetTag, StatusBadge } from './GroomerUI';

const formatHour = (isoString) => {
  if (!isoString) return '--:--';
  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

const GroomerTimeline = ({
  appointments,
  activeApp,
  onStart,
  onOpenFicha,
  saving,
}) => {
  // Filter out appointments in focus (en_proceso or pausada)
  const remainingApps = appointments.filter(
    (app) => app.estado !== 'en_proceso' && app.estado !== 'pausada'
  );

  return (
    <div className="mt-4">
      <h3 className="text-2xl font-black italic uppercase mb-8 flex items-center gap-3 border-b-4 border-black/10 pb-3">
        <CalendarDays size={28} strokeWidth={3} className="text-[var(--primary)]" /> Planificación de Turnos
      </h3>

      {remainingApps.length > 0 ? (
        <div className="relative pl-6 md:pl-10 space-y-8 before:absolute before:inset-y-0 before:left-[1.8rem] md:before:left-[2.8rem] before:w-[6px] before:bg-black/10 before:rounded-full">
          {remainingApps.map((app) => {
            const isFinished = app.estado === 'completada';
            const isReady = app.estado === 'en_espera';
            const emoji = app.mascota?.especie?.toLowerCase() === 'gato' ? '🐈' : '🐶';
            const estDuration =
              (app.servicio?.duracion_base_minutos || 60) +
              (app.modificadores_aplicados?.reduce((sum, mod) => sum + Number(mod.tiempo_extra_minutos || 0), 0) || 0);

            return (
              <div key={app.id} className="relative flex flex-col group animate-in fade-in duration-300">
                {/* Time Node */}
                <div
                  className={`absolute -left-[3.1rem] md:-left-[4.1rem] top-5 w-20 h-12 flex items-center justify-center rounded-2xl border-[3.5px] border-black z-10 transition-all shadow-[3px_3px_0px_0px_black] ${
                    isFinished
                      ? 'bg-slate-200 border-slate-300 text-slate-400 shadow-none'
                      : isReady
                      ? 'bg-amber-400 text-black scale-105'
                      : 'bg-white text-black'
                  }`}
                >
                  <span className="font-black text-[13px] tabular-nums">{formatHour(app.fecha_hora_inicio)}</span>
                </div>

                {/* Card wrapper */}
                <div
                  className={`ml-8 bg-white border-[4px] border-black p-5 md:p-6 rounded-[2.5rem] transition-all duration-200 ${
                    isFinished
                      ? 'opacity-50 grayscale bg-slate-50 border-slate-300 shadow-none'
                      : isReady
                      ? 'shadow-[8px_8px_0px_0px_var(--secondary)] hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_var(--secondary)]'
                      : 'shadow-[6px_6px_0px_0px_black] hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_black]'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h4
                          className={`text-3xl font-black italic uppercase leading-none tracking-tighter truncate ${
                            isFinished ? 'line-through decoration-4 text-slate-400' : ''
                          }`}
                        >
                          {app.mascota?.nombre || app.mascota_nombre || 'Mascota'}{' '}
                          <span className="text-2xl no-underline">{emoji}</span>
                        </h4>
                        <StatusBadge status={app.estado} />
                      </div>

                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                        {app.servicio?.nombre || 'Servicio'}
                      </p>

                      {app.modificadores_aplicados && app.modificadores_aplicados.length > 0 && !isFinished && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {app.modificadores_aplicados.map((mod) => (
                            <PetTag key={mod.id} tag={mod} />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-4 w-full md:w-auto border-t-4 md:border-t-0 md:border-l-4 border-slate-100 pt-4 md:pt-0 md:pl-6 shrink-0">
                      <div className="text-center md:text-right">
                        <span className="block text-[9px] font-black uppercase text-slate-400">
                          Duración Est.
                        </span>
                        <div className="flex items-center gap-1 font-black text-lg text-slate-800 justify-center md:justify-end">
                          <Timer size={16} strokeWidth={2.5} /> {estDuration}m
                        </div>
                      </div>

                      {!isFinished && (
                        <div className="flex gap-2 w-full md:w-auto mt-2">
                          <button
                            onClick={() => onStart(app.id)}
                            disabled={activeApp != null || saving}
                            className={`px-4 py-2.5 rounded-xl border-[3px] border-black font-black text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-[2px_2px_0px_0px_black] active:shadow-none ${
                              activeApp || saving
                                ? 'bg-slate-100 text-slate-400 opacity-60 cursor-not-allowed border-slate-300 shadow-none'
                                : isReady
                                ? 'bg-black text-[var(--secondary)] shadow-[3px_3px_0px_0px_var(--secondary)] hover:bg-slate-900'
                                : 'bg-white text-black hover:bg-slate-100'
                            }`}
                          >
                            <Play size={12} fill={isReady && !activeApp ? 'currentColor' : 'none'} />
                            {isReady ? 'Comenzar' : 'Iniciar'}
                          </button>
                          <button
                            onClick={() => onOpenFicha(app)}
                            className="p-2.5 rounded-xl border-[3px] border-black bg-white font-black uppercase shadow-[2px_2px_0px_0px_black] active:scale-95 active:shadow-none hover:bg-slate-100 transition-all flex items-center justify-center"
                            title="Ficha Grooming"
                          >
                            <Edit3 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-xs font-black uppercase text-slate-400 tracking-wider py-8 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
          No hay más citas asignadas para hoy
        </div>
      )}
    </div>
  );
};

GroomerTimeline.propTypes = {
  appointments: PropTypes.array.isRequired,
  activeApp: PropTypes.object,
  onStart: PropTypes.func.isRequired,
  onOpenFicha: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};

export default GroomerTimeline;
