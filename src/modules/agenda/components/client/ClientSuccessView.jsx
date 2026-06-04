import PropTypes from 'prop-types';
import { CheckCircle2, CalendarDays } from 'lucide-react';

const ClientSuccessView = ({ onBackToDashboard }) => {
  return (
    <div className="animate-in zoom-in-95 duration-300 flex flex-col items-center justify-center py-16 px-4 max-w-lg mx-auto text-center space-y-6">
      <div className="bg-emerald-100 text-emerald-600 p-6 rounded-[2.5rem] border-[4px] border-black shadow-[8px_8px_0px_0px_black] rotate-3">
        <CheckCircle2 size={64} strokeWidth={3} className="animate-bounce" />
      </div>

      <div className="space-y-2">
        <h2 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
          ¡Reserva <span className="text-[var(--primary)]">Confirmada!</span>
        </h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Tu ticket está registrado en el sistema
        </p>
      </div>

      <div className="bg-white border-[3px] border-black p-6 rounded-3xl shadow-[6px_6px_0px_0px_black] w-full text-left space-y-4">
        <h4 className="font-black uppercase text-xs tracking-wider border-b-2 border-slate-100 pb-2 flex items-center gap-2">
          <CalendarDays size={16} className="text-[var(--primary)]" /> Próximos Pasos
        </h4>
        <ul className="text-[11px] font-bold text-slate-600 uppercase tracking-wide space-y-2 list-disc list-inside">
          <li>Te enviaremos una notificación cuando el especialista confirme tu turno.</li>
          <li>Puedes revisar y gestionar todas tus citas desde tu panel de control.</li>
          <li>Recuerda presentarte 10 minutos antes del horario programado.</li>
        </ul>
      </div>

      <button
        onClick={onBackToDashboard}
        className="w-full bg-black text-[var(--secondary)] border-[4px] border-black py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-[6px_6px_0px_0px_var(--primary)] hover:translate-y-0.5 hover:shadow-[4px_4px_0px_0px_var(--primary)] active:translate-y-1.5 active:shadow-none transition-all cursor-pointer"
      >
        Volver al Panel
      </button>
    </div>
  );
};

ClientSuccessView.propTypes = {
  onBackToDashboard: PropTypes.func.isRequired,
};

export default ClientSuccessView;
