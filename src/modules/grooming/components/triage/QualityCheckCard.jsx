import PropTypes from 'prop-types';
import { Search } from 'lucide-react';

const QualityCheckCard = ({ cita, onOpenFicha }) => {
  const fechaLabel = new Date(cita.fecha_hora_fin).toLocaleString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    day: 'numeric',
    month: 'short',
  });

  return (
    <div
      onClick={() =>
        onOpenFicha(cita.id, {
          mascotaNombre: cita.mascota?.nombre || 'Mascota',
          groomerNombre: cita.groomer?.nombre_completo || 'Groomer',
        })
      }
      className="bg-white border-[3px] border-black rounded-2xl p-4 shadow-[4px_4px_0px_0px_black] flex items-center justify-between cursor-pointer hover:bg-slate-50 hover:-translate-y-1 transition-all"
    >
      <div>
        <h4 className="font-black uppercase">
          {cita.mascota?.nombre || 'Mascota'}{' '}
          <span className="text-emerald-500 ml-1">✓</span>
        </h4>
        <p className="text-[10px] font-bold text-slate-500 uppercase">
          {cita.groomer?.nombre_completo} · {fechaLabel}
        </p>
      </div>
      <div className="w-10 h-10 rounded-full border-2 border-black flex items-center justify-center bg-[var(--primary)] text-white shadow-sm shrink-0">
        <Search size={16} strokeWidth={3} />
      </div>
    </div>
  );
};

QualityCheckCard.propTypes = {
  cita: PropTypes.object.isRequired,
  onOpenFicha: PropTypes.func.isRequired,
};

export default QualityCheckCard;
