import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Timer, AlertTriangle } from 'lucide-react';
import { useToast } from '../../../store/ToastContext';

import { groupAppointmentsByGroomer, getWeekdayNumber } from '../services/agendaService';
import { sendProposalAlternative } from '../services/receptionAgendaService';
import ReceptionTabs from '../components/reception/ReceptionTabs';
import ReceptionCalendar from '../components/reception/ReceptionCalendar';
import ReceptionQuickBookModal from '../components/reception/ReceptionQuickBookModal';
import ReceptionValidationInbox from '../components/reception/ReceptionValidationInbox';
import ReceptionDailyControl from '../components/reception/ReceptionDailyControl';

const toMinutes = (timeValue) => {
  if (!timeValue) return 0;
  const [hours, minutes] = String(timeValue).split(':').map(Number);
  return hours * 60 + (minutes || 0);
};

const ReceptionAgendaView = ({
  activeTab,
  onChangeTab,
  agendaData,
  loading,
  error,
  selectedDate,
  setSelectedDate,
  onRefresh,
}) => {
  const [isQuickBookOpen, setIsQuickBookOpen] = useState(false);
  const [quickBookGroomerId, setQuickBookGroomerId] = useState('');
  const [quickBookStartTime, setQuickBookStartTime] = useState('09:00');
  const [actionKey, setActionKey] = useState(null);
  const { showToast } = useToast();

  const services = agendaData?.services || [];
  const groomers = agendaData?.groomers || [];
  const modifiers = agendaData?.modifiers || [];
  const appointments = agendaData?.appointments || [];
  const reservations = agendaData?.reservations || [];
  const schedules = agendaData?.schedules || [];
  const exceptions = agendaData?.exceptions || [];

  const appointmentsByGroomer = useMemo(() => {
    return groupAppointmentsByGroomer(appointments, groomers, services);
  }, [appointments, groomers, services]);

  const appointmentsByReservation = useMemo(() => {
    return appointments.reduce((accumulator, appointment) => {
      if (!appointment.reserva_id) return accumulator;
      if (!accumulator[appointment.reserva_id]) accumulator[appointment.reserva_id] = [];
      accumulator[appointment.reserva_id].push(appointment);
      return accumulator;
    }, {});
  }, [appointments]);

  const selectedDateObj = useMemo(() => new Date(`${selectedDate}T00:00:00`), [selectedDate]);
  const selectedWeekday = useMemo(() => getWeekdayNumber(selectedDate), [selectedDate]);

  const runAction = async (key, runner, successMessage) => {
    setActionKey(key);
    const result = await runner();
    if (result?.error) {
      showToast(result.error.message || 'No se pudo completar la acción', 'error');
    } else {
      showToast(successMessage, 'success');
      await onRefresh();
    }
    setActionKey(null);
    return result;
  };

  const handleSendProposal = async (appointmentId, suggestedGroomerId, message) => {
    return runAction(
      `proposal-${appointmentId}`,
      () => sendProposalAlternative(appointmentId, suggestedGroomerId, message),
      'Propuesta de alternativa enviada al cliente'
    );
  };

  const handleOpenQuickBook = (groomerId, defaultTime = '09:00') => {
    setQuickBookGroomerId(groomerId);
    setQuickBookStartTime(defaultTime);
    setIsQuickBookOpen(true);
  };

  const reservationCards = useMemo(() => {
    const serviceById = new Map(services.map(s => [s.id, s]));
    const groomerById = new Map(groomers.map(g => [g.id, g]));

    return reservations.map((reservation) => {
      // Use pre-fetched linked_citas (includes mascota/servicio/groomer joins)
      // Falls back to appointmentsByReservation for daily-view citas
      const rawLinked = reservation.linked_citas?.length
        ? reservation.linked_citas
        : (appointmentsByReservation[reservation.id] || []);

      const linked = rawLinked.map(appt => ({
        ...appt,
        mascota: appt.mascota || null,
        servicio: appt.servicio || serviceById.get(appt.servicio_id) || null,
        groomer: appt.groomer || groomerById.get(appt.groomer_id) || null,
        groomer_nombre: appt.groomer?.nombre_completo || groomerById.get(appt.groomer_id)?.nombre_completo || null,
      }));
      
      let conflict = false;
      let conflictDetails = null;

      // Only compute conflict for pending reservations
      if (reservation.estado_general === 'pendiente') {
        for (const appointment of linked) {
          if (!appointment.groomer_id) {
            // No groomer assigned — flag as "any available" (not a hard conflict for now)
            // We skip this to avoid false positives when client chose "any groomer"
            continue;
          }

          // ✔ FIX: Use the appointment's OWN date to get the weekday
          // Using fecha_hora_inicio (full ISO timestamp) avoids the UTC midnight timezone shift
          // that happens when parsing a date-only string like "2026-05-29"
          const apptDate = new Date(appointment.fecha_hora_inicio);
          const appointmentWeekday = apptDate.getDay() === 0 ? 0 : apptDate.getDay();

          const relevantSchedules = schedules.filter(
            (schedule) => schedule.groomer_id === appointment.groomer_id && Number(schedule.dia_semana) === appointmentWeekday
          );

          if (!relevantSchedules.length) {
            conflict = true;
            conflictDetails = { type: 'no_schedule' };
            break;
          }

          const scheduleEnd = Math.max(...relevantSchedules.map((schedule) => toMinutes(schedule.hora_fin)));
          
          // ✔ FIX: Use the appointment end date's LOCAL time (not UTC)
          // fecha_hora_fin is stored as UTC in Supabase but getHours()/getMinutes()
          // return LOCAL time values, which is what we want for comparison with schedule strings
          const appointmentEndDate = new Date(appointment.fecha_hora_fin);
          const appointmentEnd = appointmentEndDate.getHours() * 60 + appointmentEndDate.getMinutes();

          if (appointmentEnd > scheduleEnd) {
            conflict = true;
            
            const sHours = Math.floor(scheduleEnd / 60).toString().padStart(2, '0');
            const sMins = (scheduleEnd % 60).toString().padStart(2, '0');
            
            const aHours = Math.floor(appointmentEnd / 60).toString().padStart(2, '0');
            const aMins = (appointmentEnd % 60).toString().padStart(2, '0');

            conflictDetails = {
              type: 'time_exceeded',
              scheduleEndTime: `${sHours}:${sMins}`,
              appointmentEndTime: `${aHours}:${aMins}`
            };
            break;
          }
        }
      }

      return { reservation, linked, conflict, conflictDetails };
    });
  }, [appointmentsByReservation, reservations, schedules, services, groomers]);

  return (
    <div className="flex flex-col space-y-6">
      <ReceptionTabs activeTab={activeTab} onChangeTab={onChangeTab} badgeCount={reservations.filter(r => r.estado_general === 'pendiente').length} />

      {error && (
        <div className="bg-amber-50 border-[3px] border-black rounded-2xl px-4 py-3 font-black uppercase text-[10px] tracking-widest shadow-[4px_4px_0px_0px_black] flex items-center gap-2">
          <AlertTriangle size={16} /> No se pudo cargar todo desde la BD.
        </div>
      )}



      {activeTab === 'calendario' && (
        <ReceptionCalendar
          selectedDate={selectedDate}
          selectedDateObj={selectedDateObj}
          setSelectedDate={setSelectedDate}
          groomers={groomers}
          selectedWeekday={selectedWeekday}
          appointmentsByGroomer={appointmentsByGroomer}
          schedules={schedules}
          exceptions={exceptions}
          actionKey={actionKey}
          runAction={runAction}
          onOpenQuickBook={handleOpenQuickBook}
        />
      )}

      {activeTab === 'validacion' && (
        <ReceptionValidationInbox
          reservationCards={reservationCards}
          selectedDate={selectedDate}
          actionKey={actionKey}
          runAction={runAction}
          groomers={groomers}
          onSendProposal={handleSendProposal}
        />
      )}

      {activeTab === 'panel' && <ReceptionDailyControl />}

      {loading && (
        <div className="text-xs font-black uppercase text-slate-400 flex items-center gap-2">
          <Timer size={12} /> Actualizando datos...
        </div>
      )}

      <ReceptionQuickBookModal
        isOpen={isQuickBookOpen}
        onClose={() => setIsQuickBookOpen(false)}
        defaultGroomerId={quickBookGroomerId}
        defaultStartTime={quickBookStartTime}
        services={services}
        groomers={groomers}
        modifiers={modifiers}
        selectedDate={selectedDate}
        onRefresh={onRefresh}
      />
    </div>
  );
};

ReceptionAgendaView.propTypes = {
  activeTab: PropTypes.string.isRequired,
  onChangeTab: PropTypes.func.isRequired,
  agendaData: PropTypes.shape({
    services: PropTypes.array,
    modifiers: PropTypes.array,
    groomers: PropTypes.array,
    schedules: PropTypes.array,
    appointments: PropTypes.array,
    reservations: PropTypes.array,
    exceptions: PropTypes.array,
  }),
  loading: PropTypes.bool,
  error: PropTypes.any,
  selectedDate: PropTypes.string.isRequired,
  setSelectedDate: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
};

export default ReceptionAgendaView;