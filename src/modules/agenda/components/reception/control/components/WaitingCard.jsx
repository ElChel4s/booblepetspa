import PropTypes from 'prop-types';
import { Phone, ArrowRight } from 'lucide-react';
import Badge from './Badge';

const PET_EMOJI = { Perro: '🐶', Gato: '🐱', Conejo: '🐰', Ave: '🦜', Otro: '🐾' };

const WaitingCard = ({ cita, onCheckIn }) => {
  const petName = cita.mascota?.nombre || 'Mascota';
  const petEmoji = PET_EMOJI[cita.mascota?.especie] || '🐾';
  const ownerName = cita.mascota?.dueno?.nombre_completo || 'Cliente';
  const ownerTel = cita.mascota?.dueno?.telefono || 'Sin teléfono';
  const formattedTime = new Date(cita.fecha_hora_inicio).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-white border-[3px] border-black rounded-2xl p-4 shadow-[4px_4px_0px_0px_black] flex flex-col gap-3 group hover:-translate-y-1 transition-transform">
      <div className="flex justify-between items-start gap-2">
        <div>
          <h3 className="font-black text-lg uppercase leading-none mb-1 flex items-center gap-1.5">
            <span className="text-2xl shrink-0 leading-none">{petEmoji}</span>
            {petName}
          </h3>
          <p className="text-[10px] font-black uppercase text-slate-400">
            {cita.mascota?.raza || cita.mascota?.especie || 'Peludito'} • {formattedTime}
          </p>
        </div>
        <Badge colorClass="bg-amber-200 text-amber-800 shrink-0">
          {cita.servicio?.nombre || 'Grooming'}
        </Badge>
      </div>

      <div className="bg-slate-50 rounded-xl p-2 border-2 border-dashed border-slate-300">
        <p className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1.5">
          <Phone size={12} strokeWidth={3} /> Dueño: {ownerName} ({ownerTel})
        </p>
      </div>

      <button
        onClick={() => onCheckIn(cita.id)}
        className="w-full bg-emerald-400 hover:bg-emerald-500 text-white border-2 border-black rounded-xl py-2 font-black uppercase text-xs shadow-[3px_3px_0px_0px_black] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 mt-1"
      >
        <ArrowRight size={16} strokeWidth={3} /> Dar Ingreso
      </button>
    </div>
  );
};

WaitingCard.propTypes = {
  cita: PropTypes.shape({
    id: PropTypes.string.isRequired,
    fecha_hora_inicio: PropTypes.string.isRequired,
    servicio: PropTypes.shape({
      nombre: PropTypes.string,
    }),
    mascota: PropTypes.shape({
      nombre: PropTypes.string,
      especie: PropTypes.string,
      raza: PropTypes.string,
      dueno: PropTypes.shape({
        nombre_completo: PropTypes.string,
        telefono: PropTypes.string,
      }),
    }),
  }).isRequired,
  onCheckIn: PropTypes.func.isRequired,
};

export default WaitingCard;
