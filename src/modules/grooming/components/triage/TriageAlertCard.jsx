import PropTypes from 'prop-types';
import { Check, Image as ImageIcon } from 'lucide-react';
import PopBadge from '../shared/PopBadge';

const TIPO_COLORS = {
  nudos: 'bg-amber-300',
  pulgas: 'bg-rose-300',
  heridas: 'bg-orange-300',
};

/**
 * Tarjeta de alerta en la bandeja de Triage.
 * Nota: Las alertas se generan desde fichas_grooming con campos:
 * estado_ingreso_nudos, estado_ingreso_pulgas, estado_ingreso_heridas.
 * El "recargo sugerido" es un valor de UI; la aprobación final actualiza el precio en reservas.
 */
const TriageAlertCard = ({ alerta, onApprove }) => (
  <div className="flex flex-col sm:flex-row gap-4 border-[3.5px] border-black rounded-3xl p-4 bg-[var(--bg)] shadow-[5px_5px_0px_0px_black] relative overflow-hidden group">
    <div className="absolute top-0 right-0 bg-black text-white px-3 py-1 rounded-bl-xl font-black text-[10px] uppercase z-10">
      Esperando Aprobación
    </div>

    {/* Foto evidencia */}
    {alerta.foto ? (
      <div className="w-full sm:w-32 h-32 rounded-2xl border-[3px] border-black overflow-hidden flex-shrink-0 relative group-hover:scale-105 transition-transform origin-left">
        <img src={alerta.foto} alt="Evidencia" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
          <ImageIcon className="text-white" size={24} />
        </div>
      </div>
    ) : (
      <div className="w-full sm:w-32 h-32 rounded-2xl border-[3px] border-black overflow-hidden flex-shrink-0 bg-slate-100 flex items-center justify-center text-4xl">
        🐾
      </div>
    )}

    {/* Contenido */}
    <div className="flex-1 flex flex-col justify-between mt-2 sm:mt-0">
      <div>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-black text-lg uppercase leading-tight">{alerta.mascotaNombre}</span>
          <PopBadge color={TIPO_COLORS[alerta.tipo] || 'bg-slate-200'}>{alerta.tipo}</PopBadge>
        </div>
        <p className="text-xs font-bold text-slate-600 mb-2">
          Reportado por: <span className="text-black">{alerta.groomerNombre}</span>
        </p>
        <p className="text-sm font-black italic bg-white border-2 border-black p-2 rounded-lg inline-block">
          "{alerta.descripcion}"
        </p>
      </div>

      <div className="flex items-center justify-between mt-4 border-t-2 border-black/10 pt-3">
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Recargo sugerido</span>
          <span className="font-black text-xl text-[var(--primary)]">+${alerta.recargo}Bs</span>
        </div>
        <button
          onClick={() => onApprove(alerta.id)}
          className="bg-black text-white border-2 border-black rounded-xl px-4 py-2 font-black uppercase text-sm shadow-[4px_4px_0px_0px_var(--secondary)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_var(--secondary)] active:translate-y-0 active:shadow-none transition-all flex items-center gap-2"
        >
          <Check size={16} /> Aprobar
        </button>
      </div>
    </div>
  </div>
);

TriageAlertCard.propTypes = {
  alerta: PropTypes.shape({
    id: PropTypes.string.isRequired,
    mascotaNombre: PropTypes.string.isRequired,
    groomerNombre: PropTypes.string.isRequired,
    tipo: PropTypes.string.isRequired,
    descripcion: PropTypes.string.isRequired,
    recargo: PropTypes.number.isRequired,
    foto: PropTypes.string,
  }).isRequired,
  onApprove: PropTypes.func.isRequired,
};

export default TriageAlertCard;
