import PropTypes from 'prop-types';
import { AlertTriangle, Zap, Phone, Clock, Sparkles } from 'lucide-react';

const TriageModal = ({
  alerta,
  onClose,
  onPostpone,
  onApprove,
  onReject
}) => {
  if (!alerta) return null;

  const isMod = alerta.es_modificador;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] border-[6px] border-black shadow-[12px_12px_0px_0px_black] p-6 md:p-8 relative">
        <div className={`absolute -top-8 -left-8 ${isMod ? 'bg-amber-400' : 'bg-rose-500'} text-white p-4 border-[4px] border-black rounded-full shadow-[6px_6px_0px_0px_black] rotate-12 animate-pulse`}>
          {isMod ? <Sparkles size={40} className="text-black" strokeWidth={3} /> : <AlertTriangle size={40} strokeWidth={3} />}
        </div>
        
        <h2 className="text-3xl font-black uppercase italic mt-4 mb-2">
          {isMod ? '¡Servicio Adicional!' : '¡Alerta de Ingreso!'}
        </h2>
        <p className="font-bold text-slate-600 mb-6">
          El groomer <b>{alerta.groomer}</b> ha {isMod ? 'sugerido un servicio extra' : 'reportado una incidencia'} para <b>{alerta.mascota}</b>.
        </p>

        <div className={`${isMod ? 'bg-amber-50' : 'bg-rose-50'} border-[3px] border-black rounded-2xl overflow-hidden mb-6 flex flex-col sm:flex-row`}>
          <div className="sm:w-1/3 border-b-[3px] sm:border-b-0 sm:border-r-[3px] border-black bg-black h-32 sm:h-auto">
            <img src={alerta.evidencia_img} alt="Evidencia" className="w-full h-full object-cover opacity-80" />
          </div>
          <div className="p-4 flex-1">
            <h3 className={`font-black uppercase ${isMod ? 'text-amber-600' : 'text-rose-600'} flex items-center gap-1 mb-1`}>
              {isMod ? <Sparkles size={16} /> : <Zap size={16} />} {isMod ? 'Sugerencia' : 'Motivo'}: {alerta.motivo}
            </h3>
            <p className="text-xs font-bold text-slate-700 leading-tight">{alerta.desc}</p>
            <div className="mt-3 inline-block bg-white border-2 border-black rounded-lg px-2 py-1">
              <p className="text-[10px] font-black uppercase text-slate-400">Cargo Sugerido</p>
              <p className="font-black text-lg leading-none">
                {alerta.sugerencia_extra} <span className={isMod ? 'text-amber-500' : 'text-rose-500'}>+{alerta.precio_extra}Bs</span>
              </p>
            </div>
          </div>
        </div>

        {/* BOTÓN DE LLAMADA AL DUEÑO */}
        <div className="bg-white p-3 rounded-2xl border-[3px] border-black mb-6 text-sm font-bold flex flex-col gap-2 shadow-[4px_4px_0px_0px_black]">
          <p className="text-[10px] uppercase text-slate-500 font-black tracking-wider">
            Pide autorización antes de aprobar:
          </p>
          <a
            href={`tel:${alerta.tel}`}
            className="w-full bg-emerald-400 hover:bg-emerald-500 text-black border-[3px] border-black rounded-xl py-2.5 px-4 font-black uppercase flex items-center justify-center gap-2 active:translate-y-1 transition-all"
          >
            <Phone size={18} />
            Llamar a Dueño ({alerta.tel})
          </a>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-3">
          {isMod ? (
            <button
              onClick={onReject}
              className="flex-1 bg-rose-100 hover:bg-rose-200 text-rose-700 border-[3px] border-black rounded-2xl py-3 text-xs font-black uppercase shadow-[3px_3px_0px_0px_black] active:translate-y-1 active:shadow-none transition-all"
            >
              Rechazar
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-black border-[3px] border-black rounded-2xl py-3 text-xs font-black uppercase shadow-[3px_3px_0px_0px_black] active:translate-y-1 active:shadow-none transition-all"
            >
              Ignorar
            </button>
          )}
          <button
            onClick={() => onPostpone(alerta)}
            className="flex-1 bg-amber-300 hover:bg-amber-400 text-black border-[3px] border-black rounded-2xl py-3 text-xs font-black uppercase shadow-[3px_3px_0px_0px_black] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-1"
          >
            <Clock size={16} /> En Espera
          </button>
          <button
            onClick={onApprove}
            className={`flex-[2] w-full sm:w-auto ${isMod ? 'bg-amber-400 hover:bg-amber-500 text-black' : 'bg-rose-400 hover:bg-rose-500 text-white'} border-[3px] border-black rounded-2xl py-3 text-sm font-black uppercase shadow-[3px_3px_0px_0px_black] active:translate-y-1 active:shadow-none transition-all`}
          >
            {isMod ? 'Aprobar Servicio' : 'Aprobar Cargo'}
          </button>
        </div>
      </div>
    </div>
  );
};

TriageModal.propTypes = {
  alerta: PropTypes.shape({
    cita_id: PropTypes.string.isRequired,
    modifier_applied_id: PropTypes.string,
    mascota: PropTypes.string.isRequired,
    groomer: PropTypes.string.isRequired,
    motivo: PropTypes.string.isRequired,
    desc: PropTypes.string.isRequired,
    tel: PropTypes.string.isRequired,
    sugerencia_extra: PropTypes.string.isRequired,
    precio_extra: PropTypes.number.isRequired,
    evidencia_img: PropTypes.string,
    es_modificador: PropTypes.bool,
  }),
  onClose: PropTypes.func.isRequired,
  onPostpone: PropTypes.func.isRequired,
  onApprove: PropTypes.func.isRequired,
  onReject: PropTypes.func,
};

export default TriageModal;
