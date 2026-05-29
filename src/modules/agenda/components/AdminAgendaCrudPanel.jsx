/* eslint-disable react/no-unstable-nested-components */
import { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Users,
  Scissors,
  AlertTriangle,
  X,
  Ruler,
  Lock,
  ChevronRight,
  Info,
  Trash2,
  Settings,
  ChevronLeft,
  Palmtree,
  Clock,
  Save,
  Plus,
  Activity,
  CalendarDays,
  ShieldAlert,
} from 'lucide-react';
import { supabase } from '../../../api/supabase';
import { useToast } from '../../../store/ToastContext';
import { groupAppointmentsByGroomer } from '../services/agendaService';
import {
  createException,
  deleteException,
  createSchedule,
  deleteSchedule,
} from '../services/adminAgendaService';
import GroomingModule from '../../grooming/GroomingModule';

const BrutalInput = ({ label, type = 'text', placeholder, value, onChange, icon: Icon }) => (
  <div className="flex flex-col gap-2 mb-4 w-full">
    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</label>
    <div className="relative">
      {Icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Icon size={18} strokeWidth={3} /></div>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full bg-slate-50 border-[3.5px] border-black rounded-2xl p-3 ${Icon ? 'pl-11' : 'pl-4'} font-bold text-sm shadow-[4px_4px_0px_0px_black] focus:outline-none focus:-translate-y-1 focus:shadow-[6px_6px_0px_0px_var(--primary)] transition-all`}
      />
    </div>
  </div>
);

BrutalInput.propTypes = {
  label: PropTypes.string.isRequired,
  type: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  icon: PropTypes.elementType,
};

const PopModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border-[6px] border-black rounded-[3.5rem] shadow-[15px_15px_0px_0px_black] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 relative animate-in zoom-in-95">
        <button onClick={onClose} className="absolute top-8 right-8 p-2 hover:rotate-90 transition-transform bg-rose-100 text-rose-600 rounded-full border-2 border-black">
          <X size={20} strokeWidth={4} />
        </button>
        <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-8 pr-12 border-b-8 border-slate-100 pb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
};

PopModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.string,
  children: PropTypes.node,
};

const getDaysOfWeek = (baseDateStr) => {
  const baseDate = new Date(`${baseDateStr}T00:00:00`);
  const dayOfWeek = baseDate.getDay();
  const shift = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() - shift);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    days.push(date);
  }
  return days;
};

const AdminAgendaCrudPanel = ({
  activeTab,
  agendaData,
  loading,
  error,
  selectedDate,
  setSelectedDate,
  onRefresh,
  currentUser,
}) => {
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [viewScope, setViewScope] = useState('general');
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [formType, setFormType] = useState('general');
  const [blockForm, setBlockForm] = useState({ motivo: '', detalle: '', groomerId: '' });

  const services = useMemo(() => {
    const dbServices = agendaData?.services || [];
    return dbServices.map((service) => ({
      id: service.id,
      type: 'service',
      nombre: service.nombre,
      precio: Number(service.precio_base || 0),
      duracion: Number(service.duracion_base_minutos || 0),
      cat: service.categoria || 'General',
      icon: Scissors,
    }));
  }, [agendaData?.services]);

  const rules = useMemo(() => {
    const dbRules = agendaData?.modifiers || [];
    return dbRules.map((rule) => ({
      id: rule.id,
      type: 'rule',
      nombre: rule.criterio || 'Regla dinámica',
      duracion: String(rule.tiempo_extra_minutos ?? 0),
      isPercent: Boolean(rule.tiempo_es_porcentaje),
      precio: String(rule.precio_adicional ?? 0),
      cat: rule.valor || 'Modificador',
      icon: rule.criterio?.toLowerCase().includes('tam') ? Ruler : ShieldAlert,
    }));
  }, [agendaData?.modifiers]);

  const staffList = useMemo(() => {
    const dbGroomers = agendaData?.groomers || [];
    return dbGroomers.map((groomer, idx) => ({
      id: groomer.id,
      nombre: groomer.nombre_completo,
      rol: 'Groomer',
      color: idx % 2 === 0 ? 'bg-indigo-100' : 'bg-emerald-100',
      avatar: groomer.nombre_completo,
    }));
  }, [agendaData?.groomers]);

  const exceptions = agendaData?.exceptions || [];
  const generalBlocks = useMemo(() => {
    return exceptions
      .filter((item) => item.tipo === 'general')
      .map((item, idx) => ({
        id: item.id || idx + 1,
        day: Number(new Date(item.fecha_efectiva).getDate()) || idx + 1,
        time: item.todo_el_dia ? 'Día Completo' : `${item.hora_inicio || '08:00'} - ${item.hora_fin || '17:00'}`,
        reason: item.motivo || 'Bloqueo de agenda',
      }));
  }, [exceptions]);

  const staffBlocks = useMemo(() => {
    return exceptions
      .filter((item) => item.tipo === 'staff')
      .map((item, idx) => ({
        id: item.id || idx + 1,
        day: Number(new Date(item.fecha_efectiva).getDate()) || idx + 1,
        time: item.todo_el_dia ? 'Día Completo' : `${item.hora_inicio || '08:00'} - ${item.hora_fin || '17:00'}`,
        reason: item.motivo || 'Ausencia',
        staff: item.nombre_completo || 'Groomer',
      }));
  }, [exceptions]);

  const groomers = agendaData?.groomers || [];
  const appointments = agendaData?.appointments || [];
  const appointmentsByGroomer = groupAppointmentsByGroomer(appointments, groomers, agendaData?.services || []);

  const actor = currentUser?.id ? { id: currentUser.id, rol: currentUser.rol } : null;



  const resetBlockForm = () => setBlockForm({ motivo: '', detalle: '', groomerId: '' });

  const saveException = async () => {
    if (!formType) return;
    const effectiveDate = selectedDay ? new Date(selectedDate).toISOString().slice(0, 8) + String(selectedDay).padStart(2, '0') : selectedDate;
    const payload = {
      tipo: formType,
      groomer_id: formType === 'staff' ? (blockForm.groomerId || null) : null,
      fecha_efectiva: effectiveDate,
      todo_el_dia: true,
      hora_inicio: null,
      hora_fin: null,
      motivo: blockForm.motivo || (formType === 'staff' ? 'Ausencia' : 'Cierre'),
      detalle_opcional: blockForm.detalle,
    };

    setSaving(true);
    const result = await createException(payload, actor);
    if (result?.error) {
      showToast(result.error.message || 'No se pudo guardar la excepción', 'error');
    } else {
      showToast('Excepción registrada', 'success');
      setIsBlockModalOpen(false);
      resetBlockForm();
      await onRefresh();
    }
    setSaving(false);
  };

  const removeException = async (exceptionId) => {
    setSaving(true);
    const result = await deleteException(exceptionId, actor);
    if (result?.error) {
      showToast(result.error.message || 'No se pudo eliminar la excepción', 'error');
    } else {
      showToast('Excepción eliminada', 'success');
      await onRefresh();
    }
    setSaving(false);
  };



  const AdminStaffMatrix = () => {
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const [addingBlockDay, setAddingBlockDay] = useState(null);
    const [newStartTime, setNewStartTime] = useState('09:00');
    const [newEndTime, setNewEndTime] = useState('17:00');

    const getDbDayId = (idx) => (idx === 6 ? 0 : idx + 1);

    const handleRemoveBlock = async (blockId) => {
      setSaving(true);
      const result = await deleteSchedule(blockId, actor);
      if (result.error) {
        showToast(result.error.message || 'No se pudo eliminar el bloque', 'error');
      } else {
        showToast('Bloque de horario eliminado', 'success');
        await onRefresh();
      }
      setSaving(false);
    };

    const handleAddBlock = async (dayId) => {
      if (!newStartTime || !newEndTime) return;
      setSaving(true);
      const payload = {
        groomer_id: selectedStaff.id,
        dia_semana: dayId,
        hora_inicio: newStartTime,
        hora_fin: newEndTime,
      };
      const result = await createSchedule(payload, actor);
      if (result.error) {
        showToast(result.error.message || 'No se pudo añadir el bloque', 'error');
      } else {
        showToast('Bloque de horario añadido', 'success');
        setAddingBlockDay(null);
        await onRefresh();
      }
      setSaving(false);
    };

    return (
      <div className="animate-in slide-in-from-right-4 duration-500">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-4xl font-black italic uppercase tracking-tighter">Matriz de <span className="text-[var(--primary)]">Staff</span></h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Horarios flexibles y capacidad</p>
          </div>
        </div>

        {staffList.length === 0 ? (
          <div className="bg-white border-[4px] border-black p-8 rounded-[2.5rem] shadow-[8px_8px_0px_0px_black] text-center">
            <p className="text-xs font-bold text-slate-400 uppercase">No hay groomers registrados en el sistema para configurar horarios.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {staffList.map((staff) => (
              <div key={staff.id} className="bg-white border-[4px] border-black p-6 rounded-[2.5rem] shadow-[8px_8px_0px_0px_black] flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className={`w-20 h-20 rounded-full border-[3px] border-black shadow-[4px_4px_0px_0px_black] overflow-hidden ${staff.color}`}>
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${staff.avatar}`} alt={staff.nombre} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase italic leading-none">{staff.nombre}</h3>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 inline-block">{staff.rol}</span>
                  </div>
                </div>

                <div className="flex-1 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, idx) => {
                    const hasBlocks = (agendaData?.schedules || []).some(
                      (s) => s.groomer_id === staff.id && Number(s.dia_semana) === getDbDayId(idx)
                    );
                    return (
                      <div 
                        key={`${staff.id}-${d}-${idx}`} 
                        className={`w-10 h-10 shrink-0 rounded-xl border-2 flex items-center justify-center font-black text-xs transition-all ${
                          hasBlocks 
                            ? 'bg-emerald-100 text-emerald-700 border-black shadow-[2px_2px_0px_0px_black]' 
                            : 'bg-slate-50 text-slate-300 border-slate-200 border-dashed'
                        }`}
                      >
                        {d}
                      </div>
                    );
                  })}
                </div>

                <button onClick={() => setSelectedStaff(staff)} className="shrink-0 p-4 bg-slate-50 border-[3px] border-black rounded-2xl hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_black] hover:translate-y-1 hover:shadow-none">
                  <Settings size={20} strokeWidth={3} />
                </button>
              </div>
            ))}
          </div>
        )}

        <PopModal isOpen={Boolean(selectedStaff)} onClose={() => { setSelectedStaff(null); setAddingBlockDay(null); }} title={`Horario de ${selectedStaff?.nombre || ''}`}>
          <div className="space-y-6">
            <div className="bg-indigo-50 border-2 border-indigo-200 p-4 rounded-2xl flex items-center gap-3">
              <Activity className="text-indigo-500 shrink-0" size={24} />
              <p className="text-[10px] font-bold text-indigo-800 uppercase leading-relaxed">El motor asignará turnos basándose en estos bloques de tiempo. Puedes añadir múltiples bloques por día.</p>
            </div>

            <div className="space-y-4">
              {days.map((day, idx) => {
                const dayId = getDbDayId(idx);
                const daySchedules = (agendaData?.schedules || []).filter(
                  (s) => s.groomer_id === selectedStaff?.id && Number(s.dia_semana) === dayId
                );
                const isAdding = addingBlockDay === dayId;

                return (
                  <div key={day} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-slate-50 p-4 rounded-2xl border-2 border-black/10">
                    <div className="w-24 font-black uppercase text-sm">{day}</div>

                    <div className="flex-1 flex flex-col gap-2 w-full">
                      {daySchedules.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {daySchedules.map((block) => (
                            <div key={block.id} className="flex items-center gap-1.5 bg-emerald-100 border-2 border-black px-3 py-1.5 rounded-xl text-emerald-800 font-black text-[10px] uppercase shadow-[2.5px_2.5px_0px_0px_black]">
                              <Clock size={11} strokeWidth={3} /> {block.hora_inicio.slice(0, 5)} - {block.hora_fin.slice(0, 5)}
                              <button
                                disabled={saving}
                                onClick={() => handleRemoveBlock(block.id)}
                                className="ml-1 text-rose-600 hover:text-rose-900 transition-colors"
                                title="Eliminar bloque"
                              >
                                <Trash2 size={11} strokeWidth={3} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider italic py-1.5">Día Libre / Inactivo</div>
                      )}

                      {isAdding ? (
                        <div className="flex items-center gap-2 mt-2 bg-slate-200/50 p-3 rounded-2xl border-2 border-black animate-in slide-in-from-top-2 duration-150 w-full sm:w-auto">
                          <input 
                            type="time" 
                            value={newStartTime} 
                            onChange={(e) => setNewStartTime(e.target.value)} 
                            className="bg-white border-2 border-black rounded-lg px-2.5 py-1 font-bold text-xs" 
                          />
                          <span className="font-black text-slate-400">-</span>
                          <input 
                            type="time" 
                            value={newEndTime} 
                            onChange={(e) => setNewEndTime(e.target.value)} 
                            className="bg-white border-2 border-black rounded-lg px-2.5 py-1 font-bold text-xs" 
                          />
                          <button 
                            disabled={saving}
                            onClick={() => handleAddBlock(dayId)} 
                            className="bg-emerald-400 text-black px-3.5 py-1.5 rounded-xl border-2 border-black font-black text-[10px] uppercase shadow-[2px_2px_0px_0px_black] active:translate-y-0.5 active:shadow-none hover:bg-emerald-500 transition-all ml-1"
                          >
                            Ok
                          </button>
                          <button 
                            onClick={() => setAddingBlockDay(null)} 
                            className="bg-white text-slate-700 px-3 py-1.5 rounded-xl border-2 border-black font-black text-[10px] uppercase hover:bg-slate-100 transition-all"
                          >
                            <X size={10} strokeWidth={3} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setAddingBlockDay(dayId);
                            setNewStartTime('09:00');
                            setNewEndTime('17:00');
                          }}
                          className="w-fit text-[9px] font-black uppercase text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 mt-1 border-2 border-dashed border-indigo-200 hover:border-indigo-400 px-3 py-1.5 rounded-xl bg-indigo-50/50 transition-all"
                        >
                          <Plus size={10} strokeWidth={3} /> Añadir Bloque
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={() => { setSelectedStaff(null); setAddingBlockDay(null); }} className="w-full bg-black text-white border-[4px] border-black py-4 rounded-2xl font-black text-sm uppercase shadow-[6px_6px_0px_0px_var(--primary)] hover:translate-y-1 hover:shadow-none transition-all flex justify-center items-center gap-2">
              Listo / Cerrar
            </button>
          </div>
        </PopModal>
      </div>
    );
  };

  const AdminBlockManager = () => {
    const currentBlocks = viewScope === 'general' ? generalBlocks : staffBlocks;

    return (
      <div className="animate-in slide-in-from-right-4 duration-500">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-4xl font-black italic uppercase tracking-tighter">Gestor de <span className="text-[var(--primary)]">Excepciones</span></h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Bloqueos de agenda y ausencias</p>
          </div>
        </div>

        <div className="flex gap-4 mb-8">
          <button onClick={() => setViewScope('general')} className={`flex-1 py-4 rounded-2xl border-[4px] border-black font-black text-xs uppercase transition-all shadow-[4px_4px_0px_0px_black] active:translate-y-1 active:shadow-none flex items-center justify-center gap-2 ${viewScope === 'general' ? 'bg-rose-400 text-white' : 'bg-white hover:bg-slate-50'}`}>
            <Lock size={18} /> Excepciones del Local
          </button>
          <button onClick={() => setViewScope('staff')} className={`flex-1 py-4 rounded-2xl border-[4px] border-black font-black text-xs uppercase transition-all shadow-[4px_4px_0px_0px_black] active:translate-y-1 active:shadow-none flex items-center justify-center gap-2 ${viewScope === 'staff' ? 'bg-amber-400 text-black' : 'bg-white hover:bg-slate-50'}`}>
            <Palmtree size={18} /> Ausencias de Staff
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 bg-white border-[4px] border-black p-6 rounded-[2.5rem] shadow-[8px_8px_0px_0px_black]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black uppercase italic">{new Date(selectedDate).toLocaleDateString()}</h3>
              <div className="flex gap-2">
                <button className="p-2 border-2 border-black rounded-lg hover:bg-slate-100"><ChevronLeft size={16} /></button>
                <button className="p-2 border-2 border-black rounded-lg hover:bg-slate-100"><ChevronRight size={16} /></button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map((d) => <div key={d} className="text-center text-[10px] font-black uppercase text-slate-400">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 31 }).map((_, i) => {
                const day = i + 1;
                const isGeneral = viewScope === 'general' && generalBlocks.find((b) => b.day === day);
                const isStaff = viewScope === 'staff' && staffBlocks.find((b) => b.day === day);

                let bgClass = 'bg-slate-50 hover:bg-slate-200 border-transparent';
                if (isGeneral) bgClass = 'bg-rose-100 border-rose-400 text-rose-700';
                if (isStaff) bgClass = 'bg-amber-100 border-amber-400 text-amber-700';

                return (
                  <button
                    key={day}
                    onClick={() => {
                      setSelectedDay(day);
                      setFormType(viewScope);
                      setIsBlockModalOpen(true);
                    }}
                    className={`aspect-square rounded-xl border-2 font-black text-sm flex items-center justify-center transition-all ${bgClass}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="w-full lg:w-80">
            <div className={`border-[4px] border-black p-6 rounded-[2.5rem] shadow-[6px_6px_0px_0px_black] transition-colors ${viewScope === 'general' ? 'bg-rose-100' : 'bg-amber-100'}`}>
              <h4 className="font-black uppercase italic mb-4 flex items-center gap-2">
                {viewScope === 'general' ? <Lock size={18} /> : <Palmtree size={18} />}
                {viewScope === 'general' ? 'Cierres de Local' : 'Ausencias'}
              </h4>

              <div className="space-y-3">
                {currentBlocks.length === 0 ? (
                  <p className="text-xs font-bold text-slate-500 italic">No hay excepciones registradas en la base de datos.</p>
                ) : (
                  currentBlocks
                    .map((b) => ({
                      ...b,
                      persisted: exceptions.some((ex) => ex.id === b.id),
                    }))
                    .map((b) => (
                      <div key={b.id} className="bg-white p-3 rounded-xl border-[3px] border-black flex justify-between items-center group shadow-[3px_3px_0px_0px_black] hover:-translate-y-0.5 transition-transform">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm leading-none">{b.day}</span>
                            {b.time !== 'Dia Completo' && <span className="text-[8px] bg-slate-100 px-1.5 py-0.5 rounded font-black">{b.time}</span>}
                          </div>
                          <span className="text-[9px] font-bold text-slate-500 uppercase flex flex-col gap-1 mt-1">
                            {b.staff && <span className="text-indigo-500">{b.staff}</span>}
                            <span className="flex items-center gap-1">{viewScope === 'general' ? <AlertTriangle size={10} /> : <Info size={10} />} {b.reason}</span>
                          </span>
                        </div>
                        <button
                          disabled={!b.persisted || saving}
                          onClick={() => b.persisted && removeException(b.id)}
                          className="p-1.5 bg-rose-50 text-rose-500 border-2 border-transparent hover:border-rose-200 rounded-lg transition-all disabled:opacity-40"
                          title="Eliminar Excepción"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                )}
              </div>

              <button onClick={() => { setFormType(viewScope); setSelectedDay(null); setIsBlockModalOpen(true); }} className="w-full mt-6 bg-white border-[3px] border-black py-3 rounded-xl font-black text-[10px] uppercase shadow-[3px_3px_0px_0px_black] hover:translate-y-1 hover:shadow-none transition-all flex justify-center items-center gap-2">
                <Plus size={16} /> Añadir {viewScope === 'general' ? 'Cierre' : 'Ausencia'}
              </button>
            </div>
          </div>
        </div>

        <PopModal isOpen={isBlockModalOpen} onClose={() => setIsBlockModalOpen(false)} title="Nueva Excepcion">
          <div className="space-y-6">
            <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_0px_black]">
              <button onClick={() => setFormType('general')} className={`flex-1 py-2.5 rounded-xl font-black text-[10px] uppercase transition-colors ${formType === 'general' ? 'bg-rose-500 text-white' : 'bg-transparent text-slate-400 hover:bg-slate-200'}`}>Cierre General (Local)</button>
              <button onClick={() => setFormType('staff')} className={`flex-1 py-2.5 rounded-xl font-black text-[10px] uppercase transition-colors ${formType === 'staff' ? 'bg-amber-400 text-black' : 'bg-transparent text-slate-400 hover:bg-slate-200'}`}>Ausencia (Staff)</button>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 bg-slate-100 p-4 rounded-2xl border-2 border-black flex flex-col justify-center items-center">
                <span className="block text-[8px] font-black uppercase text-slate-400">Fecha Efectiva</span>
                <span className="text-2xl font-black italic">{selectedDay || '--'}</span>
              </div>

              {formType === 'staff' && (
                <div className="flex-1 flex flex-col gap-2">
                  <label htmlFor="staff-absence-select" className="text-[10px] font-black uppercase tracking-widest text-slate-500">¿Quién se ausenta?</label>
                  <select id="staff-absence-select" value={blockForm.groomerId} onChange={(event) => setBlockForm((prev) => ({ ...prev, groomerId: event.target.value }))} className="w-full bg-slate-50 border-[3.5px] border-black rounded-2xl p-3 font-bold text-sm shadow-[4px_4px_0px_0px_black] focus:outline-none appearance-none">
                    <option value="">Selecciona groomer</option>
                    {staffList.map((staff) => <option key={staff.id} value={staff.id}>{staff.nombre}</option>)}
                  </select>
                </div>
              )}
            </div>

            <BrutalInput label="Motivo" placeholder="Ej. Mantenimiento" value={blockForm.motivo} onChange={(event) => setBlockForm((prev) => ({ ...prev, motivo: event.target.value }))} />
            <BrutalInput label="Detalle (Opcional)" placeholder="Ej. Corte de luz programado..." value={blockForm.detalle} onChange={(event) => setBlockForm((prev) => ({ ...prev, detalle: event.target.value }))} />

            <div className={`flex items-center gap-3 p-4 rounded-xl border-[3px] ${formType === 'general' ? 'bg-rose-100 border-rose-300' : 'bg-amber-100 border-amber-300'}`}>
              <AlertTriangle size={24} className={formType === 'general' ? 'text-rose-500' : 'text-amber-600'} />
              <p className={`text-[10px] font-bold uppercase ${formType === 'general' ? 'text-rose-800' : 'text-amber-800'}`}>
                {formType === 'general'
                  ? 'Nadie podrá agendar citas en este período.'
                  : 'El sistema no asignará turnos a este groomer en la fecha seleccionada.'}
              </p>
            </div>

            <button onClick={saveException} disabled={saving} className={`w-full ${formType === 'general' ? 'bg-rose-500 text-white shadow-[6px_6px_0px_0px_black]' : 'bg-[var(--secondary)] text-black shadow-[6px_6px_0px_0px_black]'} border-[4px] border-black py-4 rounded-2xl font-black text-sm uppercase hover:translate-y-1 hover:shadow-none transition-all flex justify-center items-center gap-2 disabled:opacity-70`}>
              <Save size={20} /> {saving ? 'Guardando...' : 'Guardar Excepción'}
            </button>
          </div>
        </PopModal>
      </div>
    );
  };

  const AdminMasterCalendar = () => {
    const [viewMode, setViewMode] = useState('daily');
    const [weeklyAppointments, setWeeklyAppointments] = useState([]);
    const [weeklyLoading, setWeeklyLoading] = useState(false);

    const groomerColumns = groomers.length ? groomers : staffList.map((staff) => ({ id: staff.id, nombre_completo: staff.nombre }));
    const daysOfWeek = useMemo(() => getDaysOfWeek(selectedDate), [selectedDate]);

    useEffect(() => {
      if (viewMode === 'weekly') {
        const fetchWeeklyData = async () => {
          setWeeklyLoading(true);
          try {
            const startStr = daysOfWeek[0].toISOString().slice(0, 10) + 'T00:00:00.000Z';
            const endStr = daysOfWeek[6].toISOString().slice(0, 10) + 'T23:59:59.999Z';
            const { data, error: fetchErr } = await supabase
              .from('citas')
              .select('id, reserva_id, mascota_id, groomer_id, servicio_id, fecha_hora_inicio, fecha_hora_fin, estado, notas_cliente')
              .gte('fecha_hora_inicio', startStr)
              .lte('fecha_hora_inicio', endStr)
              .order('fecha_hora_inicio');

            if (fetchErr) throw fetchErr;
            setWeeklyAppointments(data || []);
          } catch (err) {
            console.error('[Weekly View Error]:', err);
          } finally {
            setWeeklyLoading(false);
          }
        };
        fetchWeeklyData();
      }
    }, [viewMode, selectedDate, daysOfWeek]);

    return (
      <div className="animate-in slide-in-from-right-4 duration-500 flex flex-col h-[75vh]">
        <div className="flex justify-between items-end mb-6 shrink-0">
          <div>
            <h2 className="text-4xl font-black italic uppercase tracking-tighter">Supervisión <span className="text-[var(--primary)]">Maestra</span></h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Control de solapamiento y asignación</p>
          </div>
          <div className="flex bg-slate-100 rounded-2xl border-[3.5px] border-black overflow-hidden shadow-[4px_4px_0px_0px_black]">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-4 py-2 font-black text-[10px] uppercase transition-colors ${
                viewMode === 'daily' ? 'bg-black text-white' : 'hover:bg-slate-200 text-slate-800'
              }`}
            >
              Vista Diaria
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-4 py-2 font-black text-[10px] uppercase transition-colors border-l-[3px] border-black ${
                viewMode === 'weekly' ? 'bg-black text-white' : 'hover:bg-slate-200 text-slate-800'
              }`}
            >
              Vista Semanal
            </button>
          </div>
        </div>

        <div className="mb-4 flex gap-3 items-center">
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="bg-white border-[3px] border-black rounded-2xl px-4 py-3 font-black text-xs uppercase shadow-[4px_4px_0px_0px_black]"
          />
          <button onClick={onRefresh} className="px-4 py-3 bg-black text-white border-[3px] border-black rounded-2xl font-black text-[10px] uppercase shadow-[4px_4px_0px_0px_var(--primary)]">Recargar</button>
        </div>

        <div className="flex-1 bg-white border-[4px] border-black rounded-[3rem] shadow-[10px_10px_0px_0px_black] overflow-hidden flex flex-col">
          {viewMode === 'daily' ? (
            <>
              <div className="flex border-b-[4px] border-black bg-slate-50 shrink-0">
                <div className="w-20 border-r-[4px] border-black flex items-center justify-center bg-slate-200">
                  <Clock size={20} />
                </div>
                {groomerColumns.map((groomer, idx) => (
                  <div key={groomer.id} className={`flex-1 flex items-center justify-center py-3 ${idx < groomerColumns.length - 1 ? 'border-r-[4px] border-black' : ''}`}>
                    <div className="flex items-center gap-2">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${groomer.nombre_completo}`} alt={groomer.nombre_completo} className={`w-8 h-8 rounded-full border-2 border-black ${idx % 2 === 0 ? 'bg-indigo-100' : 'bg-emerald-100'}`} />
                      <span className="font-black italic uppercase text-lg">{groomer.nombre_completo}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar flex">
                <div className="w-20 border-r-[4px] border-black bg-slate-50 shrink-0 flex flex-col" style={{ height: '1152px' }}>
                  {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'].map((t) => (
                    <div key={t} className="h-24 border-b-2 border-black/10 flex items-start justify-center pt-2 shrink-0">
                      <span className="text-[10px] font-black opacity-40">{t}</span>
                    </div>
                  ))}
                </div>

                {groomerColumns.map((groomer, idx) => {
                  const appointmentsForGroomer = appointmentsByGroomer[groomer.id] || [];
                  
                  const getDailyAppStyle = (startStr, endStr) => {
                    const start = new Date(startStr);
                    const end = new Date(endStr);
                    
                    // Minutes since 08:00
                    const startMin = start.getHours() * 60 + start.getMinutes() - 8 * 60;
                    const durationMin = Math.max(30, (end.getTime() - start.getTime()) / 60000);
                    
                    // 96px per hour = 1.6px per minute
                    const top = startMin * 1.6;
                    const height = durationMin * 1.6;
                    
                    return {
                      top: `${top}px`,
                      height: `${height}px`
                    };
                  };

                  return (
                    <div 
                      key={groomer.id} 
                      className={`flex-1 relative bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] ${idx < groomerColumns.length - 1 ? 'border-r-[4px] border-black' : ''}`}
                      style={{ height: '1152px' }}
                    >
                      {appointmentsForGroomer.map((app) => {
                        const style = getDailyAppStyle(app.fecha_hora_inicio, app.fecha_hora_fin);
                        return (
                          <div 
                            key={app.id} 
                            style={style}
                            className={`absolute left-4 right-4 ${idx % 2 === 0 ? 'bg-amber-100' : 'bg-indigo-100'} border-[3px] border-black p-3 rounded-2xl shadow-[4px_4px_0px_0px_black] hover:scale-[1.02] transition-transform z-10 flex flex-col justify-between overflow-hidden`}
                          >
                            <div className="flex justify-between items-start gap-1">
                              <span className="font-black italic text-sm leading-none truncate">{app.mascota_nombre || 'Mascota'}</span>
                              <span className="text-[8px] bg-black text-white px-2 py-0.5 rounded font-black shrink-0">
                                {new Date(app.fecha_hora_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {' - '}
                                {new Date(app.fecha_hora_fin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <span className="text-[9px] font-bold uppercase text-slate-500 truncate">{app.servicio?.nombre || 'Servicio'}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <div className="flex border-b-[4px] border-black bg-slate-50 shrink-0">
                <div className="w-20 border-r-[4px] border-black flex items-center justify-center bg-slate-200">
                  <Clock size={20} />
                </div>
                {daysOfWeek.map((day, idx) => (
                  <div key={day.toDateString()} className={`flex-1 flex flex-col items-center justify-center py-3 ${idx < 6 ? 'border-r-[4px] border-black' : ''}`}>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                      {day.toLocaleDateString('es-ES', { weekday: 'short' })}
                    </span>
                    <span className="font-black italic text-lg mt-0.5">
                      {day.getDate()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar flex">
                <div className="w-20 border-r-[4px] border-black bg-slate-50 shrink-0 flex flex-col justify-center items-center">
                  <span className="text-[9px] font-black uppercase text-slate-400 rotate-90 whitespace-nowrap">Semana Activa</span>
                </div>

                {daysOfWeek.map((day, idx) => {
                  const dayStr = day.toISOString().slice(0, 10);
                  const dayAppointments = weeklyAppointments.filter((app) => {
                    const appDateStr = new Date(app.fecha_hora_inicio).toISOString().slice(0, 10);
                    return appDateStr === dayStr;
                  });

                  return (
                    <div key={day.toDateString()} className={`flex-1 p-3 space-y-3 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] min-h-[50vh] ${idx < 6 ? 'border-r-[4px] border-black' : ''}`}>
                      {weeklyLoading ? (
                        <div className="text-[8px] font-black uppercase text-slate-400 text-center animate-pulse">Cargando...</div>
                      ) : dayAppointments.length === 0 ? (
                        <div className="text-[8px] font-bold text-slate-300 uppercase text-center mt-10 italic">Sin turnos</div>
                      ) : (
                        dayAppointments.map((app) => {
                          const groomerName = groomers.find(g => g.id === app.groomer_id)?.nombre_completo || 'Groomer';
                          const serviceName = services.find(s => s.id === app.servicio_id)?.nombre || 'Servicio';
                          const start = new Date(app.fecha_hora_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                          return (
                            <div key={app.id} className="bg-white border-[3px] border-black p-2.5 rounded-xl shadow-[3px_3px_0px_0px_black] hover:scale-[1.02] transition-transform flex flex-col justify-between gap-1">
                              <div className="flex justify-between items-start gap-1">
                                <span className="font-black text-xs uppercase leading-none text-slate-800">{app.mascota_nombre || 'Mascota'}</span>
                                <span className="text-[8px] bg-black text-white px-1 py-0.5 rounded font-black tracking-tighter shrink-0">{start}</span>
                              </div>
                              <div className="text-[8px] font-bold text-slate-400 uppercase leading-none truncate">{serviceName}</div>
                              <div className="text-[7px] font-black text-indigo-500 uppercase tracking-wider leading-none mt-1 truncate">✂ {groomerName}</div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const currentView = (() => {
    if (activeTab === 'staff') return <AdminStaffMatrix />;
    if (activeTab === 'bloqueos') return <AdminBlockManager />;
    if (activeTab === 'control') return <GroomingModule />;
    return <AdminMasterCalendar />;
  })();

  return (
    <div className="flex flex-col space-y-6 pb-10">
      {(loading || error) && (
        <div className="space-y-3 mb-4">
          {loading && <div className="bg-white border-[3px] border-black rounded-2xl px-4 py-3 font-black uppercase text-[10px] tracking-widest shadow-[4px_4px_0px_0px_black]">Cargando agenda del administrador...</div>}
          {error && (
            <div className="bg-amber-50 border-[3px] border-black rounded-2xl px-4 py-3 font-black uppercase text-[10px] tracking-widest shadow-[4px_4px_0px_0px_black] flex items-center gap-2">
              <AlertTriangle size={16} /> {error.message || 'Se detectó un problema al cargar la agenda'}
            </div>
          )}
        </div>
      )}



      <div className="flex-1">
        {currentView}
      </div>
    </div>
  );
};

export default AdminAgendaCrudPanel;

AdminAgendaCrudPanel.propTypes = {
  activeTab: PropTypes.string.isRequired,
  agendaData: PropTypes.shape({
    services: PropTypes.array,
    modifiers: PropTypes.array,
    groomers: PropTypes.array,
    schedules: PropTypes.array,
    exceptions: PropTypes.array,
    appointments: PropTypes.array,
    reservations: PropTypes.array,
    pets: PropTypes.array,
  }),
  loading: PropTypes.bool,
  error: PropTypes.any,
  selectedDate: PropTypes.string.isRequired,
  setSelectedDate: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  currentUser: PropTypes.shape({
    id: PropTypes.string,
    rol: PropTypes.string,
  }),
};
