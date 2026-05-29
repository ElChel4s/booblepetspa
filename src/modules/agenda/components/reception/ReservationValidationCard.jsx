import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ShieldAlert, AlertTriangle, Check, User, ArrowRight, MessageSquare, Clipboard } from 'lucide-react';
import { updateReservationStatus } from '../../services/receptionAgendaService';

export default function ReservationValidationCard({
  reservation,
  linked,
  conflict,
  conflictDetails,
  groomers,
  actionKey,
  runAction,
  onSendProposal,
  selectedDate
}) {
  const [isProposalOpen, setIsProposalOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [suggestedGroomerId, setSuggestedGroomerId] = useState('');
  const [suggestedDate, setSuggestedDate] = useState('');
  const [suggestedTime, setSuggestedTime] = useState('');
  const [proposalMessage, setProposalMessage] = useState('');
  const [rejectionMessage, setRejectionMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Obtener info del primer turno vinculado
  const activeAppointment = linked[0];
  const currentGroomerId = activeAppointment?.groomer_id;
  const currentGroomerName = activeAppointment?.groomer?.nombre_completo || 'Sin groomer';
  const proposalStatus = activeAppointment?.estado_propuesta || 'ninguna';
  const proposalGroomer = groomers.find(g => g.id === activeAppointment?.sugerencia_groomer_id);

  // Filtrar groomers disponibles para proponer (excluir al groomer actual)
  const alternateGroomers = groomers.filter(g => g.id !== currentGroomerId && g.activo);

  const handleSendProposal = async () => {
    if (!activeAppointment?.id) return;
    if (!suggestedGroomerId && !suggestedDate && !suggestedTime) {
      alert('Por favor selecciona al menos un cambio (Groomer, Fecha u Hora).');
      return;
    }
    setSending(true);
    try {
      await onSendProposal(activeAppointment.id, suggestedGroomerId, suggestedDate, suggestedTime, proposalMessage);
      setIsProposalOpen(false);
      setProposalMessage('');
      setSuggestedDate('');
      setSuggestedTime('');
    } finally {
      setSending(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionMessage.trim()) {
      alert('Por favor ingresa un motivo para el rechazo.');
      return;
    }
    setSending(true);
    try {
      await runAction(
        `reservation-${reservation.id}`,
        () => updateReservationStatus(reservation.id, 'cancelada', rejectionMessage),
        'Reserva rechazada y notificada al cliente'
      );
      setIsRejectOpen(false);
    } finally {
      setSending(false);
    }
  };

  const clientName = reservation.cliente?.nombre_completo || reservation.nombre_invitado || 'Cliente';
  const clientPhone = reservation.cliente?.telefono || reservation.telefono_invitado || 'Sin teléfono';

  // Rich data from the first linked cita
  const firstCita = linked[0];
  const petName = firstCita?.mascota?.nombre || 'Mascota';
  const petPhoto = firstCita?.mascota?.foto_perfil_url || null;
  const groomerDisplayName = firstCita?.groomer?.nombre_completo || firstCita?.groomer_nombre || null;
  const appointmentDateStr = firstCita?.fecha_hora_inicio
    ? new Date(firstCita.fecha_hora_inicio).toLocaleDateString('es-ES', {
        weekday: 'short', day: 'numeric', month: 'short',
        hour: '2-digit', minute: '2-digit'
      })
    : selectedDate;
  const appointmentEndStr = firstCita?.fecha_hora_fin
    ? new Date(firstCita.fecha_hora_fin).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div
      className={`border-[4px] p-6 rounded-[2.5rem] shadow-[6px_6px_0px_0px_black] flex flex-col gap-6 relative ${
        conflict ? 'bg-rose-50 border-rose-500 shadow-[6px_6px_0px_0px_#f43f5e]' : 'bg-white border-black'
      }`}
    >
      {/* Icono de conflicto o aprobado */}
      <div
        className={`absolute -top-3 -right-3 ${
          conflict ? 'bg-rose-500 text-white' : 'bg-emerald-400 text-black'
        } border-2 border-black w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-sm`}
      >
        {conflict ? <AlertTriangle size={16} /> : <Check size={16} />}
      </div>

      <div className="flex flex-col md:flex-row gap-6 w-full">
        {/* Info de la reserva */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex items-center gap-3">
              {/* Pet avatar */}
              {petPhoto ? (
                <img src={petPhoto} alt={petName}
                  className="w-12 h-12 rounded-2xl border-2 border-black object-cover shadow-[2px_2px_0px_0px_black] shrink-0"
                />
              ) : (
                <div className={`w-12 h-12 shrink-0 border-2 border-black rounded-2xl flex items-center justify-center text-2xl ${
                  conflict ? 'bg-rose-100' : 'bg-slate-100'
                }`}>
                  🐾
                </div>
              )}
              <div>
                <h3 className={`text-2xl font-black uppercase italic truncate ${conflict ? 'text-rose-900' : 'text-slate-900'}`}>
                  {clientName}
                </h3>
                <p className={`text-[10px] font-bold mt-0.5 ${conflict ? 'text-rose-700' : 'text-slate-500'}`}>
                  {petName && <span className="mr-2">🐾 {petName}</span>}
                  {clientPhone !== 'Sin teléfono' && <span>📞 {clientPhone}</span>}
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right shrink-0">
              <span className={`block text-[9px] font-black uppercase tracking-wider ${conflict ? 'text-rose-400' : 'text-slate-400'}`}>
                Solicitado para:
              </span>
              <span className={`font-black text-sm md:text-base ${conflict ? 'text-rose-600' : 'text-indigo-600'}`}>
                {appointmentDateStr}
              </span>
              {appointmentEndStr && (
                <p className={`text-[9px] font-bold ${conflict ? 'text-rose-400' : 'text-slate-400'}`}>
                  hasta las {appointmentEndStr}
                </p>
              )}
              <p className={`text-[10px] font-black uppercase ${conflict ? 'text-rose-500' : 'text-slate-500'} mt-0.5`}>
                Groomer: {groomerDisplayName || <span className="italic text-amber-600">Cualquier disponible</span>}
              </p>
            </div>
          </div>

          {/* Lista de servicios y alertas */}
          <div
            className={`mt-4 p-4 rounded-2xl border-2 ${
              conflict ? 'bg-white border-rose-200' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex gap-2 flex-wrap mb-2">
              {linked.map((appointment) => (
                <span key={appointment.id} className="bg-slate-200 border border-black/10 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide">
                  {appointment.servicio?.nombre || 'Servicio'}
                </span>
              ))}
            </div>

            {conflict && (
              <div className="flex items-start gap-2 mt-2 pt-2 border-t border-rose-100 text-rose-600">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                <div className="text-[10px] font-black uppercase leading-tight flex flex-col gap-1">
                  <p>Alerta de conflicto: excede horario de salida del groomer.</p>
                  {conflictDetails?.type === 'time_exceeded' && (
                    <p className="text-rose-500 font-bold">
                      Servicio termina a las: <span className="font-black underline">{conflictDetails.appointmentEndTime}</span> <br/>
                      Groomer sale a las: <span className="font-black underline">{conflictDetails.scheduleEndTime}</span>
                    </p>
                  )}
                  {conflictDetails?.type === 'no_schedule' && (
                    <p className="text-rose-500 font-bold">
                      El groomer no tiene horario configurado para este día.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Badges de estado de propuesta */}
            {proposalStatus === 'pendiente' && (
              <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-dashed border-black/10 text-amber-600">
                <div className="flex items-start gap-1.5">
                  <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                  <p className="text-[10px] font-black uppercase leading-tight">
                    Propuesta Pendiente de respuesta del cliente:
                  </p>
                </div>
                <div className="text-[10px] font-bold text-slate-600 pl-5 uppercase">
                  Sugerido: <span className="text-black font-black">{proposalGroomer?.nombre_completo || 'Estilista'}</span>
                  {activeAppointment.propuesta_mensaje && (
                    <p className="italic mt-1">"{activeAppointment.propuesta_mensaje}"</p>
                  )}
                </div>
              </div>
            )}

            {proposalStatus === 'aceptada' && (
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-dashed border-black/10 text-emerald-600 font-black text-[10px] uppercase">
                <Check size={14} strokeWidth={3} /> Propuesta Aceptada por el cliente. Confirmando agenda.
              </div>
            )}

            {proposalStatus === 'rechazada' && (
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-dashed border-black/10 text-rose-500 font-black text-[10px] uppercase">
                <AlertTriangle size={14} strokeWidth={3} /> Propuesta Rechazada por el cliente. Turno cancelado para reprogramar.
              </div>
            )}
          </div>

        {/* Formulario desplegable para Proponer Alternativa */}
          {isProposalOpen && (
            <div className="mt-4 p-4 bg-amber-50 border-[2.5px] border-black rounded-2xl space-y-4 shadow-[3px_3px_0px_0px_black] animate-in slide-in-from-top-3">
              <h4 className="font-black uppercase text-[10px] tracking-wider text-slate-700 flex items-center gap-1.5">
                <Clipboard size={14} /> Crear propuesta alternativa para el cliente
              </h4>
              
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Selector de Groomer */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase text-slate-500">Nuevo Groomer (Opcional)</label>
                    <select
                      value={suggestedGroomerId}
                      onChange={(e) => setSuggestedGroomerId(e.target.value)}
                      className="bg-white border-2 border-black rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                    >
                      <option value="">-- Mantener Groomer --</option>
                      {alternateGroomers.map(g => (
                        <option key={g.id} value={g.id}>{g.nombre_completo}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Selector de Fecha y Hora */}
                  <div className="flex gap-2">
                    <div className="flex flex-col gap-1 flex-1">
                      <label className="text-[9px] font-black uppercase text-slate-500">Nueva Fecha (Opcional)</label>
                      <input
                        type="date"
                        value={suggestedDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setSuggestedDate(e.target.value)}
                        className="bg-white border-2 border-black rounded-xl px-3 py-2 text-xs font-bold focus:outline-none w-full"
                      />
                    </div>
                    <div className="flex flex-col gap-1 w-24">
                      <label className="text-[9px] font-black uppercase text-slate-500">Hora (Opc.)</label>
                      <input
                        type="time"
                        value={suggestedTime}
                        onChange={(e) => setSuggestedTime(e.target.value)}
                        className="bg-white border-2 border-black rounded-xl px-2 py-2 text-xs font-bold focus:outline-none w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Mensaje Explicativo */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black uppercase text-slate-500">Mensaje para el cliente</label>
                  <textarea
                    value={proposalMessage}
                    onChange={(e) => setProposalMessage(e.target.value)}
                    rows="2"
                    placeholder="Ej. Te proponemos a Edgar para este horario, o puedes cambiar de día."
                    className="bg-white border-2 border-black rounded-xl p-3 text-xs font-bold focus:outline-none"
                  />
                </div>

                {/* Botón de Enviar */}
                <div className="flex justify-end gap-2.5">
                  <button
                    onClick={() => setIsProposalOpen(false)}
                    className="bg-white px-4 py-2 border-2 border-black rounded-xl text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_black] active:translate-y-0.5 active:shadow-none cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSendProposal}
                    disabled={sending}
                    className="bg-[var(--primary)] text-white px-4 py-2 border-2 border-black rounded-xl text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_black] active:translate-y-0.5 active:shadow-none cursor-pointer disabled:opacity-50"
                  >
                    Enviar Propuesta
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Formulario de Rechazo */}
          {isRejectOpen && (
            <div className="mt-4 p-4 bg-rose-50 border-[2.5px] border-black rounded-2xl space-y-4 shadow-[3px_3px_0px_0px_black] animate-in slide-in-from-top-3">
              <h4 className="font-black uppercase text-[10px] tracking-wider text-rose-700 flex items-center gap-1.5">
                <AlertTriangle size={14} /> Motivo de Rechazo
              </h4>
              <div className="space-y-3">
                <textarea
                  value={rejectionMessage}
                  onChange={(e) => setRejectionMessage(e.target.value)}
                  rows="2"
                  placeholder="Explícale al cliente por qué no podemos atender su cita..."
                  className="bg-white border-2 border-black rounded-xl p-3 text-xs font-bold focus:outline-none w-full"
                />
                <div className="flex justify-end gap-2.5">
                  <button
                    onClick={() => setIsRejectOpen(false)}
                    className="bg-white px-4 py-2 border-2 border-black rounded-xl text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_black] active:translate-y-0.5 active:shadow-none cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={sending}
                    className="bg-rose-500 text-white px-4 py-2 border-2 border-black rounded-xl text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_black] active:translate-y-0.5 active:shadow-none cursor-pointer disabled:opacity-50"
                  >
                    Confirmar Rechazo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Acciones principales de Recepción */}
        <div className="flex flex-col gap-2 w-full md:w-36 shrink-0 justify-center">
          <button
            disabled={actionKey === `reservation-${reservation.id}`}
            onClick={() =>
              runAction(
                `reservation-${reservation.id}`,
                () => updateReservationStatus(reservation.id, 'confirmada'),
                'Reserva confirmada'
              )
            }
            className={`px-4 py-3 rounded-xl border-[3px] font-black text-[10px] uppercase shadow-[3px_3px_0px_0px_black] active:translate-y-0.5 active:shadow-none disabled:opacity-60 cursor-pointer ${
              conflict ? 'bg-white text-rose-600 border-rose-500' : 'bg-emerald-400 text-black border-black'
            }`}
          >
            {conflict ? 'Forzar aceptación' : 'Aprobar'}
          </button>

          {conflict && proposalStatus !== 'pendiente' && !isProposalOpen && (
            <button
              onClick={() => setIsProposalOpen(true)}
              className="bg-yellow-300 text-black px-4 py-3 rounded-xl border-[3px] border-black font-black text-[10px] uppercase shadow-[3px_3px_0px_0px_black] hover:bg-yellow-400 active:translate-y-0.5 active:shadow-none cursor-pointer"
            >
              Proponer Cambio
            </button>
          )}

          <button
            disabled={actionKey === `reservation-${reservation.id}` || isRejectOpen}
            onClick={() => setIsRejectOpen(true)}
            className="bg-rose-500 text-white px-4 py-3 rounded-xl border-[3px] border-black font-black text-[10px] uppercase shadow-[3px_3px_0px_0px_black] hover:bg-rose-600 active:translate-y-0.5 active:shadow-none disabled:opacity-60 cursor-pointer"
          >
            Rechazar
          </button>
        </div>
      </div>
    </div>
  );
}

ReservationValidationCard.propTypes = {
  reservation: PropTypes.object.isRequired,
  linked: PropTypes.array.isRequired,
  conflict: PropTypes.bool.isRequired,
  conflictDetails: PropTypes.object,
  groomers: PropTypes.array.isRequired,
  actionKey: PropTypes.string,
  runAction: PropTypes.func.isRequired,
  onSendProposal: PropTypes.func.isRequired,
  selectedDate: PropTypes.string.isRequired
};
