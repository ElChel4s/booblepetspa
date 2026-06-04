import React from 'react';
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
const StatusBadge = ({ estado, isRejected }) => {
  const map = {
    programada: { label: 'En Espera', bg: 'bg-amber-400', text: 'text-black', icon: Hourglass },
    en_espera: { label: 'En Espera', bg: 'bg-amber-400', text: 'text-black', icon: Hourglass },
    agendada: { label: 'Confirmada', bg: 'bg-emerald-400', text: 'text-black', icon: CheckCircle2 },
    confirmada: { label: 'Confirmada', bg: 'bg-emerald-400', text: 'text-black', icon: CheckCircle2 },
    en_proceso: { label: 'En Proceso', bg: 'bg-blue-500', text: 'text-white', icon: Sparkles },
    cancelada: { label: 'Cancelada', bg: 'bg-rose-500', text: 'text-white', icon: XCircle },
    rechazada: { label: 'Rechazada', bg: 'bg-rose-500', text: 'text-white', icon: XCircle },
    finalizada: { label: 'Finalizada', bg: 'bg-slate-700', text: 'text-white', icon: CheckCircle2 },
  };
  const cfg = isRejected
    ? { label: 'Rechazada', bg: 'bg-rose-500', text: 'text-white', icon: XCircle }
    : map[estado] || { label: estado, bg: 'bg-slate-300', text: 'text-black', icon: Clock };
  const Icon = cfg.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border-2 border-black shadow-[2px_2px_0px_0px_black] ${cfg.bg} ${cfg.text}`}>
      <Icon size={12} strokeWidth={3} /> {cfg.label}
    </span>
  );
};

// ─── Tarjeta individual de cita ────────────────────────────────────────────────
const CitaCard = ({ cita, onCancelAppointment, saving, onQuickRebook }) => {
  const isCancelable = canCancelAutonomous(cita.fecha_hora_inicio);
  const isRejected = cita.estado === 'rechazada' || (cita.estado === 'cancelada' && cita.rechazo_mensaje);
  const isPending = cita.estado === 'programada' || cita.estado === 'en_espera';
  const isConfirmed = cita.estado === 'agendada' || cita.estado === 'confirmada';

  // Estilos de bordes y sombras dependiendo del estado
  const borderColor = isRejected
    ? 'border-rose-500 shadow-[6px_6px_0px_0px_#f43f5e]'
    : isConfirmed
      ? 'border-emerald-400 shadow-[6px_6px_0px_0px_#34d399]'
      : isPending
        ? 'border-amber-400 shadow-[6px_6px_0px_0px_#fbbf24]'
        : 'border-black shadow-[6px_6px_0px_0px_black]';

  return (
    <div className={`bg-white border-[4px] ${borderColor} rounded-[2rem] overflow-hidden transition-all hover:-translate-y-1 mb-4 relative`}>
      {/* Franja de estado superior para dar más fuerza visual */}
      <div className={`h-2 w-full border-b-[3px] border-black ${isRejected ? 'bg-rose-500' :
          isConfirmed ? 'bg-emerald-400' :
            isPending ? 'bg-amber-400' : 'bg-slate-300'
        }`} />

      <div className="p-5 flex flex-col sm:flex-row sm:items-start gap-5">
        {/* Foto Mascota */}
        <div className="shrink-0 relative">
          <img
            src={
              cita.mascota?.foto_perfil_url ||
              `https://api.dicebear.com/7.x/bottts/svg?seed=${cita.mascota?.nombre || 'Pet'}&backgroundColor=fbbf24`
            }
            alt={cita.mascota?.nombre || 'Pet'}
            className="w-20 h-20 bg-yellow-100 border-[3px] border-black rounded-[1.2rem] shadow-[4px_4px_0px_0px_black] object-cover"
          />
        </div>

        {/* Info Cita */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h3 className="text-2xl font-black uppercase italic leading-none text-slate-900">
              {cita.mascota?.nombre}
            </h3>
            <StatusBadge estado={cita.estado} isRejected={isRejected} />
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-[10px] font-black text-white bg-blue-500 px-2.5 py-1 rounded-lg border-2 border-black uppercase tracking-widest shadow-sm">
              {cita.servicio?.nombre || 'Grooming'}
            </span>
            <span className="text-[10px] font-black text-slate-600 flex items-center gap-1 uppercase bg-slate-100 px-2 py-1 rounded-lg border-2 border-black/10">
              <User size={12} strokeWidth={3} /> {cita.groomer?.nombre_completo || 'Por asignar'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-black text-slate-800 bg-slate-50 px-3 py-2 rounded-xl border-[3px] border-black w-max uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)]">
            <CalendarDays size={16} className="text-blue-500" strokeWidth={3} />
            {formatDate(cita.fecha_hora_inicio)}
          </div>

          {/* Mensaje de rechazo inline destacado */}
          {isRejected && cita.rechazo_mensaje && (
            <div className="mt-4 bg-rose-100 border-[3px] border-rose-500 rounded-xl p-3 flex gap-3 shadow-inner">
              <XCircle size={20} className="text-rose-600 shrink-0 mt-0.5" strokeWidth={3} />
              <div>
                <p className="text-[9px] font-black uppercase text-rose-500 tracking-widest leading-none mb-1">Motivo del rechazo:</p>
                <p className="text-sm font-bold text-rose-900 italic">"{cita.rechazo_mensaje}"</p>
              </div>
            </div>
          )}
        </div>

        {/* Acciones (Botones a la derecha o abajo) */}
        <div className="flex sm:flex-col shrink-0 gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          {isRejected ? (
            <button
              onClick={() => onQuickRebook && onQuickRebook(cita.mascota, cita.servicio_id)}
              className="w-full sm:w-auto bg-rose-500 text-white border-[3px] border-black px-4 py-3 rounded-2xl font-black text-[10px] uppercase shadow-[4px_4px_0px_0px_black] hover:bg-rose-600 active:translate-y-1 active:shadow-none transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer"
            >
              <CalendarPlus size={20} strokeWidth={3} />
              Re-agendar
            </button>
          ) : isConfirmed || isPending ? (
            isCancelable ? (
              <button
                disabled={saving}
                onClick={() => onCancelAppointment(cita.id)}
                className="w-full sm:w-auto bg-white text-rose-600 border-[3px] border-black px-4 py-3 rounded-2xl font-black text-[10px] uppercase shadow-[4px_4px_0px_0px_black] hover:bg-rose-500 hover:text-white transition-all active:translate-y-1 active:shadow-none flex flex-col items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 size={20} strokeWidth={3} />
                Cancelar
              </button>
            ) : (
              <div className="w-full sm:w-auto bg-black text-white p-3 rounded-2xl shadow-[4px_4px_0px_0px_#25D366] flex flex-col justify-center gap-2 relative overflow-hidden min-w-[110px]">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-[repeating-linear-gradient(45deg,#000_0px,#000_6px,#fef08a_6px,#fef08a_12px)]" />
                <span className="text-[9px] font-black uppercase text-amber-400 flex items-center justify-center gap-1 mt-1.5">
                  <AlertTriangle size={14} strokeWidth={3} /> Menos de 4 hrs
                </span>
                <a
                  href="https://wa.me/59170000000"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-[#25D366] text-black border-[3px] border-[#25D366] py-2 rounded-xl font-black text-[10px] uppercase hover:brightness-110 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <MessageCircle size={16} strokeWidth={3} /> Avisar
                </a>
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
};

// ─── Sección para agrupar estados ───────────────────────────────────────────────
const Section = ({ icon: Icon, title, count, accentClass, children }) => (
  <div className="space-y-4 animate-in fade-in duration-500">
    <div className={`flex items-center gap-3 px-5 py-3 rounded-[1.5rem] border-[4px] border-black shadow-[4px_4px_0px_0px_black] ${accentClass}`}>
      <div className="bg-white p-1.5 rounded-full border-2 border-black">
        <Icon size={20} strokeWidth={3} />
      </div>
      <span className="font-black uppercase text-sm md:text-base tracking-wider">{title}</span>
      <span className="ml-auto bg-black text-white text-xs font-black px-3 py-1 rounded-full border-2 border-black">{count}</span>
    </div>
    <div className="space-y-2">{children}</div>
  </div>
);

// ─── COMPONENTE PRINCIPAL QUE SOLICITASTE ───────────────────────────────────────
const DashboardUpcomingAppointments = ({
  appointments = [],
  onCancelAppointment,
  onStartNewBooking,
  onQuickRebook,
  saving,
}) => {
  const now = new Date();

  // Filtrado de estados basados en tu código
  const pending = appointments.filter(
    (a) => ['programada', 'en_espera'].includes(a.estado) && new Date(a.fecha_hora_inicio) >= now
  );
  const confirmed = appointments.filter(
    (a) => ['agendada', 'confirmada'].includes(a.estado) && new Date(a.fecha_hora_inicio) >= now
  );
  const rejected = appointments.filter(
    (a) => a.estado === 'rechazada' || (a.estado === 'cancelada' && a.rechazo_mensaje)
  );
  const past = appointments.filter(a =>
    (a.estado === 'finalizada' || (a.estado === 'cancelada' && !a.rechazo_mensaje)) ||
    (new Date(a.fecha_hora_inicio) < now && !['programada', 'en_espera', 'agendada', 'confirmada'].includes(a.estado))
  );

  const hasAny = pending.length || confirmed.length || rejected.length;

  if (!hasAny) {
    return (
      <div className="bg-amber-100 border-[6px] border-black p-8 md:p-12 rounded-[3rem] shadow-[8px_8px_0px_0px_black] flex flex-col items-center text-center animate-in zoom-in-95">
        <div className="bg-white p-6 rounded-full border-[4px] border-black shadow-inner mb-6 transform rotate-6">
          <Calendar size={64} className="text-amber-500" strokeWidth={2} />
        </div>
        <h3 className="text-3xl font-black italic uppercase mb-3">¡Sin Citas Activas!</h3>
        <p className="text-sm font-black text-slate-600 uppercase tracking-widest mb-8">
          Es un buen momento para consentir a tus peludos.
        </p>
        <button
          onClick={onStartNewBooking}
          className="w-full sm:w-auto bg-black text-white px-10 py-5 rounded-[2rem] border-[4px] border-black font-black uppercase text-base shadow-[6px_6px_0px_0px_#34d399] hover:-translate-y-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-3"
        >
          <CalendarPlus size={24} strokeWidth={3} />
          Agendar Ahora
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10 w-full max-w-4xl mx-auto">
      {/* 1. Solicitudes Rechazadas (Arriba para prioridad de atención) */}
      {rejected.length > 0 && (
        <Section icon={XCircle} title="Solicitudes Rechazadas" count={rejected.length} accentClass="bg-rose-100 text-rose-900">
          {rejected.map(cita => (
            <CitaCard key={cita.id} cita={cita} onCancelAppointment={onCancelAppointment} saving={saving} onQuickRebook={onQuickRebook} />
          ))}
        </Section>
      )}

      {/* 2. Citas Confirmadas */}
      {confirmed.length > 0 && (
        <Section icon={CheckCircle2} title="Citas Confirmadas" count={confirmed.length} accentClass="bg-emerald-100 text-emerald-900">
          {confirmed.map(cita => (
            <CitaCard key={cita.id} cita={cita} onCancelAppointment={onCancelAppointment} saving={saving} onQuickRebook={onQuickRebook} />
          ))}
        </Section>
      )}

      {/* 3. En Espera de Confirmación (Admin aún no la revisa) */}
      {pending.length > 0 && (
        <Section icon={Hourglass} title="En Espera de Confirmación" count={pending.length} accentClass="bg-amber-100 text-amber-900">
          {pending.map(cita => (
            <CitaCard key={cita.id} cita={cita} onCancelAppointment={onCancelAppointment} saving={saving} onQuickRebook={onQuickRebook} />
          ))}
        </Section>
      )}

      {/* 4. Historial pasado */}
      {past.length > 0 && (
        <details className="group bg-slate-50 border-[4px] border-black rounded-[2rem] p-5 shadow-[4px_4px_0px_0px_black] open:shadow-[8px_8px_0px_0px_black] transition-all">
          <summary className="flex items-center gap-3 cursor-pointer text-sm font-black uppercase text-slate-600 hover:text-black transition-colors select-none list-none outline-none">
            <div className="bg-white p-2 rounded-full border-2 border-black group-open:bg-black group-open:text-white transition-colors">
              <ArrowRight size={18} strokeWidth={3} className="group-open:rotate-90 transition-transform" />
            </div>
            Historial de Visitas Pasadas ({past.length})
          </summary>
          <div className="mt-6 space-y-4 pt-4 border-t-[3px] border-dashed border-black/20">
            {past.slice(0, 5).map(cita => (
              <CitaCard key={cita.id} cita={cita} onCancelAppointment={onCancelAppointment} saving={saving} onQuickRebook={onQuickRebook} />
            ))}
            {past.length > 5 && (
              <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400 mt-4">
                Mostrando las últimas 5 citas
              </p>
            )}
          </div>
        </details>
      )}

      {/* Nueva cita CTA Fijo al final */}
      <div className="pt-4">
        <button
          onClick={onStartNewBooking}
          className="w-full bg-black text-white py-5 rounded-[2rem] border-[4px] border-black font-black uppercase text-base shadow-[8px_8px_0px_0px_#fbbf24] hover:-translate-y-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-3"
        >
          <CalendarPlus size={24} strokeWidth={3} />
          Agendar Nueva Cita
        </button>
      </div>
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