import PropTypes from 'prop-types';
import { 
  Clock, CalendarDays, User, Trash2, AlertTriangle, MessageCircle, Calendar,
  CheckCircle2, XCircle, Hourglass, Sparkles, CalendarPlus, ArrowRight
} from 'lucide-react';

const canCancelAutonomous = (fechaInicioStr) => {
  const citaDate = new Date(fechaInicioStr);
  const diffHours = (citaDate - new Date()) / (1000 * 60 * 60);
  return diffHours >= 4;
};

const formatDate = (isoStr) =>
  new Date(isoStr).toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });

// ─── Badge de estado ───────────────────────────────────────────────────────────
const StatusBadge = ({ estado }) => {
  const map = {
    programada: { label: 'En Espera', bg: 'bg-amber-400', text: 'text-black', icon: Hourglass },
    agendada:   { label: 'Confirmada', bg: 'bg-emerald-400', text: 'text-black', icon: CheckCircle2 },
    en_proceso: { label: 'En Proceso', bg: 'bg-blue-500', text: 'text-white', icon: Sparkles },
    cancelada:  { label: 'Cancelada', bg: 'bg-rose-500', text: 'text-white', icon: XCircle },
    finalizada: { label: 'Finalizada', bg: 'bg-slate-500', text: 'text-white', icon: CheckCircle2 },
  };
  const cfg = map[estado] || { label: estado, bg: 'bg-slate-300', text: 'text-black', icon: Clock };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border-2 border-black ${cfg.bg} ${cfg.text}`}>
      <Icon size={11} strokeWidth={3} /> {cfg.label}
    </span>
  );
};

// ─── Tarjeta individual de cita ────────────────────────────────────────────────
const CitaCard = ({ cita, onCancelAppointment, saving, onQuickRebook }) => {
  const isCancelable = canCancelAutonomous(cita.fecha_hora_inicio);
  const isRejected = cita.estado === 'cancelada' && cita.rechazo_mensaje;
  const isPending = cita.estado === 'programada';
  const isConfirmed = cita.estado === 'agendada';

  const borderColor = isRejected
    ? 'border-rose-500 shadow-[4px_4px_0px_0px_#f43f5e]'
    : isConfirmed
    ? 'border-emerald-400 shadow-[4px_4px_0px_0px_#34d399]'
    : isPending
    ? 'border-amber-400 shadow-[4px_4px_0px_0px_#fbbf24]'
    : 'border-black shadow-[4px_4px_0px_0px_black]';

  return (
    <div className={`bg-white border-[3px] ${borderColor} rounded-[1.8rem] overflow-hidden transition-all hover:-translate-y-0.5`}>
      {/* Franja de estado en la parte superior */}
      <div className={`h-1.5 w-full ${
        isRejected ? 'bg-rose-500' :
        isConfirmed ? 'bg-emerald-400' :
        isPending ? 'bg-amber-400' : 'bg-slate-300'
      }`} />

      <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-5">
        {/* Foto mascota */}
        <img
          src={
            cita.mascota?.foto_perfil_url ||
            `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${cita.mascota?.nombre || 'Pet'}&backgroundColor=fbbf24`
          }
          alt={cita.mascota?.nombre || 'Pet'}
          className="w-20 h-20 bg-slate-50 border-[3px] border-black rounded-[1.2rem] shadow-sm shrink-0 object-cover"
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h3 className="text-2xl font-black uppercase italic leading-none text-slate-900 mr-1">
              {cita.mascota?.nombre}
            </h3>
            <StatusBadge estado={cita.estado} />
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-[11px] font-black text-white bg-[var(--primary)] px-2 py-0.5 rounded border-2 border-black uppercase tracking-widest">
              {cita.servicio?.nombre || 'Grooming'}
            </span>
            <span className="text-[10px] font-black text-slate-500 flex items-center gap-1 uppercase">
              <User size={12} /> {cita.groomer?.nombre_completo || 'Estilista por asignar'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-800 bg-slate-100 px-3 py-2 rounded-xl border-[2px] border-black/10 w-max uppercase tracking-wider">
            <CalendarDays size={16} className="text-[var(--primary)]" />
            {formatDate(cita.fecha_hora_inicio)}
          </div>

          {/* Mensaje de rechazo inline */}
          {isRejected && cita.rechazo_mensaje && (
            <div className="mt-3 bg-rose-50 border-2 border-rose-200 rounded-xl p-3 flex gap-2">
              <XCircle size={14} className="text-rose-500 shrink-0 mt-0.5" strokeWidth={3} />
              <div>
                <p className="text-[9px] font-black uppercase text-rose-400 leading-none mb-1">Motivo del rechazo:</p>
                <p className="text-xs font-bold text-rose-800 italic">"{cita.rechazo_mensaje}"</p>
              </div>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex shrink-0 gap-2">
          {isRejected ? (
            <button
              onClick={() => onQuickRebook && onQuickRebook(cita.mascota, cita.servicio_id)}
              className="bg-rose-500 text-white border-[3px] border-black px-4 py-3 rounded-2xl font-black text-[10px] uppercase shadow-[3px_3px_0px_0px_black] hover:bg-rose-600 active:translate-y-0.5 active:shadow-none transition-all flex flex-col items-center gap-1.5 cursor-pointer"
            >
              <CalendarPlus size={20} strokeWidth={2.5} />
              Re-agendar
            </button>
          ) : cita.estado === 'agendada' || cita.estado === 'programada' ? (
            isCancelable ? (
              <button
                disabled={saving}
                onClick={() => onCancelAppointment(cita.id)}
                className="bg-rose-100 text-rose-600 border-[3px] border-black px-4 py-3 rounded-2xl font-black text-[10px] uppercase shadow-[3px_3px_0px_0px_black] hover:bg-rose-500 hover:text-white transition-all active:translate-y-0.5 active:shadow-none flex flex-col items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 size={20} strokeWidth={2.5} />
                Cancelar
              </button>
            ) : (
              <div className="bg-black text-white p-3 rounded-2xl shadow-[3px_3px_0px_0px_#25D366] flex flex-col justify-center gap-2 relative overflow-hidden min-w-[100px]">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-[repeating-linear-gradient(45deg,#000_0px,#000_6px,#fef08a_6px,#fef08a_12px)]" />
                <span className="text-[8px] font-black uppercase text-amber-400 flex items-center gap-1 mt-1.5">
                  <AlertTriangle size={12} strokeWidth={3} /> &lt;4hrs
                </span>
                <a
                  href="https://wa.me/59170000000"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-[#25D366] text-black border-2 border-[#25D366] py-2 rounded-xl font-black text-[9px] uppercase hover:brightness-110 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <MessageCircle size={14} strokeWidth={3} /> Avisar
                </a>
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
};

// ─── Sección con título ─────────────────────────────────────────────────────────
const Section = ({ icon: Icon, title, count, accentClass, children }) => (
  <div className="space-y-4">
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border-[3px] border-black shadow-[3px_3px_0px_0px_black] ${accentClass}`}>
      <Icon size={18} strokeWidth={3} />
      <span className="font-black uppercase text-xs tracking-wider">{title}</span>
      <span className="ml-auto bg-black text-white text-[9px] font-black px-2.5 py-1 rounded-full">{count}</span>
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

