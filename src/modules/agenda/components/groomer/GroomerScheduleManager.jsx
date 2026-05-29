import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Clock,
  Calendar,
  Plus,
  Trash2,
  AlertTriangle,
  Lock,
  Palmtree,
  Save,
  X,
} from 'lucide-react';
import { supabase } from '../../../../api/supabase';
import { useToast } from '../../../../store/ToastContext';
import {
  createSchedule,
  deleteSchedule,
  createException,
  deleteException,
} from '../../services/adminAgendaService';

const WEEKDAYS = [
  { id: 1, label: 'Lunes' },
  { id: 2, label: 'Martes' },
  { id: 3, label: 'Miércoles' },
  { id: 4, label: 'Jueves' },
  { id: 5, label: 'Viernes' },
  { id: 6, label: 'Sábado' },
  { id: 0, label: 'Domingo' },
];

const GroomerScheduleManager = ({ currentUser, schedules, onRefresh }) => {
  const [personalExceptions, setPersonalExceptions] = useState([]);
  const [loadingExceptions, setLoadingExceptions] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  // Form states for new absence
  const [newAbsenceDate, setNewAbsenceDate] = useState('');
  const [newAbsenceReason, setNewAbsenceReason] = useState('');
  const [newAbsenceDetail, setNewAbsenceDetail] = useState('');

  // Form states for editing weekday schedules
  const [editingDay, setEditingDay] = useState(null);
  const [editStartTime, setEditStartTime] = useState('09:00');
  const [editEndTime, setEditEndTime] = useState('17:00');

  const actor = currentUser?.id ? { id: currentUser.id, rol: currentUser.rol } : null;

  // Load groomer exceptions
  const fetchExceptions = async () => {
    if (!currentUser?.id || !supabase) return;
    setLoadingExceptions(true);
    try {
      const { data, error } = await supabase
        .from('excepciones_agenda')
        .select('*')
        .eq('groomer_id', currentUser.id)
        .order('fecha_efectiva', { ascending: true });

      if (error) throw error;
      setPersonalExceptions(data || []);
    } catch (err) {
      console.error('[GroomerScheduleManager] Error cargando excepciones:', err);
    } finally {
      setLoadingExceptions(false);
    }
  };

  useEffect(() => {
    fetchExceptions();
  }, [currentUser?.id]);



  // Add absence (exception)
  const handleAddAbsence = async (event) => {
    event.preventDefault();
    if (!newAbsenceDate || !newAbsenceReason) {
      showToast('Por favor completa la fecha y el motivo.', 'error');
      return;
    }

    setSaving(true);
    const payload = {
      tipo: 'staff',
      groomer_id: currentUser.id,
      fecha_efectiva: newAbsenceDate,
      todo_el_dia: true,
      hora_inicio: null,
      hora_fin: null,
      motivo: newAbsenceReason,
      detalle_opcional: newAbsenceDetail,
    };

    const result = await createException(payload, actor);
    if (result.error) {
      showToast(result.error.message || 'No se pudo registrar la ausencia', 'error');
    } else {
      showToast('Ausencia guardada correctamente', 'success');
      setNewAbsenceDate('');
      setNewAbsenceReason('');
      setNewAbsenceDetail('');
      await fetchExceptions();
      if (onRefresh) await onRefresh();
    }
    setSaving(false);
  };

  // Delete absence (exception)
  const handleDeleteAbsence = async (id) => {
    setSaving(true);
    const result = await deleteException(id, actor);
    if (result.error) {
      showToast(result.error.message || 'No se pudo eliminar la ausencia', 'error');
    } else {
      showToast('Ausencia eliminada', 'success');
      await fetchExceptions();
      if (onRefresh) await onRefresh();
    }
    setSaving(false);
  };

  // Open edit modal for a day
  const startEditDay = (day) => {
    setEditingDay(day);
    setEditStartTime('09:00');
    setEditEndTime('17:00');
  };

  // Save new schedule block for weekday
  const handleSaveDaySchedule = async () => {
    if (!editingDay) return;
    setSaving(true);

    const payload = {
      groomer_id: currentUser.id,
      dia_semana: editingDay.id,
      hora_inicio: editStartTime,
      hora_fin: editEndTime,
    };

    const result = await createSchedule(payload, actor);

    if (result.error) {
      showToast(result.error.message || 'No se pudo guardar el horario', 'error');
    } else {
      showToast(`Bloque de horario añadido para el ${editingDay.label}`, 'success');
      setEditingDay(null);
      if (onRefresh) await onRefresh();
    }
    setSaving(false);
  };

  // Clear specific schedule block
  const handleDeleteDaySchedule = async (blockId) => {
    setSaving(true);
    const result = await deleteSchedule(blockId, actor);
    if (result.error) {
      showToast(result.error.message || 'No se pudo eliminar el bloque', 'error');
    } else {
      showToast('Bloque de horario eliminado', 'success');
      if (onRefresh) await onRefresh();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Alert Header */}
      <div className="flex items-center gap-3 bg-indigo-50 border-[3.5px] border-black p-5 rounded-[2rem] shadow-[6px_6px_0px_0px_black] text-indigo-900">
        <AlertTriangle className="text-indigo-600 shrink-0" size={24} strokeWidth={3} />
        <p className="text-[10px] font-black uppercase tracking-wider leading-relaxed">
          Desde aquí puedes organizar tu jornada. Configura tus bloques de horas de disponibilidad semanal en la columna izquierda y registra días específicos de ausencia (bloqueos) en la derecha.
        </p>
      </div>



      {/* Main Double-Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 items-start">
        
        {/* LEFT COLUMN: Weekday Base Schedules (Takes 3/5 width) */}
        <div className="xl:col-span-3 bg-white border-[4px] border-black p-6 md:p-8 rounded-[3rem] shadow-[10px_10px_0px_0px_black] space-y-6">
          <div className="flex items-center gap-2 border-b-4 border-black/10 pb-3">
            <Clock size={20} className="text-[var(--primary)]" strokeWidth={3} />
            <h3 className="text-xl font-black italic uppercase">Horario Semanal Base</h3>
          </div>

          <div className="space-y-3">
            {WEEKDAYS.map((day) => {
              const daySchedules = schedules.filter(s => Number(s.dia_semana) === day.id);
              return (
                <div 
                  key={day.id} 
                  className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-slate-50 p-4 rounded-2xl border-2 border-black hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_black] transition-all duration-150"
                >
                  <div className="shrink-0">
                    <h4 className="font-black uppercase text-sm">{day.label}</h4>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5 inline-block">Bloques de atención</span>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto flex-1 justify-end">
                    {daySchedules.length > 0 ? (
                      <div className="flex flex-wrap gap-2 justify-end w-full sm:w-auto">
                        {daySchedules.map((block) => (
                          <div 
                            key={block.id} 
                            className="flex items-center gap-1.5 bg-emerald-100 border-2 border-black px-3 py-1.5 rounded-xl text-emerald-800 font-black text-[9px] uppercase shadow-[2px_2px_0px_0px_black] transition-transform duration-100"
                          >
                            <Clock size={11} strokeWidth={3} /> {block.hora_inicio.slice(0, 5)} - {block.hora_fin.slice(0, 5)}
                            <button
                              disabled={saving}
                              onClick={() => handleDeleteDaySchedule(block.id)}
                              className="ml-1 text-rose-600 hover:text-rose-900 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                              title="Eliminar bloque"
                            >
                              <Trash2 size={11} strokeWidth={3} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-rose-100 border-2 border-black px-3.5 py-1.5 rounded-xl text-rose-800 font-black text-[9px] uppercase shadow-[2px_2px_0px_0px_black]">
                        <Lock size={11} strokeWidth={3} /> Día Libre
                      </div>
                    )}

                    <div className="flex gap-1.5 shrink-0 ml-2">
                      <button
                        onClick={() => startEditDay(day)}
                        className="px-3 py-2 bg-white border-2 border-black rounded-xl text-[9px] font-black uppercase hover:bg-slate-100 active:translate-y-0.5 active:shadow-none shadow-[2px_2px_0px_0px_black] transition-all"
                      >
                        + Bloque
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Absences & Form (Takes 2/5 width) */}
        <div className="xl:col-span-2 flex flex-col gap-8">
          
          {/* Card 1: Registration Form */}
          <div className="bg-white border-[4px] border-black p-6 md:p-8 rounded-[3rem] shadow-[10px_10px_0px_0px_black] space-y-5">
            <div className="flex items-center gap-2 border-b-4 border-black/10 pb-3">
              <Calendar size={20} className="text-amber-500" strokeWidth={3} />
              <h3 className="text-xl font-black italic uppercase">Bloquear Fecha</h3>
            </div>

            <form onSubmit={handleAddAbsence} className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Fecha de Inactividad</label>
                <input
                  type="date"
                  value={newAbsenceDate}
                  onChange={(e) => setNewAbsenceDate(e.target.value)}
                  className="w-full bg-slate-50 border-[3px] border-black rounded-2xl p-3 font-bold text-xs shadow-[3px_3px_0px_0px_black] focus:outline-none transition-all focus:-translate-y-0.5"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Motivo</label>
                <select
                  value={newAbsenceReason}
                  onChange={(e) => setNewAbsenceReason(e.target.value)}
                  className="w-full bg-slate-50 border-[3px] border-black rounded-2xl p-3 font-bold text-xs shadow-[3px_3px_0px_0px_black] focus:outline-none transition-all cursor-pointer"
                >
                  <option value="">Selecciona un motivo</option>
                  <option value="Cita Médica">Cita Médica</option>
                  <option value="Vacaciones">Vacaciones</option>
                  <option value="Asuntos Personales">Asuntos Personales</option>
                  <option value="Enfermedad">Enfermedad</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Detalles Adicionales</label>
                <textarea
                  placeholder="Especifica detalles..."
                  value={newAbsenceDetail}
                  onChange={(e) => setNewAbsenceDetail(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border-[3px] border-black rounded-2xl p-3 font-bold text-xs shadow-[3px_3px_0px_0px_black] focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-amber-400 text-black border-[3px] border-black py-4 rounded-[2rem] font-black text-xs uppercase shadow-[4px_4px_0px_0px_black] hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_black] active:translate-y-1 active:shadow-none transition-all flex justify-center items-center gap-2"
              >
                <Plus size={14} strokeWidth={3} /> Guardar Bloqueo
              </button>
            </form>
          </div>

          {/* Card 2: Exceptions List */}
          <div className="bg-white border-[4px] border-black p-6 md:p-8 rounded-[3rem] shadow-[10px_10px_0px_0px_black] space-y-5">
            <div className="flex items-center gap-2 border-b-4 border-black/10 pb-3">
              <Palmtree size={20} className="text-emerald-500" strokeWidth={3} />
              <h3 className="text-xl font-black italic uppercase">Mis Fechas Bloqueadas</h3>
            </div>

            {loadingExceptions ? (
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider animate-pulse py-4">Sincronizando bloqueos...</p>
            ) : personalExceptions.length === 0 ? (
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest py-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                No tienes ausencias registradas
              </p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {personalExceptions.map((ex) => (
                  <div 
                    key={ex.id} 
                    className="bg-slate-50 border-2 border-black rounded-2xl p-3.5 flex justify-between items-center shadow-[3px_3px_0px_0px_black] hover:-translate-y-0.5 transition-all duration-150"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-[9px] bg-black text-white px-2 py-0.5 rounded leading-none">
                          {new Date(ex.fecha_efectiva + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        </span>
                        <span className="text-[9px] font-black uppercase text-amber-600">{ex.motivo}</span>
                      </div>
                      {ex.detalle_opcional && (
                        <p className="text-[8px] font-bold text-slate-500 uppercase leading-relaxed truncate max-w-[150px]">{ex.detalle_opcional}</p>
                      )}
                    </div>

                    <button
                      disabled={saving}
                      onClick={() => handleDeleteAbsence(ex.id)}
                      className="p-1.5 bg-rose-50 text-rose-600 border-2 border-black hover:bg-rose-100 rounded-xl shadow-[2px_2px_0px_0px_black] active:translate-y-0.5 active:shadow-none transition-all shrink-0"
                      title="Eliminar bloqueo"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Add Block Modal */}
      {editingDay && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border-[6px] border-black rounded-[3.5rem] shadow-[15px_15px_0px_0px_black] w-full max-w-md p-8 relative animate-in zoom-in-95">
            <button
              onClick={() => setEditingDay(null)}
              className="absolute top-8 right-8 p-2 hover:rotate-90 transition-transform bg-rose-100 text-rose-600 rounded-full border-2 border-black"
            >
              <X size={16} strokeWidth={4} />
            </button>
            <h3 className="text-2xl font-black italic uppercase mb-6 border-b-4 border-slate-100 pb-2 pr-12 leading-none">
              Añadir Bloque {editingDay.label}
            </h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Hora de Inicio</label>
                <input
                  type="time"
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                  className="bg-slate-50 border-[3px] border-black rounded-2xl p-3 font-bold text-sm shadow-[3px_3px_0px_0px_black] focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Hora de Cierre</label>
                <input
                  type="time"
                  value={editEndTime}
                  onChange={(e) => setEditEndTime(e.target.value)}
                  className="bg-slate-50 border-[3px] border-black rounded-2xl p-3 font-bold text-sm shadow-[3px_3px_0px_0px_black] focus:outline-none"
                />
              </div>
              <button
                disabled={saving}
                onClick={handleSaveDaySchedule}
                className="w-full mt-4 bg-[var(--primary)] text-white border-[3px] border-black py-4 rounded-[2rem] font-black text-xs uppercase shadow-[4px_4px_0px_0px_black] hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_black] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-1.5"
              >
                <Save size={14} /> Guardar Bloque
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

GroomerScheduleManager.propTypes = {
  currentUser: PropTypes.shape({
    id: PropTypes.string.isRequired,
    rol: PropTypes.string,
  }).isRequired,
  schedules: PropTypes.array.isRequired,
  onRefresh: PropTypes.func,
};

export default GroomerScheduleManager;
