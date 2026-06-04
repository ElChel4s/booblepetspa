import PropTypes from 'prop-types';
import { Clock, ShieldAlert, AlertTriangle, CheckSquare, MoreVertical } from 'lucide-react';
import ProgressBar from '../shared/ProgressBar';

const PET_EMOJI = { Perro: '🐶', Gato: '🐱', Conejo: '🐰', Ave: '🦜', Otro: '🐾' };

const PetCard = ({ cita, onOpenFicha }) => {
  const now = new Date();
  const fin = new Date(cita.fecha_hora_fin);
  const inicio = new Date(cita.fecha_hora_inicio);
  const msLeft = fin - now;

  const isOvertime = fin < now;
  const isWarning = !isOvertime && msLeft < 15 * 60000;

  // Checklist progress from ficha (si existe)
  const checklist = cita.ficha?.checklist || [];
  const checklistTotal = checklist.length;
  const checklistDone = checklist.filter((c) => c.completado).length;

  let semaforoColor = 'bg-emerald-400';
  let semaforoIcon = <Clock size={16} />;
  let animation = '';

  if (isOvertime) {
    semaforoColor = 'bg-rose-500';
    semaforoIcon = <ShieldAlert size={16} className="text-white animate-pulse" />;
    animation = 'animate-pulse';
  } else if (isWarning) {
    semaforoColor = 'bg-amber-400';
    semaforoIcon = <AlertTriangle size={16} />;
  }

  const petEmoji = PET_EMOJI[cita.mascota?.especie] || '🐾';
  const petName = cita.mascota?.nombre || 'Mascota';
  const petRaza = cita.mascota?.raza || cita.mascota?.especie || '';

  const handleDragStart = (e) => {
    e.dataTransfer.setData('citaId', cita.id);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="group bg-white border-[3px] border-black p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_var(--primary)] hover:-translate-y-1 transition-all cursor-grab active:cursor-grabbing relative"
    >
      {/* Semáforo */}
      <div
        className={`absolute -top-3 -right-3 w-8 h-8 rounded-full border-[3px] border-black flex items-center justify-center shadow-sm z-10 ${semaforoColor} ${animation}`}
      >
        {semaforoIcon}
      </div>

      {/* Mascota info */}
      <div className="flex items-center gap-3 mb-3">
        {cita.mascota?.foto_perfil_url ? (
          <img
            src={cita.mascota.foto_perfil_url}
            alt={petName}
            className="w-12 h-12 rounded-xl border-[2px] border-black object-cover"
          />
        ) : (
          <div className="text-4xl filter drop-shadow-md">{petEmoji}</div>
        )}
        <div>
          <h4 className="font-black text-xl uppercase tracking-tighter leading-none">{petName}</h4>
          <span className="text-[10px] font-bold text-slate-500 uppercase">{petRaza}</span>
        </div>
      </div>

      {/* Hora */}
      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
        {inicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} →{' '}
        {fin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
      </p>

      {checklistTotal > 0 && (
        <ProgressBar current={checklistDone} total={checklistTotal} />
      )}

      {/* Actions */}
      <div className="mt-3 flex gap-2">
        <button
          onClick={() =>
            onOpenFicha(cita.id, {
              mascotaNombre: petName,
              groomerNombre: cita.groomer?.nombre_completo || 'Groomer',
            })
          }
          className="flex-1 bg-slate-100 hover:bg-slate-200 border-2 border-black rounded-lg py-1.5 text-[10px] font-black uppercase flex items-center justify-center gap-1 shadow-[2px_2px_0px_0px_black] active:shadow-none active:translate-y-0.5"
        >
          <CheckSquare size={12} /> Ficha
        </button>
        <button className="w-8 flex-shrink-0 bg-slate-100 hover:bg-slate-200 border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_black] active:shadow-none active:translate-y-0.5">
          <MoreVertical size={14} />
        </button>
      </div>
    </div>
  );
};

PetCard.propTypes = {
  cita: PropTypes.object.isRequired,
  onOpenFicha: PropTypes.func.isRequired,
};

export default PetCard;