// ─── Componente principal ───────────────────────────────────────────────────────
const DashboardUpcomingAppointments = ({
  appointments = [],
  onCancelAppointment,
  onStartNewBooking,
  onQuickRebook,
  saving,
}) => {
  const now = new Date();

  const pending  = appointments.filter(a => a.estado === 'programada' && new Date(a.fecha_hora_inicio) >= now);
  const confirmed = appointments.filter(a => a.estado === 'agendada' && new Date(a.fecha_hora_inicio) >= now);
  const rejected = appointments.filter(a => a.estado === 'cancelada' && a.rechazo_mensaje);
  const past = appointments.filter(a => 
    (a.estado === 'finalizada' || (a.estado === 'cancelada' && !a.rechazo_mensaje)) ||
    (new Date(a.fecha_hora_inicio) < now && a.estado !== 'programada' && a.estado !== 'agendada')
  );

  const hasAny = pending.length || confirmed.length || rejected.length;

  if (!hasAny) {
    return (
      <div className="bg-amber-100 border-[4px] border-black p-8 rounded-[2rem] shadow-[6px_6px_0px_0px_black] flex flex-col items-center text-center">
        <div className="bg-white p-4 rounded-full border-[3px] border-black shadow-inner mb-4">
          <Calendar size={48} className="text-amber-500" />
        </div>
        <h3 className="text-2xl font-black italic uppercase mb-2">¡Sin Citas Pendientes!</h3>
        <p className="text-xs font-black text-slate-600 uppercase tracking-widest mb-6">
          Tus peludos extrañan el spa.
        </p>
        <button
          onClick={onStartNewBooking}
          className="bg-black text-white px-8 py-4 rounded-xl border-[3px] border-black font-black uppercase text-sm shadow-[4px_4px_0px_0px_var(--secondary)] hover:-translate-y-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer"
        >
          Agendar Ahora
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* En Espera */}
      {pending.length > 0 && (
        <Section icon={Hourglass} title="En Espera de Confirmación" count={pending.length} accentClass="bg-amber-100 text-amber-900">
          {pending.map(cita => (
            <CitaCard key={cita.id} cita={cita} onCancelAppointment={onCancelAppointment} saving={saving} onQuickRebook={onQuickRebook} />
          ))}
        </Section>
      )}

      {/* Confirmadas */}
      {confirmed.length > 0 && (
        <Section icon={CheckCircle2} title="Citas Confirmadas" count={confirmed.length} accentClass="bg-emerald-100 text-emerald-900">
          {confirmed.map(cita => (
            <CitaCard key={cita.id} cita={cita} onCancelAppointment={onCancelAppointment} saving={saving} onQuickRebook={onQuickRebook} />
          ))}
        </Section>
      )}

      {/* Rechazadas */}
      {rejected.length > 0 && (
        <Section icon={XCircle} title="Solicitudes Rechazadas" count={rejected.length} accentClass="bg-rose-100 text-rose-900">
          {rejected.map(cita => (
            <CitaCard key={cita.id} cita={cita} onCancelAppointment={onCancelAppointment} saving={saving} onQuickRebook={onQuickRebook} />
          ))}
        </Section>
      )}

      {/* Historial reciente */}
      {past.length > 0 && (
        <details className="group">
          <summary className="flex items-center gap-2 cursor-pointer text-[10px] font-black uppercase text-slate-400 hover:text-slate-700 transition-colors select-none list-none">
            <ArrowRight size={14} strokeWidth={3} className="group-open:rotate-90 transition-transform" />
            Ver historial ({past.length} cita{past.length !== 1 ? 's' : ''})
          </summary>
          <div className="mt-4 space-y-4">
            {past.slice(0, 5).map(cita => (
              <CitaCard key={cita.id} cita={cita} onCancelAppointment={onCancelAppointment} saving={saving} onQuickRebook={onQuickRebook} />
            ))}
          </div>
        </details>
      )}

      {/* Nueva cita CTA */}
      <button
        onClick={onStartNewBooking}
        className="w-full bg-black text-white py-4 rounded-2xl border-[3px] border-black font-black uppercase text-sm shadow-[4px_4px_0px_0px_var(--secondary)] hover:-translate-y-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-3"
      >
        <CalendarPlus size={20} strokeWidth={2.5} />
        Agendar Nueva Cita
      </button>
    </div>
  );
};

DashboardUpcomingAppointments.propTypes = {
  appointments: PropTypes.array.isRequired,
  onCancelAppointment: PropTypes.func.isRequired,
  onStartNewBooking: PropTypes.func.isRequired,
  onQuickRebook: PropTypes.func,
  saving: PropTypes.bool,
};

export default DashboardUpcomingAppointments;
