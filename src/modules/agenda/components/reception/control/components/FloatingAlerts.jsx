import PropTypes from 'prop-types';
import { Clock } from 'lucide-react';

const FloatingAlerts = ({ pendingAlerts, onRestore }) => {
  if (pendingAlerts.length === 0) return null;

  return (
    <div className="fixed bottom-24 left-6 z-[999] flex flex-col gap-3 pointer-events-none md:bottom-6">
      {pendingAlerts.map((alerta) => (
        <button
          key={alerta.cita_id}
          onClick={() => onRestore(alerta)}
          className="pointer-events-auto bg-amber-100 hover:bg-amber-200 border-[3px] border-black p-3 rounded-[1.5rem] shadow-[6px_6px_0px_0px_black] flex items-center gap-4 cursor-pointer hover:-translate-y-1 transition-all animate-in slide-in-from-bottom-8 duration-300 group text-left"
        >
          <div
            className="bg-black text-white w-10 h-10 rounded-full flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_var(--primary)] group-hover:rotate-12 transition-transform shrink-0"
            style={{ '--primary': '#fbbf24' }}
          >
            <Clock size={20} />
          </div>
          <div className="pr-2 min-w-0">
            <p className="text-[10px] font-black uppercase text-amber-700 tracking-wider leading-none mb-1">
              Pendiente Confirmar
            </p>
            <p className="font-black text-sm uppercase text-black leading-none truncate">
              {alerta.mascota} <span className="text-rose-500">({alerta.motivo})</span>
            </p>
          </div>
        </button>
      ))}
    </div>
  );
};

FloatingAlerts.propTypes = {
  pendingAlerts: PropTypes.arrayOf(
    PropTypes.shape({
      cita_id: PropTypes.string.isRequired,
      mascota: PropTypes.string.isRequired,
      motivo: PropTypes.string.isRequired,
    })
  ).isRequired,
  onRestore: PropTypes.func.isRequired,
};

export default FloatingAlerts;
