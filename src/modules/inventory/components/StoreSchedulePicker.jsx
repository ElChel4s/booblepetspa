import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { CalendarDays, ArrowLeft, Sun, Moon, Loader2 } from 'lucide-react';
import { supabase } from '../../../api/supabase';

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
    const aStartMins = appStart.getHours() * 60 + appStart.getMinutes();
    const aEndMins = appEnd.getHours() * 60 + appEnd.getMinutes();

    if (startMins < aEndMins && endMins > aStartMins) {
      return true;
    }
  }
  return false;
};

const StoreSchedulePicker = ({ totalTimeMinutes, value, onChange }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDateObj, setSelectedDateObj] = useState(null);
  
  const [schedules, setSchedules] = useState([]);
  const [dayAppointments, setDayAppointments] = useState([]);
  const [dayExceptions, setDayExceptions] = useState([]);
  
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availableSlots, setAvailableSlots] = useState({ morning: [], afternoon: [] });

  // Load schedules once
  useEffect(() => {
    const fetchSchedules = async () => {
      const { data } = await supabase.from('horarios_base_groomer').select('*');
      if (data) setSchedules(data);
    };
    fetchSchedules();
  }, []);

  const isDayValid = (dateObj) => {
    const dbDay = jsDayToDbDay(dateObj.getDay());
    return schedules.some((s) => s.dia_semana === dbDay);
  };

  useEffect(() => {
    if (!selectedDateObj) {
      setAvailableSlots({ morning: [], afternoon: [] });
      setDayExceptions([]);
      return;
    }

    const fetchAppointmentsAndExceptions = async () => {
      setLoadingSlots(true);
      const dateStr = getISODate(selectedDateObj);
      
      const [year, month, day] = dateStr.split('-');
      const localStart = new Date(year, month - 1, day, 0, 0, 0).toISOString();
      const localEnd = new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();

      const [appRes, excRes] = await Promise.all([
        supabase.from('citas')
          .select('id, groomer_id, fecha_hora_inicio, fecha_hora_fin, estado')
          .gte('fecha_hora_inicio', localStart)
          .lte('fecha_hora_inicio', localEnd)
          .neq('estado', 'cancelada'),
        supabase.from('excepciones_agenda')
          .select('*')
          .eq('fecha_efectiva', dateStr)
      ]);
      
      setDayAppointments(appRes.data || []);
      setDayExceptions(excRes.data || []);
      setLoadingSlots(false);
    };

    fetchAppointmentsAndExceptions();
  }, [selectedDateObj]);

  useEffect(() => {
    if (!selectedDateObj || loadingSlots) return;

    const dbDay = jsDayToDbDay(selectedDateObj.getDay());
    const daySchedules = schedules.filter((s) => s.dia_semana === dbDay);
    
    const morningSet = new Set();
    const afternoonSet = new Set();
    
    const now = new Date();
    const isToday = selectedDateObj.toDateString() === now.toDateString();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    daySchedules.forEach((block) => {
      const blockStartMins = timeToMinutes(block.hora_inicio);
      const blockEndMins = timeToMinutes(block.hora_fin);
      
      const groomerAppointments = dayAppointments.filter(app => app.groomer_id === block.groomer_id);

      const groomerExceptions = dayExceptions.filter(
        exc => exc.tipo === 'general' || (exc.tipo === 'staff' && exc.groomer_id === block.groomer_id)
      );

      if (groomerExceptions.some(exc => exc.todo_el_dia)) {
        return;
      }
      
      let currentSlotMins = blockStartMins;

      while (currentSlotMins + totalTimeMinutes <= blockEndMins) {
        if (isToday && currentSlotMins <= currentMins + 30) {
          currentSlotMins += 30;
          continue;
        }

        const slotEndMins = currentSlotMins + totalTimeMinutes;
        const hasOverlap = checkOverlap(currentSlotMins, slotEndMins, groomerAppointments);

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
          if (currentSlotMins < 720) {
            morningSet.add(slotStr);
          } else {
            afternoonSet.add(slotStr);
          }
        }
        
        currentSlotMins += 30;
      }
    });

    const morning = Array.from(morningSet).sort();
    const afternoon = Array.from(afternoonSet).sort();

    setAvailableSlots({ morning, afternoon });

    if (value.hora) {
      if (!morning.includes(value.hora) && !afternoon.includes(value.hora)) {
        onChange({ ...value, hora: '' });
      }
    }
  }, [selectedDateObj, dayAppointments, dayExceptions, schedules, totalTimeMinutes, loadingSlots]);

  return (
    <div className="space-y-4">
      <div className="bg-white border-[3px] border-black rounded-2xl p-4 shadow-[4px_4px_0px_0px_black]">
        <div className="flex items-center justify-between mb-4 border-b-[2px] border-black/10 pb-3">
          <h3 className="text-xs font-black uppercase flex items-center gap-2 text-slate-900 tracking-widest">
            <CalendarDays size={16} className="text-[var(--primary)]" /> 1. Día
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
              disabled={viewDate.getMonth() === new Date().getMonth() && viewDate.getFullYear() === new Date().getFullYear()}
              className="p-1 border-[2px] border-black rounded bg-white disabled:opacity-50"
            >
              <ArrowLeft size={14} strokeWidth={3} />
            </button>
            <span className="font-black text-[10px] uppercase tracking-widest text-center min-w-[90px]">
              {viewDate.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
            </span>
            <button
              type="button"
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
              className="p-1 border-[2px] border-black rounded bg-white"
            >
              <ArrowLeft size={14} strokeWidth={3} className="rotate-180" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map((d) => (
            <div key={d} className="text-[9px] font-black text-slate-400 uppercase mb-1">{d}</div>
          ))}

          {Array.from({ length: new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay() }).map((_, i) => <div key={`e-${i}`} />)}

          {Array.from({ length: new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate() }).map((_, i) => {
              const dateObj = new Date(viewDate.getFullYear(), viewDate.getMonth(), i + 1);
              const isPast = dateObj < new Date(new Date().setHours(0, 0, 0, 0));
              const hasSchedule = isDayValid(dateObj);
              const isDisabled = isPast || !hasSchedule;
              const isSelected = selectedDateObj && selectedDateObj.getTime() === dateObj.getTime();

              return (
                <button
                  type="button"
                  key={i}
                  disabled={isDisabled}
                  onClick={() => {
                    setSelectedDateObj(dateObj);
                    onChange({ fecha: getISODate(dateObj), hora: '' });
                  }}
                  className={`aspect-square rounded-lg border-[2px] text-xs font-black transition-all ${
                    isDisabled ? 'border-slate-200 bg-slate-50 text-slate-300 opacity-50' : 
                    isSelected ? 'border-black bg-black text-white shadow-[2px_2px_0px_0px_var(--primary)]' : 
                    'border-transparent bg-slate-100 hover:border-black text-slate-700'
                  }`}
                >
                  {i + 1}
                </button>
              );
            }
          )}
        </div>
      </div>

      {selectedDateObj && (
        <div className="bg-white border-[3px] border-black rounded-2xl p-4 shadow-[4px_4px_0px_0px_black]">
          <h3 className="text-xs font-black uppercase mb-4 text-slate-900 tracking-widest border-b-[2px] border-black/10 pb-3">
            2. Hora
          </h3>

          {loadingSlots ? (
             <div className="flex flex-col items-center justify-center py-4">
               <Loader2 size={24} className="animate-spin text-[var(--primary)] mb-2" />
             </div>
          ) : availableSlots.morning.length === 0 && availableSlots.afternoon.length === 0 ? (
            <p className="text-xs font-bold text-center text-slate-500">Sin horarios disponibles.</p>
          ) : (
            <div className="space-y-4">
              {availableSlots.morning.length > 0 && (
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Sun size={12}/> Mañana</p>
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.morning.map((t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => onChange({ ...value, hora: t })}
                        className={`py-1.5 rounded-lg border-[2px] font-black text-[11px] ${
                          value.hora === t ? 'border-black bg-[var(--primary)] text-white shadow-[2px_2px_0px_0px_black]' : 'border-black bg-white shadow-[2px_2px_0px_0px_black] hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {availableSlots.afternoon.length > 0 && (
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Moon size={12}/> Tarde</p>
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.afternoon.map((t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => onChange({ ...value, hora: t })}
                        className={`py-1.5 rounded-lg border-[2px] font-black text-[11px] ${
                          value.hora === t ? 'border-black bg-[var(--primary)] text-white shadow-[2px_2px_0px_0px_black]' : 'border-black bg-white shadow-[2px_2px_0px_0px_black] hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

StoreSchedulePicker.propTypes = {
  totalTimeMinutes: PropTypes.number.isRequired,
  value: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default StoreSchedulePicker;
