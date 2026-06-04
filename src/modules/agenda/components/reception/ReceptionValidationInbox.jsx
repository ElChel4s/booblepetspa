import PropTypes from 'prop-types';
import { Shield, CheckCircle2, XCircle, Clock } from 'lucide-react';
import ReservationValidationCard from './ReservationValidationCard';

const SectionHeader = ({ icon: Icon, title, count, colorClass }) => (
  <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_0px_black] ${colorClass}`}>
    <Icon size={20} strokeWidth={3} />
    <h3 className="font-black uppercase text-sm tracking-wider">{title}</h3>
    <span className="ml-auto bg-black text-white text-xs font-black px-3 py-1 rounded-full">{count}</span>
  </div>
);

SectionHeader.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  colorClass: PropTypes.string.isRequired,
};

const ReceptionValidationInbox = ({
  reservationCards,
  selectedDate,
  actionKey,
  runAction,
  groomers = [],
  onSendProposal
}) => {
  const pending = reservationCards.filter(({ reservation }) => reservation.estado_general === 'pendiente');
  const confirmed = reservationCards.filter(({ reservation }) => reservation.estado_general === 'confirmada');
  const rejected = reservationCards.filter(({ reservation }) => reservation.estado_general === 'cancelada');

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-black text-white p-6 rounded-[2.5rem] flex items-center gap-4 shadow-[8px_8px_0px_0px_var(--secondary)]">
        <div className="bg-[var(--secondary)] text-black p-4 rounded-2xl border-2 border-black">
          <Shield size={24} strokeWidth={3} />
        </div>
        <div>
          <h2 className="text-2xl font-black uppercase italic">Bandeja de validación</h2>
          <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">
            Revisa las solicitudes de reserva web.
          </p>
        </div>
        <div className="ml-auto flex gap-3">
          <div className="text-center">
            <p className="text-2xl font-black text-amber-400">{pending.length}</p>
            <p className="text-[9px] uppercase font-black text-slate-400">Pendientes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-emerald-400">{confirmed.length}</p>
            <p className="text-[9px] uppercase font-black text-slate-400">Aceptadas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-rose-400">{rejected.length}</p>
            <p className="text-[9px] uppercase font-black text-slate-400">Rechazadas</p>
          </div>
        </div>
      </div>

      {reservationCards.length === 0 && (
        <div className="text-sm font-bold text-slate-400 uppercase bg-slate-50 border-[3px] border-slate-200 rounded-2xl p-8 text-center">
          No hay reservas web para esta fecha.
        </div>
      )}

      {/* Pending Section */}
      {pending.length > 0 && (
        <div className="space-y-4">
          <SectionHeader
            icon={Clock}
            title="Solicitudes Pendientes"
            count={pending.length}
            colorClass="bg-amber-100 text-amber-900"
          />
          <div className="space-y-5">
            {pending.map(({ reservation, linked, conflict, conflictDetails }) => (
              <ReservationValidationCard
                key={reservation.id}
                reservation={reservation}
                linked={linked}
                conflict={conflict}
                conflictDetails={conflictDetails}
                groomers={groomers}
                actionKey={actionKey}
                runAction={runAction}
                onSendProposal={onSendProposal}
                selectedDate={selectedDate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Confirmed Section */}
      {confirmed.length > 0 && (
        <div className="space-y-4">
          <SectionHeader
            icon={CheckCircle2}
            title="Solicitudes Aceptadas"
            count={confirmed.length}
            colorClass="bg-emerald-100 text-emerald-900"
          />
          <div className="space-y-4">
            {confirmed.map(({ reservation, linked }) => {
              const clientName = reservation.cliente?.nombre_completo || reservation.nombre_invitado || 'Cliente';
              const petName = linked[0]?.mascota?.nombre || 'Mascota';
              const serviceName = linked[0]?.servicio?.nombre || 'Servicio';
              const groomerName = linked[0]?.groomer?.nombre_completo || linked[0]?.groomer_nombre || 'Estilista';
              const hora = linked[0]?.fecha_hora_inicio
                ? new Date(linked[0].fecha_hora_inicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                : '—';
              return (
                <div key={reservation.id} className="bg-emerald-50 border-[3px] border-black rounded-[2rem] p-5 flex items-center gap-5 shadow-[4px_4px_0px_0px_#10b981]">
                  <div className="w-12 h-12 bg-emerald-400 border-2 border-black rounded-2xl flex items-center justify-center shrink-0 shadow-[3px_3px_0px_0px_black]">
                    <CheckCircle2 size={24} strokeWidth={3} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black uppercase text-sm text-emerald-900">{clientName}</p>
                    <p className="text-[10px] font-bold text-slate-600 uppercase">
                      {petName} · {serviceName} · {groomerName} · {hora}
                    </p>
                  </div>
                  <span className="bg-emerald-400 text-black border-2 border-black px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider shrink-0">
                    Confirmada ✓
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rejected Section */}
      {rejected.length > 0 && (
        <div className="space-y-4">
          <SectionHeader
            icon={XCircle}
            title="Solicitudes Rechazadas"
            count={rejected.length}
            colorClass="bg-rose-100 text-rose-900"
          />
          <div className="space-y-4">
            {rejected.map(({ reservation, linked }) => {
              const clientName = reservation.cliente?.nombre_completo || reservation.nombre_invitado || 'Cliente';
              const petName = linked[0]?.mascota?.nombre || 'Mascota';
              const serviceName = linked[0]?.servicio?.nombre || 'Servicio';
              const rejectionMsg = linked[0]?.rechazo_mensaje;
              return (
                <div key={reservation.id} className="bg-rose-50 border-[3px] border-black rounded-[2rem] p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-[4px_4px_0px_0px_#f43f5e]">
                  <div className="w-12 h-12 bg-rose-500 border-2 border-black rounded-2xl flex items-center justify-center shrink-0 shadow-[3px_3px_0px_0px_black]">
                    <XCircle size={24} strokeWidth={3} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black uppercase text-sm text-rose-900">{clientName}</p>
                    <p className="text-[10px] font-bold text-slate-600 uppercase">{petName} · {serviceName}</p>
                    {rejectionMsg && (
                      <p className="text-[10px] font-bold text-rose-700 italic mt-1 border-l-2 border-rose-400 pl-2">
                        Motivo enviado al cliente: "{rejectionMsg}"
                      </p>
                    )}
                  </div>
                  <span className="bg-rose-500 text-white border-2 border-black px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider shrink-0">
                    Rechazada ✗
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

ReceptionValidationInbox.propTypes = {
  reservationCards: PropTypes.arrayOf(
    PropTypes.shape({
      reservation: PropTypes.object.isRequired,
      linked: PropTypes.array.isRequired,
      conflict: PropTypes.bool.isRequired,
      conflictDetails: PropTypes.object,
    })
  ).isRequired,
  selectedDate: PropTypes.string.isRequired,
  actionKey: PropTypes.string,
  runAction: PropTypes.func.isRequired,
  groomers: PropTypes.array,
  onSendProposal: PropTypes.func.isRequired
};

export default ReceptionValidationInbox;
