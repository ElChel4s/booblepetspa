import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  PlusCircle,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import { StatusBadge } from './BrutalUI';
import { updateAppointmentStatus } from '../../services/receptionAgendaService';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAYS_OF_WEEK = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];
const SLOT_HEIGHT = 128;
const START_HOUR = 9;
const END_HOUR = 18;

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
const toIsoDate = (date) => date.toISOString().slice(0, 10);

const formatLongDate = (date) => {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('es-ES', options);
};

const toMinutes = (timeValue) => {
  if (!timeValue) return 0;
  const [hours, minutes] = String(timeValue).split(':').map(Number);
  return hours * 60 + (minutes || 0);
};

const formatTimeRange = (startIso, endIso) => {
  const start = new Date(startIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const end = new Date(endIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${start} - ${end}`;
};

const buildNonWorkingBlocks = (schedules) => {
  const dayStart = START_HOUR * 60;
  const dayEnd = END_HOUR * 60;
  if (!schedules.length) {
    return [{ start: dayStart, end: dayEnd }];
  }

  const ranges = schedules
    .map((schedule) => ({ start: toMinutes(schedule.hora_inicio), end: toMinutes(schedule.hora_fin) }))
    .filter((range) => range.end > range.start)
    .sort((a, b) => a.start - b.start);

  const merged = [];
  ranges.forEach((range) => {
    const last = merged[merged.length - 1];
    if (!last || range.start > last.end) {
      merged.push({ ...range });
    } else {
      last.end = Math.max(last.end, range.end);
    }
  });

  const blocks = [];
  let cursor = dayStart;
  merged.forEach((range) => {
    if (range.start > cursor) {
      blocks.push({ start: cursor, end: range.start });
    }
    cursor = Math.max(cursor, range.end);
  });
  if (cursor < dayEnd) {
    blocks.push({ start: cursor, end: dayEnd });
  }

  return blocks;
};

const ReceptionCalendar = ({
  selectedDate,
  selectedDateObj,
  setSelectedDate,
  groomers,
  selectedWeekday,
  appointmentsByGroomer,
  schedules,
  exceptions,
  actionKey,
  runAction,
  onOpenQuickBook,
}) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(selectedDateObj.getMonth());
  const [pickerYear, setPickerYear] = useState(selectedDateObj.getFullYear());
  const [nowMinutes, setNowMinutes] = useState(null);

  useEffect(() => {
    if (isDatePickerOpen) {
      setPickerMonth(selectedDateObj.getMonth());
      setPickerYear(selectedDateObj.getFullYear());
    }
  }, [selectedDateObj, isDatePickerOpen]);

  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      const mins = date.getHours() * 60 + date.getMinutes();
      if (mins >= START_HOUR * 60 && mins <= END_HOUR * 60) {
        setNowMinutes(mins);
      } else {
        setNowMinutes(null);
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const daysInMonth = getDaysInMonth(pickerYear, pickerMonth);
  const firstDay = getFirstDayOfMonth(pickerYear, pickerMonth);
  const blanks = Array.from({ length: firstDay }, (_, index) => index);
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setPickerMonth((prev) => {
      if (prev === 0) {
        setPickerYear((year) => year - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setPickerMonth((prev) => {
      if (prev === 11) {
        setPickerYear((year) => year + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-white border-[4px] border-black p-4 rounded-3xl shadow-[6px_6px_0px_0px_black] relative z-40">
        <div>
          <h2 className="text-2xl font-black italic uppercase flex items-center gap-3">
            <CalendarDays size={28} className="text-[var(--primary)]" /> Agenda Diaria
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest capitalize">
            {formatLongDate(selectedDateObj)}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-2xl border-2 border-black relative">
          <button
            onClick={() =>
              setSelectedDate(
                toIsoDate(new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate() - 1))
              )
            }
            className="p-2 hover:bg-white rounded-xl border-2 border-transparent hover:border-black transition-all text-slate-600 hover:text-black"
          >
            <ChevronLeft size={20} strokeWidth={3} />
          </button>

          <button
            onClick={() => {
              setSelectedDate(toIsoDate(new Date()));
              setIsDatePickerOpen(false);
            }}
            className="px-4 py-2 bg-white rounded-xl border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_0px_black] active:translate-y-0.5 active:shadow-none hover:bg-slate-50 transition-all"
          >
            Hoy
          </button>

          <div className="relative">
            <button
              onClick={() => setIsDatePickerOpen((prev) => !prev)}
              className={`p-2 rounded-xl border-2 transition-all ${
                isDatePickerOpen
                  ? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_var(--primary)]'
                  : 'hover:bg-white border-transparent hover:border-black text-slate-600 hover:text-black'
              }`}
            >
              <Calendar size={20} strokeWidth={3} />
            </button>

            {isDatePickerOpen && (
              <div className="absolute top-full right-0 mt-4 w-[300px] bg-white border-[4px] border-black rounded-3xl shadow-[8px_8px_0px_0px_black] p-5 z-[100] animate-in fade-in slide-in-from-top-2 origin-top-right">
                <div className="flex justify-between items-center mb-5 bg-slate-100 rounded-2xl border-2 border-black p-2">
                  <button
                    onClick={handlePrevMonth}
                    className="p-2 hover:bg-white rounded-xl border-2 border-transparent hover:border-black transition-all"
                  >
                    <ChevronLeft size={16} strokeWidth={4} />
                  </button>
                  <span className="font-black text-sm uppercase italic tracking-widest">
                    {MONTHS[pickerMonth]} {pickerYear}
                  </span>
                  <button
                    onClick={handleNextMonth}
                    className="p-2 hover:bg-white rounded-xl border-2 border-transparent hover:border-black transition-all"
                  >
                    <ChevronRight size={16} strokeWidth={4} />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center mb-3">
                  {DAYS_OF_WEEK.map((day) => (
                    <span key={day} className="text-[10px] font-black uppercase text-slate-400">
                      {day}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {blanks.map((blank) => (
                    <div key={`blank-${blank}`} className="p-2" />
                  ))}
                  {days.map((day) => {
                    const isSelected =
                      selectedDateObj.getDate() === day &&
                      selectedDateObj.getMonth() === pickerMonth &&
                      selectedDateObj.getFullYear() === pickerYear;
                    return (
                      <button
                        key={day}
                        onClick={() => {
                          setSelectedDate(toIsoDate(new Date(pickerYear, pickerMonth, day)));
                          setIsDatePickerOpen(false);
                        }}
                        className={`aspect-square flex items-center justify-center text-xs font-black rounded-xl border-2 transition-all hover:-translate-y-1 ${
                          isSelected
                            ? 'bg-[var(--primary)] text-white border-black shadow-[3px_3px_0px_0px_black]'
                            : 'bg-white border-slate-100 hover:border-black hover:shadow-[3px_3px_0px_0px_black]'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() =>
              setSelectedDate(
                toIsoDate(new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate() + 1))
              )
            }
            className="p-2 hover:bg-white rounded-xl border-2 border-transparent hover:border-black transition-all text-slate-600 hover:text-black"
          >
            <ChevronRight size={20} strokeWidth={3} />
          </button>
        </div>
      </div>

      <div className="bg-white border-[5px] border-black rounded-[3rem] shadow-[10px_10px_0px_0px_black] overflow-hidden flex flex-col h-[70vh] z-10 relative">
        <div className="flex border-b-[5px] border-black bg-slate-50">
          <div className="w-20 border-r-[5px] border-black shrink-0 flex items-center justify-center bg-slate-100">
            <Clock size={20} className="text-slate-400" />
          </div>
          <div className="flex-1 flex text-center divide-x-[5px] divide-black">
            {groomers.map((groomer) => (
              <div key={groomer.id} className="flex-1 py-4 flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full border-2 border-black overflow-hidden shadow-sm">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${groomer.nombre_completo || groomer.id}`}
                    alt={groomer.nombre_completo || 'Groomer'}
                  />
                </div>
                <span className="font-black text-sm uppercase italic tracking-widest">
                  {groomer.nombre_completo || 'Groomer'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto flex relative bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNlMmU4ZjAiLz48L3N2Zz4=')]">
          {/* Timeline side ruler */}
          <div className="w-20 border-r-[5px] border-black shrink-0 bg-white/80 backdrop-blur-sm z-10">
            {Array.from({ length: END_HOUR - START_HOUR }, (_, index) => {
              const hour = START_HOUR + index;
              const label = `${String(hour).padStart(2, '0')}:00`;
              return (
                <div key={label} className="h-32 border-b-2 border-slate-100 flex items-start justify-center pt-2">
                  <span className="text-[10px] font-black text-slate-400">{label}</span>
                </div>
              );
            })}
          </div>

          {/* Current time horizontal indicator */}
          {nowMinutes !== null && (
            <div
              className="absolute left-20 right-0 border-t-2 border-rose-500 z-[15] pointer-events-none flex items-center"
              style={{ top: `${((nowMinutes - START_HOUR * 60) / 60) * SLOT_HEIGHT}px` }}
            >
              <span className="bg-rose-500 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-r shadow-[2px_2px_0px_0px_black] border-y border-r border-black -mt-2.5">
                Ahora
              </span>
            </div>
          )}

          {/* Columns Container */}
          <div className="flex-1 flex divide-x-[5px] divide-black relative" style={{ height: '1152px' }}>
            {groomers.map((groomer) => {
              const groomerAppointments = appointmentsByGroomer[groomer.id] || [];
              const groomerSchedules = schedules.filter(
                (schedule) => schedule.groomer_id === groomer.id && Number(schedule.dia_semana) === selectedWeekday
              );
              const nonWorkingBlocks = buildNonWorkingBlocks(groomerSchedules);
              const groomerExceptions = exceptions.filter(
                (exc) => exc.groomer_id === groomer.id || exc.tipo === 'general'
              );

              return (
                <div
                  key={groomer.id}
                  className="flex-1 relative"
                >
                  {/* Clickable slot zones for UX scheduling */}
                  {Array.from({ length: END_HOUR - START_HOUR }, (_, index) => {
                    const hour = START_HOUR + index;
                    const timeString = `${String(hour).padStart(2, '0')}:00`;
                    const top = index * SLOT_HEIGHT;
                    return (
                      <div
                        key={`slot-zone-${hour}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenQuickBook(groomer.id, timeString);
                        }}
                        className="absolute left-0 right-0 border-b border-slate-100 hover:bg-slate-500/10 cursor-pointer transition-colors flex items-start justify-end p-2 group"
                        style={{ top: `${top}px`, height: `${SLOT_HEIGHT}px` }}
                        title={`Agendar con ${groomer.nombre_completo} a las ${timeString}`}
                      >
                        <PlusCircle size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    );
                  })}

                  {/* Render non-working schedule blockages */}
                  {nonWorkingBlocks.map((block, index) => {
                    const top = ((block.start - START_HOUR * 60) / 60) * SLOT_HEIGHT;
                    const height = ((block.end - block.start) / 60) * SLOT_HEIGHT;
                    return (
                      <div
                        key={`block-${index}`}
                        className="absolute left-0 right-0 bg-slate-200/50 flex flex-col items-center justify-center border-y-2 border-slate-300 border-dashed z-[5] pointer-events-none"
                        style={{ top: `${top}px`, height: `${height}px` }}
                      >
                        <div className="bg-white px-4 py-2 rounded-xl border-2 border-slate-300 text-slate-400 font-black text-[10px] uppercase flex items-center gap-2">
                          <Lock size={14} /> Fuera de horario
                        </div>
                      </div>
                    );
                  })}

                  {/* Render database exception overlays */}
                  {groomerExceptions.map((exc) => {
                    if (exc.todo_el_dia) {
                      return (
                        <div
                          key={exc.id}
                          className="absolute inset-0 bg-slate-100/90 backdrop-blur-[1px] flex flex-col items-center justify-center border-x-2 border-slate-300 z-20 pointer-events-none p-4 text-center"
                        >
                          <div className="bg-rose-100 text-rose-700 p-3 rounded-full border-2 border-rose-500 mb-2 animate-bounce">
                            <Lock size={20} />
                          </div>
                          <span className="font-black text-[10px] uppercase tracking-widest text-slate-700">Bloqueo Total</span>
                          <p className="text-[11px] font-black text-rose-600 uppercase mt-1 italic">{exc.motivo}</p>
                          {exc.detalle_opcional && (
                            <p className="text-[9px] font-bold text-slate-400 mt-1">{exc.detalle_opcional}</p>
                          )}
                        </div>
                      );
                    } else {
                      const startMins = toMinutes(exc.hora_inicio || '09:00');
                      const endMins = toMinutes(exc.hora_fin || '18:00');
                      const top = ((startMins - START_HOUR * 60) / 60) * SLOT_HEIGHT;
                      const height = ((endMins - startMins) / 60) * SLOT_HEIGHT;
                      return (
                        <div
                          key={exc.id}
                          className="absolute left-0 right-0 bg-rose-50/90 border-y-2 border-rose-300 border-dashed z-20 pointer-events-none flex flex-col items-center justify-center p-2 text-center"
                          style={{ top: `${top}px`, height: `${height}px` }}
                        >
                          <span className="font-black text-[9px] uppercase tracking-widest text-rose-600 flex items-center gap-1">
                            <Lock size={10} /> {exc.motivo}
                          </span>
                        </div>
                      );
                    }
                  })}

                  {/* Render appointment cards */}
                  {groomerAppointments.map((appointment) => {
                    const startDate = new Date(appointment.fecha_hora_inicio);
                    const endDate = new Date(appointment.fecha_hora_fin);
                    const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
                    const endMinutes = endDate.getHours() * 60 + endDate.getMinutes();
                    const top = ((startMinutes - START_HOUR * 60) / 60) * SLOT_HEIGHT + 12;
                    const height = Math.max(90, ((endMinutes - startMinutes) / 60) * SLOT_HEIGHT - 12);
                    const isLate = appointment.estado === 'programada' && startDate < new Date();
                    const tone =
                      appointment.estado === 'en_proceso'
                        ? 'bg-indigo-50 border-indigo-500 shadow-[4px_4px_0px_0px_#6366f1]'
                        : appointment.estado === 'en_espera'
                        ? 'bg-amber-50 border-amber-400 shadow-[4px_4px_0px_0px_#fbbf24]'
                        : appointment.estado === 'completada'
                        ? 'bg-emerald-50 border-emerald-400 shadow-[4px_4px_0px_0px_#34d399]'
                        : isLate
                        ? 'bg-rose-50 border-rose-500 shadow-[4px_4px_0px_0px_#f43f5e]'
                        : 'bg-white border-black shadow-[4px_4px_0px_0px_black]';

                    return (
                      <div
                        key={appointment.id}
                        role="presentation"
                        onClick={(e) => e.stopPropagation()} // Prevent triggering timeline click
                        className={`absolute left-2 right-2 rounded-2xl border-[3px] p-3 z-10 cursor-default transition-transform hover:-translate-y-1 ${tone} flex flex-col justify-between`}
                        style={{ top: `${top}px`, height: `${height}px` }}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-sm shrink-0">🐾</span>
                              <h4 className="font-black text-xs uppercase italic truncate" title={appointment.mascota?.nombre || appointment.mascota_nombre || 'Mascota'}>
                                {appointment.mascota?.nombre || appointment.mascota_nombre || 'Mascota'}
                              </h4>
                            </div>
                            <StatusBadge status={appointment.estado || 'programada'} />
                          </div>

                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">
                            {appointment.servicio?.nombre || 'Servicio'}
                          </p>

                          <p className="text-[9px] font-black text-[var(--primary)] uppercase tracking-wider mt-0.5">
                            {formatTimeRange(appointment.fecha_hora_inicio, appointment.fecha_hora_fin)}
                          </p>

                          {isLate && (
                            <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1 mt-1">
                              <AlertTriangle size={10} /> Retraso
                            </p>
                          )}
                        </div>

                        <div className="mt-2 flex gap-1.5">
                          {appointment.estado === 'programada' && (
                            <button
                              disabled={actionKey === `appointment-${appointment.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                runAction(
                                  `appointment-${appointment.id}`,
                                  () => updateAppointmentStatus(appointment.id, 'en_espera'),
                                  'Check-in registrado'
                                );
                              }}
                              className="flex-1 bg-amber-100 border-2 border-black rounded-lg py-1 font-black text-[9px] uppercase hover:bg-amber-200 disabled:opacity-60 transition-all shadow-[2px_2px_0px_0px_black] active:translate-y-0.5 active:shadow-none"
                            >
                              Check-In
                            </button>
                          )}
                          {appointment.estado === 'en_espera' && (
                            <button
                              disabled={actionKey === `appointment-${appointment.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                runAction(
                                  `appointment-${appointment.id}`,
                                  () => updateAppointmentStatus(appointment.id, 'en_proceso'),
                                  'Servicio iniciado'
                                );
                              }}
                              className="flex-1 bg-black text-white border-2 border-black rounded-lg py-1 font-black text-[9px] uppercase hover:bg-slate-900 disabled:opacity-60 transition-all shadow-[2px_2px_0px_0px_var(--primary)] active:translate-y-0.5 active:shadow-none"
                            >
                              Iniciar
                            </button>
                          )}
                          {appointment.estado === 'en_proceso' && (
                            <button
                              disabled={actionKey === `appointment-${appointment.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                runAction(
                                  `appointment-${appointment.id}`,
                                  () => updateAppointmentStatus(appointment.id, 'completada'),
                                  'Servicio completado'
                                );
                              }}
                              className="flex-1 bg-emerald-400 text-black border-2 border-black rounded-lg py-1 font-black text-[9px] uppercase hover:bg-emerald-500 disabled:opacity-60 transition-all shadow-[2px_2px_0px_0px_black] active:translate-y-0.5 active:shadow-none"
                            >
                              Finalizar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

ReceptionCalendar.propTypes = {
  selectedDate: PropTypes.string.isRequired,
  selectedDateObj: PropTypes.instanceOf(Date).isRequired,
  setSelectedDate: PropTypes.func.isRequired,
  groomers: PropTypes.array.isRequired,
  selectedWeekday: PropTypes.number.isRequired,
  appointmentsByGroomer: PropTypes.object.isRequired,
  schedules: PropTypes.array.isRequired,
  exceptions: PropTypes.array.isRequired,
  actionKey: PropTypes.string,
  runAction: PropTypes.func.isRequired,
  onOpenQuickBook: PropTypes.func.isRequired,
};

export default ReceptionCalendar;
