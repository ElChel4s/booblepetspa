import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Clock, CalendarDays, ArrowLeft, Sun, Moon, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { getClientGroomerAppointments, getClientGroomerExceptions } from '../../services/clientAgendaService';

// Helpers de tiempo
const jsDayToDbDay = (jsDay) => (jsDay === 0 ? 7 : jsDay);

const timeToMinutes = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

const minutesToTime = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const getISODate = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const day = dateObj.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const checkOverlap = (startMins, endMins, appointments) => {
  for (const app of appointments) {
    const appStart = new Date(app.fecha_hora_inicio);
    const appEnd = new Date(app.fecha_hora_fin);
    
    // Extraer minutos desde inicio del día en zona local
    const aStartMins = appStart.getHours() * 60 + appStart.getMinutes();
    const aEndMins = appEnd.getHours() * 60 + appEnd.getMinutes();

    // Lógica de solapamiento: (StartA < EndB) y (EndA > StartB)
    if (startMins < aEndMins && endMins > aStartMins) {
      return true;
    }
  }
  return false;
};

const WizardStepSchedule = ({
  grandTotalTime,
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime,
  uiStartTime,
  uiEndTime,
  setWizardStep,
  schedules,
  selectedGroomer,
}) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [dayAppointments, setDayAppointments] = useState([]);
  const [dayExceptions, setDayExceptions] = useState([]);
  const [availableSlots, setAvailableSlots] = useState({ morning: [], afternoon: [] });

  // 1. Filtrar horarios según groomer seleccionado (o todos si es "any")
  const relevantSchedules = useMemo(() => {
    if (selectedGroomer === 'any') return schedules;
    return schedules.filter(s => s.groomer_id === selectedGroomer);
  }, [schedules, selectedGroomer]);

  // 2. Comprobar si un día tiene horarios base asignados
  const isDayValid = (dateObj) => {
    const dbDay = jsDayToDbDay(dateObj.getDay());
    return relevantSchedules.some((s) => s.dia_semana === dbDay);
  };

  // 3. Cargar citas cuando se selecciona un día
  useEffect(() => {
    if (!selectedDate) {
      setAvailableSlots({ morning: [], afternoon: [] });
      setDayExceptions([]);
      return;
    }

    const fetchAppointments = async () => {
      setLoadingSlots(true);
      const dateStr = getISODate(selectedDate);
      const [appRes, excRes] = await Promise.all([
        getClientGroomerAppointments(selectedGroomer, dateStr),
        getClientGroomerExceptions(selectedGroomer, dateStr)
      ]);
      
      if (!appRes.error && appRes.data) {
        setDayAppointments(appRes.data);
      } else {
        setDayAppointments([]);
      }

      if (!excRes.error && excRes.data) {
        setDayExceptions(excRes.data);
      } else {
        setDayExceptions([]);
      }
      setLoadingSlots(false);
    };

    fetchAppointments();
  }, [selectedDate, selectedGroomer]);

  // 4. Calcular slots disponibles
  useEffect(() => {
    if (!selectedDate || loadingSlots) return;

    const dbDay = jsDayToDbDay(selectedDate.getDay());
    const daySchedules = relevantSchedules.filter((s) => s.dia_semana === dbDay);
    
    const morningSet = new Set();
    const afternoonSet = new Set();
    
    // La hora actual (para no permitir citas en el pasado el día de hoy)
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    daySchedules.forEach((block) => {
      const blockStartMins = timeToMinutes(block.hora_inicio);
      const blockEndMins = timeToMinutes(block.hora_fin);
      
      // Filtrar citas solo del estilista de este bloque
      const groomerAppointments = dayAppointments.filter(app => app.groomer_id === block.groomer_id);

      // Filtrar excepciones que aplican a este estilista (generales o específicas)
      const groomerExceptions = dayExceptions.filter(
        exc => exc.tipo === 'general' || (exc.tipo === 'staff' && exc.groomer_id === block.groomer_id)
      );

      // Si hay una excepción "todo el día", este bloque se descarta completamente
      if (groomerExceptions.some(exc => exc.todo_el_dia)) {
        return;
      }
      
      let currentSlotMins = blockStartMins;

      while (currentSlotMins + grandTotalTime <= blockEndMins) {
        // Validar si el slot es en el pasado (hoy)
        if (isToday && currentSlotMins <= currentMins + 30) { // Margen de 30 min
          currentSlotMins += 30;
          continue;
        }

        const slotEndMins = currentSlotMins + grandTotalTime;
        const hasOverlap = checkOverlap(currentSlotMins, slotEndMins, groomerAppointments);

        // Validar contra excepciones parciales
        let hasExceptionOverlap = false;
        for (const exc of groomerExceptions) {
          if (!exc.todo_el_dia && exc.hora_inicio && exc.hora_fin) {
            const excStartMins = timeToMinutes(exc.hora_inicio);
            const excEndMins = timeToMinutes(exc.hora_fin);
            if (currentSlotMins < excEndMins && slotEndMins > excStartMins) {
              hasExceptionOverlap = true;
              break;
            }
          }
        }

        if (!hasOverlap && !hasExceptionOverlap) {
          const slotStr = minutesToTime(currentSlotMins);
          if (currentSlotMins < 720) { // 12:00 PM
            morningSet.add(slotStr);
          } else {
            afternoonSet.add(slotStr);
          }
        }
        
        // Incrementar de 30 en 30 minutos
        currentSlotMins += 30;
      }
    });

    const morning = Array.from(morningSet).sort();
    const afternoon = Array.from(afternoonSet).sort();

    setAvailableSlots({ morning, afternoon });

    // Si el horario seleccionado ya no está disponible, deseleccionarlo
    if (selectedTime) {
      if (!morning.includes(selectedTime) && !afternoon.includes(selectedTime)) {
        setSelectedTime(null);
      }
    }
  }, [selectedDate, dayAppointments, dayExceptions, relevantSchedules, grandTotalTime, loadingSlots]);


  return (
    <div className="animate-in slide-in-from-right-8 space-y-6">
      <div className="bg-black border-[3.5px] border-black p-4 rounded-2xl shadow-[6px_6px_0px_0px_var(--secondary)] flex items-center gap-4">
        <div className="bg-[var(--secondary)] p-3 rounded-xl border-[3px] border-black">
          <Clock size={24} className="text-black" strokeWidth={3} />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase text-white/80 tracking-widest mb-0.5">
            Tiempo total requerido
          </p>
          <p className="text-2xl font-black italic text-white leading-none">{grandTotalTime} minutos</p>
        </div>
      </div>

      {/* Calendar View */}
      <div className="bg-white border-[3.5px] border-black rounded-[2rem] p-6 shadow-[6px_6px_0px_0px_black]">
        <div className="flex items-center justify-between mb-6 border-b-[3.5px] border-black/10 pb-4">
          <h3 className="text-[13px] font-black uppercase flex items-center gap-2 text-slate-900 tracking-widest">
            <CalendarDays size={20} strokeWidth={3} className="text-[var(--primary)]" /> 1. Elige el Día
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
              disabled={
                viewDate.getMonth() === new Date().getMonth() &&
                viewDate.getFullYear() === new Date().getFullYear()
              }
              className="p-2 border-[3px] border-black rounded-lg bg-white disabled:opacity-50 hover:bg-slate-100 active:translate-y-1 shadow-[2px_2px_0px_0px_black] transition-all cursor-pointer"
            >
              <ArrowLeft size={16} strokeWidth={3} />
            </button>
            <span className="font-black text-xs uppercase bg-slate-100 px-3 py-1.5 rounded-lg border-[2px] border-black tracking-widest min-w-[120px] text-center">
              {viewDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
              className="p-2 border-[3px] border-black rounded-lg bg-white hover:bg-slate-100 active:translate-y-1 shadow-[2px_2px_0px_0px_black] transition-all cursor-pointer"
            >
              <ArrowLeft size={16} strokeWidth={3} className="rotate-180" />
            </button>
          </div>
        </div>

        {/* Day Grid */}
        <div className="grid grid-cols-7 gap-2 text-center">
          {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map((d) => (
            <div key={d} className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">
              {d}
            </div>
          ))}

          {Array.from({ length: new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay() }).map(
            (_, i) => <div key={`empty-${i}`} />
          )}

          {Array.from({ length: new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate() }).map(
            (_, i) => {
              const dateObj = new Date(viewDate.getFullYear(), viewDate.getMonth(), i + 1);
              const isPast = dateObj < new Date(new Date().setHours(0, 0, 0, 0));
              const hasSchedule = isDayValid(dateObj);
              const isDisabled = isPast || !hasSchedule;
              
              const isSelected = selectedDate && selectedDate.getTime() === dateObj.getTime();
              const isToday = dateObj.toDateString() === new Date().toDateString();

              return (
                <button
                  key={i}
                  disabled={isDisabled}
                  onClick={() => {
                    setSelectedDate(dateObj);
                    setSelectedTime(null);
                  }}
                  className={`aspect-square flex flex-col items-center justify-center rounded-xl border-[3px] transition-all outline-none relative cursor-pointer
                     ${
                       isDisabled
                         ? 'border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed opacity-50'
                         : isSelected
                         ? 'border-black bg-black text-[var(--secondary)] shadow-[4px_4px_0px_0px_var(--primary)] -translate-y-1 scale-105'
                         : 'border-[var(--primary)]/30 bg-emerald-50 hover:bg-[var(--primary)] hover:text-white hover:shadow-[4px_4px_0px_0px_black] text-emerald-900 shadow-[2px_2px_0px_0px_var(--primary)] active:translate-y-1 active:shadow-none'
                     }`}
                >
                  <span className="font-black text-sm sm:text-base">{i + 1}</span>
                  {isToday && !isSelected && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border border-black" />
                  )}
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div className="bg-white border-[3.5px] border-black rounded-[2rem] p-6 shadow-[6px_6px_0px_0px_black] animate-in slide-in-from-top-4">
          <h3 className="text-[13px] font-black uppercase mb-5 flex items-center gap-2 text-slate-900 tracking-widest border-b-[3.5px] border-black/10 pb-4">
            <Clock size={20} strokeWidth={3} className="text-[var(--secondary)] fill-black" /> 2. Horarios
          </h3>

          {loadingSlots ? (
             <div className="flex flex-col items-center justify-center py-8">
               <Loader2 size={32} className="animate-spin text-[var(--primary)] mb-2" />
               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Buscando horarios...</p>
             </div>
          ) : availableSlots.morning.length === 0 && availableSlots.afternoon.length === 0 ? (
            <div className="text-center py-8 border-[3px] border-dashed border-slate-200 rounded-2xl bg-slate-50">
              <p className="text-sm font-black text-slate-500 uppercase tracking-wider mb-1">
                Día Completo
              </p>
              <p className="text-xs text-slate-400 font-bold">
                No hay espacio para {grandTotalTime} minutos este día.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {availableSlots.morning.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Sun size={14} strokeWidth={3} /> Mañana
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {availableSlots.morning.map((t) => {
                      const isSelected = selectedTime === t;
                      return (
                        <button
                          key={t}
                          onClick={() => setSelectedTime(t)}
                          className={`py-3 rounded-xl border-[3px] font-black text-[13px] transition-all outline-none cursor-pointer
                              ${
                                isSelected
                                  ? 'border-black bg-[var(--primary)] text-white shadow-[4px_4px_0px_0px_black] -translate-y-1'
                                  : 'border-black bg-white shadow-[2px_2px_0px_0px_black] hover:bg-slate-50 text-slate-800 active:translate-y-1 active:shadow-none'
                              }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {availableSlots.afternoon.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Moon size={14} strokeWidth={3} /> Tarde
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {availableSlots.afternoon.map((t) => {
                      const isSelected = selectedTime === t;
                      return (
                        <button
                          key={t}
                          onClick={() => setSelectedTime(t)}
                          className={`py-3 rounded-xl border-[3px] font-black text-[13px] transition-all outline-none cursor-pointer
                              ${
                                isSelected
                                  ? 'border-black bg-[var(--primary)] text-white shadow-[4px_4px_0px_0px_black] -translate-y-1'
                                  : 'border-black bg-white shadow-[2px_2px_0px_0px_black] hover:bg-slate-50 text-slate-800 active:translate-y-1 active:shadow-none'
                              }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedTime && (
            <div className="mt-6 bg-emerald-100 border-[3px] border-black p-4 rounded-xl shadow-[4px_4px_0px_0px_black] flex items-start gap-3 animate-in zoom-in-95">
              <CheckCircle2 size={24} className="text-emerald-600 shrink-0 bg-white rounded-full" strokeWidth={3} />
              <div>
                <p className="text-[11px] font-black uppercase text-emerald-900 leading-relaxed tracking-wider">
                  Empieza a las{' '}
                  <span className="bg-black text-[var(--secondary)] px-2 py-0.5 rounded-md mx-1">
                    {uiStartTime}
                  </span>{' '}
                  y termina aprox. a las{' '}
                  <span className="bg-black text-[var(--secondary)] px-2 py-0.5 rounded-md mx-1">
                    {uiEndTime}
                  </span>
                  .
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button
          onClick={() => setWizardStep(3)}
          className="bg-white text-black px-6 py-4 rounded-2xl border-[3.5px] border-black font-black text-xs uppercase shadow-[4px_4px_0px_0px_black] hover:-translate-y-1 transition-all active:translate-y-1 active:shadow-none cursor-pointer"
        >
          Atrás
        </button>
        <button
          disabled={!selectedDate || !selectedTime}
          onClick={() => setWizardStep(5)}
          className="bg-[var(--primary)] text-white px-8 py-4 rounded-2xl border-[3.5px] border-black font-black text-xs uppercase shadow-[6px_6px_0px_0px_black] disabled:opacity-50 disabled:shadow-none hover:-translate-y-1 transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_black] flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          Ticket <ChevronRight size={20} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};

WizardStepSchedule.propTypes = {
  grandTotalTime: PropTypes.number.isRequired,
  selectedDate: PropTypes.instanceOf(Date),
  setSelectedDate: PropTypes.func.isRequired,
  selectedTime: PropTypes.string,
  setSelectedTime: PropTypes.func.isRequired,
  uiStartTime: PropTypes.string.isRequired,
  uiEndTime: PropTypes.string.isRequired,
  setWizardStep: PropTypes.func.isRequired,
  schedules: PropTypes.array.isRequired,
  selectedGroomer: PropTypes.string.isRequired,
};

export default WizardStepSchedule;
