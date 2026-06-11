import { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { CalendarDays, Timer, FileText, CheckCircle2, Play, Sparkles, Clock, ChevronRight, Edit3 } from 'lucide-react';
import { useToast } from '../../../store/ToastContext';

import GroomerStats from '../components/groomer/GroomerStats';
import GroomerFocusZone from '../components/groomer/GroomerFocusZone';
import GroomerTimeline from '../components/groomer/GroomerTimeline';
import GroomerFichaModal from '../components/groomer/GroomerFichaModal';
import GroomerScheduleManager from '../components/groomer/GroomerScheduleManager';
import GroomerFinishModal from '../components/groomer/GroomerFinishModal';

import GroomerWorkspace from '../components/groomer/workspace/GroomerWorkspace';
import GroomerHistoryCard from '../components/groomer/workspace/GroomerHistoryCard';

import {
  finishAppointment,
  pauseAppointment,
  saveFicha,
  startAppointment,
  toggleChecklistItem,
  initFichaAndChecklist,
} from '../services/groomerAgendaService';

const GroomerAgendaView = ({ activeTab, agendaData, loading, currentUser, onRefresh, updateOptimistically }) => {
  const appointments = agendaData?.appointments || [];
  const schedules = agendaData?.schedules || [];
  const fichas = agendaData?.fichas || [];

  const [isWorkspaceMinimized, setIsWorkspaceMinimized] = useState(false);
  const [minimizedTimer, setMinimizedTimer] = useState(0);

  // Filter appointments assigned to this groomer
  const currentAppointments = useMemo(() => {
    return appointments.filter((app) => app.groomer_id === currentUser?.id);
  }, [appointments, currentUser?.id]);

  // Find currently active or paused appointment
  const activeAppointment = useMemo(() => {
    return currentAppointments.find((app) => ['en_proceso', 'pausada'].includes(app.estado)) || null;
  }, [currentAppointments]);

  // Next upcoming appointment (either en_espera or programada)
  const nextAppointment = useMemo(() => {
    if (activeAppointment) return null;
    const upcoming = currentAppointments.filter(
      (app) => ['en_espera', 'programada'].includes(app.estado)
    );
    const inLobby = upcoming.filter((app) => app.estado === 'en_espera');
    if (inLobby.length > 0) return inLobby[0];
    return upcoming[0] || null;
  }, [currentAppointments, activeAppointment]);

  const todaySchedules = useMemo(() => {
    return schedules.filter((schedule) => schedule.groomer_id === currentUser?.id);
  }, [schedules, currentUser?.id]);

  const todayFichas = useMemo(() => {
    return fichas.filter((ficha) =>
      currentAppointments.some((app) => app.id === ficha.cita_id)
    );
  }, [fichas, currentAppointments]);

  const { showToast } = useToast();
  const [fichaModalOpen, setFichaModalOpen] = useState(false);
  const [selectedCita, setSelectedCita] = useState(null);
  const [finishingCitaId, setFinishingCitaId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [viewingHistory, setViewingHistory] = useState(null);

  const runAppointmentAction = async (runner, successMessage) => {
    setSaving(true);
    const result = await runner();
    if (result?.error) {
      showToast(result.error.message || 'No se pudo completar la acción', 'error');
    } else {
      showToast(successMessage, 'success');
      if (onRefresh) await onRefresh();
    }
    setSaving(false);
  };

  const handleStart = async (citaId) => {
    setSaving(true);
    // Optimistic Update
    if (updateOptimistically) {
      updateOptimistically(prev => {
        const newAppointments = prev.appointments.map(app => 
          app.id === citaId ? { ...app, estado: 'en_proceso' } : app
        );
        return { ...prev, appointments: newAppointments };
      });
    }

    const startRes = await startAppointment(citaId);
    if (startRes.error) {
      showToast(startRes.error.message || 'No se pudo iniciar el servicio', 'error');
      if (onRefresh) await onRefresh(); // Revert on error
      setSaving(false);
      return;
    }

    const initRes = await initFichaAndChecklist(citaId);
    if (initRes.error) {
      showToast('Servicio iniciado, pero hubo un problema al preparar la ficha y el checklist', 'warning');
    } else {
      showToast('Servicio iniciado y checklist preparado', 'success');
    }

    if (onRefresh) await onRefresh();
    setSaving(false);
  };

  const handlePause = async (citaId) => {
    setSaving(true);
    if (updateOptimistically) {
      updateOptimistically(prev => ({
        ...prev,
        appointments: prev.appointments.map(app => app.id === citaId ? { ...app, estado: 'pausada' } : app)
      }));
    }
    const res = await pauseAppointment(citaId);
    if (res?.error) {
      showToast(res.error.message || 'No se pudo pausar', 'error');
      if (onRefresh) await onRefresh();
    } else {
      showToast('Servicio pausado', 'success');
      if (onRefresh) await onRefresh();
    }
    setSaving(false);
  };

  const handleFinish = (citaId) => {
    setFinishingCitaId(citaId);
  };

  const activeAppForModal = finishingCitaId 
    ? currentAppointments.find(a => a.id === finishingCitaId) 
    : null;

  const handleOpenFicha = (cita) => {
    setSelectedCita(cita);
    setFichaModalOpen(true);
  };

  const handleSaveFicha = async (fichaForm) => {
    if (!selectedCita) return;
    await runAppointmentAction(
      () => saveFicha({ ...fichaForm, cita_id: selectedCita.id }),
      'Ficha de grooming guardada correctamente'
    );
    setFichaModalOpen(false);
  };

  const handleToggleChecklistItem = async (itemId, currentCompleted) => {
    // No bloqueamos todo con setSaving(true) para checklist, para que sea instantáneo y no moleste
    const newValue = !currentCompleted;
    if (updateOptimistically) {
      updateOptimistically(prev => {
        const newAppointments = prev.appointments.map(app => {
          if (!app.checklist) return app;
          const newChecklist = app.checklist.map(c => c.id === itemId ? { ...c, completado: newValue } : c);
          return { ...app, checklist: newChecklist };
        });
        return { ...prev, appointments: newAppointments };
      });
    }

    const result = await toggleChecklistItem(itemId, newValue);
    if (result.error) {
      showToast('No se pudo actualizar la tarea', 'error');
      if (onRefresh) await onRefresh();
    } else {
      // Optamos por no hacer toast en checklist para no hacer spam visual, 
      // y no recargamos de inmediato para mantener la rapidez.
    }
  };

  if (viewingHistory) {
    return (
      <GroomerHistoryCard
        appointment={viewingHistory}
        onClose={() => setViewingHistory(null)}
      />
    );
  }

  const serviceModifiers = useMemo(() => {
    if (!activeAppointment) return [];
    const dynamicRuleCategories = ['Tamaño', 'Temperamento', 'Estado Pelaje', 'Pelaje', 'Alergias', 'Comportamiento'];
    return (agendaData?.modifiers || []).filter(
      (mod) => (!mod.servicio_id || mod.servicio_id === activeAppointment.servicio_id) &&
               !dynamicRuleCategories.includes(mod.valor)
    );
  }, [agendaData?.modifiers, activeAppointment]);

  // Reset minimized state if active appointment goes away
  useEffect(() => {
    if (!activeAppointment) {
      setIsWorkspaceMinimized(false);
    }
  }, [activeAppointment]);

  // Sync and tick minimized timer
  useEffect(() => {
    if (!activeAppointment || !isWorkspaceMinimized) return;

    const isRunning = activeAppointment.estado === 'en_proceso';
    const saved = localStorage.getItem(`groomer_timer_${activeAppointment.id}`);
    let parsed = saved ? parseInt(saved, 10) : 0;

    if (isRunning) {
      const lastActive = localStorage.getItem(`groomer_timer_last_active_${activeAppointment.id}`);
      if (lastActive) {
        const diff = Math.floor((Date.now() - parseInt(lastActive, 10)) / 1000);
        parsed += Math.max(0, diff);
      }
    }
    setMinimizedTimer(parsed);

    if (!isRunning) return;

    const interval = setInterval(() => {
      setMinimizedTimer((prev) => {
        const next = prev + 1;
        localStorage.setItem(`groomer_timer_${activeAppointment.id}`, next.toString());
        localStorage.setItem(`groomer_timer_last_active_${activeAppointment.id}`, Date.now().toString());
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeAppointment, isWorkspaceMinimized]);

  const formatTimerValue = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (activeAppointment && !isWorkspaceMinimized) {
    return (
      <GroomerWorkspace
        activeApp={activeAppointment}
        availableModifiers={serviceModifiers}
        onRefresh={onRefresh}
        currentUser={currentUser}
        savingParent={saving}
        onMinimize={() => setIsWorkspaceMinimized(true)}
      />
    );
  }

  let title = 'Mis turnos';
  if (activeTab === 'horario') title = 'Horario base';
  if (activeTab === 'fichas') title = 'Fichas activas';

  return (
    <div className="space-y-6">
      {/* Pattern header details */}
      <div className="flex justify-between items-center bg-white border-[4px] border-black p-4 rounded-3xl shadow-[6px_6px_0px_0px_black] z-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-200 rounded-[1.2rem] border-[4px] border-black overflow-hidden shadow-[4px_4px_0px_0px_black]">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.nombre_completo || 'Groomer'}`}
              alt="Groomer"
              className="scale-110 translate-y-1"
            />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black italic uppercase leading-none tracking-tighter">
              {currentUser?.nombre_completo || 'Groomer'}
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
              Estación de Grooming
            </p>
          </div>
        </div>
        <div className="bg-black text-[var(--secondary)] px-4 py-2 rounded-xl border-[3px] border-black shadow-[4px_4px_0px_0px_var(--primary)] text-sm md:text-base font-black tabular-nums tracking-tighter italic">
          Groomer
        </div>
      </div>



      {/* Stats Counter grid */}
      <GroomerStats
        totalAppointments={currentAppointments.length}
        inProgressCount={currentAppointments.filter((app) => app.estado === 'en_proceso').length}
        schedulesCount={todaySchedules.length}
        fichasCount={todayFichas.length}
      />

      {/* Conditional views depending on the active tab */}
      {activeTab === 'turnos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side: Active focus task + Rest of day timeline */}
          <div className="lg:col-span-2 space-y-6">
            {activeAppointment && (
              <GroomerFocusZone
                activeApp={activeAppointment}
                onStart={handleStart}
                onPause={handlePause}
                onFinish={handleFinish}
                saving={saving}
              />
            )}

            <div className="bg-white border-[4px] border-black p-6 md:p-8 rounded-[3rem] shadow-[10px_10px_0px_0px_black]">
              <GroomerTimeline
                appointments={currentAppointments}
                activeApp={activeAppointment}
                onStart={handleStart}
                onOpenFicha={handleOpenFicha}
                saving={saving}
              />
            </div>
          </div>

          {/* Right Side: Quick Diagnostic details of the Active Focus task OR Next Up */}
          <div className="space-y-6">
            {activeAppointment ? (
              <>
                <div className="bg-white border-[4px] border-black p-6 rounded-[3rem] shadow-[10px_10px_0px_0px_black] space-y-4">
                  <h4 className="text-xl font-black italic uppercase">Ficha Clínica</h4>
                  <div>
                    <p className="font-black uppercase text-sm">
                      {activeAppointment.mascota?.nombre || activeAppointment.mascota_nombre || 'Sin mascota'}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {activeAppointment.servicio?.nombre || 'Servicio'}
                    </p>
                  </div>
                  <div className="space-y-2 text-[10px] font-bold text-slate-500 uppercase">
                    <p>Raza: {activeAppointment.mascota?.raza || 'No registrada'}</p>
                    <p>Tamaño: {activeAppointment.mascota?.tamano || 'No registrado'}</p>
                    <p>Notas: {activeAppointment.notes_cliente || activeAppointment.notas_cliente || 'Sin notas del cliente'}</p>
                  </div>
                  {activeAppointment.modificadores_aplicados?.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {activeAppointment.modificadores_aplicados.map((mod) => (
                        <span
                          key={mod.id}
                          className="px-2 py-1 rounded-md border-2 border-black bg-slate-100 font-black text-[8px] uppercase tracking-wider"
                        >
                          {mod.criterio}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick checklist summary */}
                <div className="bg-white border-[4px] border-black p-6 rounded-[3rem] shadow-[10px_10px_0px_0px_black] space-y-4">
                  <h4 className="text-xl font-black italic uppercase">Checklist Clínico</h4>
                  {activeAppointment?.checklist?.length ? (
                    <div className="space-y-2">
                      {activeAppointment.checklist.map((item) => (
                        <button
                          key={item.id}
                          disabled={saving}
                          onClick={() => handleToggleChecklistItem(item.id, item.completado)}
                          className="w-full text-left flex items-start gap-3 border-2 border-black rounded-2xl p-3 bg-slate-50 hover:bg-slate-100 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all shadow-[2px_2px_0px_0px_black] cursor-pointer"
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded-full border-2 border-black mt-0.5 shrink-0 transition-colors ${
                              item.completado ? 'bg-emerald-400' : 'bg-rose-400'
                            }`}
                          />
                          <div>
                            <p className="font-black uppercase text-[10px]">{item.tarea?.nombre || 'Tarea'}</p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">
                              {item.observacion_item || 'Presiona para marcar como listo'}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-slate-500">
                      No hay checklist asignado para el servicio activo.
                    </p>
                  )}
                </div>
              </>
            ) : nextAppointment ? (
              <div className="bg-white border-[4px] border-black p-6 rounded-[3rem] shadow-[10px_10px_0px_0px_black] space-y-5 animate-in slide-in-from-bottom duration-300">
                <div className="flex items-center justify-between border-b-2 border-black/10 pb-3">
                  <span className="text-[9px] font-black uppercase tracking-widest bg-amber-400 text-black px-3 py-1 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_black]">
                    Siguiente Servicio
                  </span>
                  {nextAppointment.estado === 'en_espera' && (
                    <span className="text-[9px] font-black uppercase text-emerald-600 animate-pulse">
                      ¡Listo en Lobby!
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-3xl font-black italic uppercase leading-none truncate">
                    {nextAppointment.mascota?.nombre || nextAppointment.mascota_nombre || 'Sin Mascota'}
                  </h4>
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1.5">
                    {nextAppointment.servicio?.nombre || 'Grooming'}
                  </p>
                </div>
                <div className="space-y-2 text-[10px] font-bold text-slate-500 uppercase">
                  <p>
                    Hora estimada:{' '}
                    <span className="font-black text-black">
                      {new Date(nextAppointment.fecha_hora_inicio).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </p>
                  <p>
                    Raza:{' '}
                    <span className="font-black text-black">{nextAppointment.mascota?.raza || 'No registrada'}</span>
                  </p>
                  <p>
                    Tamaño:{' '}
                    <span className="font-black text-black">{nextAppointment.mascota?.tamano || 'No registrado'}</span>
                  </p>
                  {nextAppointment.notas_cliente && (
                    <div className="bg-slate-50 border-2 border-black p-3 rounded-2xl text-[9px] mt-2">
                      <span className="font-black text-slate-400 block mb-1">Notas Cliente:</span>
                      <span className="text-slate-700 font-bold leading-normal">{nextAppointment.notas_cliente}</span>
                    </div>
                  )}
                </div>
                <button
                  disabled={saving}
                  onClick={() => handleStart(nextAppointment.id)}
                  className="w-full bg-[var(--primary)] text-white border-[3px] border-black py-4 rounded-[2rem] font-black text-xs uppercase shadow-[4px_4px_0px_0px_black] hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_black] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
                >
                  <Play size={16} fill="currentColor" /> Comenzar Servicio
                </button>
              </div>
            ) : (
              <div className="bg-emerald-50 border-[4px] border-emerald-500 p-6 rounded-[3rem] shadow-[10px_10px_0px_0px_black] text-center space-y-4 py-8 animate-in slide-in-from-bottom duration-300">
                <div className="text-4xl">🎉</div>
                <h4 className="text-xl font-black uppercase text-emerald-800 italic">¡Todo al día!</h4>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-relaxed">
                  No tienes más turnos pendientes por iniciar en tu agenda de hoy.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'horario' && (
        <GroomerScheduleManager
          currentUser={currentUser}
          schedules={todaySchedules}
          onRefresh={onRefresh}
        />
      )}

      {activeTab === 'fichas' && (
        <div className="space-y-6">
          {todayFichas.length === 0 ? (
            <div className="bg-white border-[4px] border-black p-12 rounded-[3rem] shadow-[10px_10px_0px_0px_black] text-center space-y-4">
              <div className="text-4xl">📋</div>
              <h3 className="text-xl font-black uppercase italic">No hay fichas registradas hoy</h3>
              <p className="text-xs font-bold text-slate-500 max-w-md mx-auto uppercase tracking-wider">
                Aún no has completado ninguna ficha clínica para tus turnos de hoy. Cuando finalices un servicio y completes su ficha, aparecerá aquí.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {todayFichas.map((ficha) => {
                const cita = currentAppointments.find((app) => app.id === ficha.cita_id);
                if (!cita) return null;

                return (
                  <div
                    key={ficha.id}
                    className="bg-white border-[4px] border-black p-6 rounded-[3rem] shadow-[10px_10px_0px_0px_black] hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_black] transition-all duration-200 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start border-b-2 border-black/10 pb-3">
                        <div>
                          <h4 className="text-2xl font-black uppercase italic leading-none">
                            {cita.mascota?.nombre || cita.mascota_nombre || 'Mascota'}
                          </h4>
                          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">
                            {cita.servicio?.nombre || 'Grooming'}
                          </p>
                        </div>
                        <span className="bg-black text-[var(--secondary)] text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_var(--primary)] leading-none flex items-center justify-center">
                          {new Date(cita.fecha_hora_inicio).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500 uppercase">
                        <p>
                          Raza: <span className="font-black text-black">{cita.mascota?.raza || 'No reg.'}</span>
                        </p>
                        <p>
                          Peso:{' '}
                          <span className="font-black text-black">
                            {ficha.peso_actual ? `${ficha.peso_actual} kg` : 'No reg.'}
                          </span>
                        </p>
                        <p>
                          Suciedad: <span className="font-black text-black">{ficha.nivel_suciedad || 'No reg.'}</span>
                        </p>
                        <p>
                          Temperamento:{' '}
                          <span className="font-black text-black">{ficha.temperamento_actual || 'No reg.'}</span>
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1.5 py-1">
                        <span
                          className={`px-2 py-1 rounded border-2 border-black font-black text-[8px] uppercase tracking-wider ${
                            ficha.estado_ingreso_nudos ? 'bg-rose-100 text-rose-700' : 'bg-slate-50 text-slate-400 border-slate-200'
                          }`}
                        >
                          Nudos: {ficha.estado_ingreso_nudos ? 'Sí' : 'No'}
                        </span>
                        <span
                          className={`px-2 py-1 rounded border-2 border-black font-black text-[8px] uppercase tracking-wider ${
                            ficha.estado_ingreso_pulgas ? 'bg-rose-100 text-rose-700' : 'bg-slate-50 text-slate-400 border-slate-200'
                          }`}
                        >
                          Pulgas: {ficha.estado_ingreso_pulgas ? 'Sí' : 'No'}
                        </span>
                        <span
                          className={`px-2 py-1 rounded border-2 border-black font-black text-[8px] uppercase tracking-wider ${
                            ficha.estado_ingreso_heridas ? 'bg-rose-100 text-rose-700' : 'bg-slate-50 text-slate-400 border-slate-200'
                          }`}
                        >
                          Heridas: {ficha.estado_ingreso_heridas ? 'Sí' : 'No'}
                        </span>
                      </div>

                      {ficha.observaciones_groomer && (
                        <div className="bg-slate-50 border-2 border-black p-3 rounded-2xl text-[10px]">
                          <span className="font-black uppercase block text-slate-400 mb-1">Observaciones:</span>
                          <p className="font-bold text-slate-700 leading-normal uppercase">
                            {ficha.observaciones_groomer}
                          </p>
                        </div>
                      )}

                      {ficha.recomendaciones_post && (
                        <div className="bg-slate-50 border-2 border-black p-3 rounded-2xl text-[10px]">
                          <span className="font-black uppercase block text-slate-400 mb-1">Recomendaciones:</span>
                          <p className="font-bold text-slate-700 leading-normal uppercase">
                            {ficha.recomendaciones_post}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-2 w-full">
                      <button
                        onClick={() => setViewingHistory(cita)}
                        className="flex-grow bg-black text-white hover:bg-slate-800 border-2 border-black py-2.5 rounded-xl font-black text-[10px] uppercase shadow-[3px_3px_0px_0px_black] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_black] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FileText size={12} /> Ver Bitácora
                      </button>
                      <button
                        onClick={() => handleOpenFicha(cita)}
                        className="flex-grow bg-white hover:bg-slate-50 text-black border-2 border-black py-2.5 rounded-xl font-black text-[10px] uppercase shadow-[3px_3px_0px_0px_black] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_black] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 size={12} /> Editar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Horario/Bloques Base summary card at bottom */}
      <div className="bg-white border-[4px] border-black p-6 md:p-8 rounded-[3rem] shadow-[10px_10px_0px_0px_black] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl md:text-2xl font-black italic uppercase mb-1">{title}</h3>
          <p className="text-xs md:text-sm font-medium text-slate-500">
            {loading
              ? 'Cargando información base...'
              : `Tienes ${todaySchedules.length} bloque(s) de horario asignado(s) y ${todayFichas.length} ficha(s) clínica(s) registradas.`}
          </p>
        </div>
        {loading && (
          <div className="text-xs font-black uppercase text-slate-400 flex items-center gap-2">
            <Timer size={12} /> Sincronizando...
          </div>
        )}
      </div>

      <GroomerFichaModal
        isOpen={fichaModalOpen}
        onClose={() => setFichaModalOpen(false)}
        cita={selectedCita}
        fichas={fichas}
        onSubmit={handleSaveFicha}
        saving={saving}
      />

      <GroomerFinishModal
        isOpen={!!finishingCitaId}
        onClose={() => setFinishingCitaId(null)}
        activeApp={activeAppForModal}
        currentUser={currentUser}
        onRefresh={onRefresh}
        updateOptimistically={updateOptimistically}
      />

      {/* Minimized Workspace Floating Bar */}
      {activeAppointment && isWorkspaceMinimized && (
        <div className="fixed bottom-6 right-6 left-6 md:left-auto md:w-[450px] z-[99] bg-amber-100 border-[3.5px] border-black p-4 rounded-[2rem] shadow-[6px_6px_0px_0px_black] flex items-center justify-between animate-in slide-in-from-bottom-8 duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-full border-2 border-black bg-white overflow-hidden shrink-0 flex items-center justify-center">
              {activeAppointment.mascota?.foto_perfil_url ? (
                <img src={activeAppointment.mascota.foto_perfil_url} alt="Mascota" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">🐾</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black text-amber-700 uppercase tracking-wider leading-none mb-1">
                Servicio en Curso (Minimizado)
              </p>
              <h4 className="font-black text-sm uppercase text-black leading-none truncate">
                {activeAppointment.mascota?.nombre || activeAppointment.mascota_nombre || 'Mascota'}
              </h4>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[8px] font-bold text-slate-500 uppercase truncate">
                  {activeAppointment.servicio?.nombre || 'Grooming'}
                </span>
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0" />
                <div className="flex items-center gap-1 text-[9px] font-mono font-black text-amber-800 shrink-0">
                  <Clock size={10} />
                  <span>{formatTimerValue(minimizedTimer)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setIsWorkspaceMinimized(false)}
            className="shrink-0 bg-black text-white hover:bg-slate-800 border-[3px] border-black px-4 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-[3px_3px_0px_0px_white] active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1.5 cursor-pointer ml-4"
          >
            Maximizar
          </button>
        </div>
      )}
    </div>
  );
};

GroomerAgendaView.propTypes = {
  activeTab: PropTypes.string.isRequired,
  agendaData: PropTypes.shape({
    appointments: PropTypes.array,
    schedules: PropTypes.array,
    fichas: PropTypes.array,
  }),
  loading: PropTypes.bool,
  currentUser: PropTypes.shape({
    id: PropTypes.string,
    nombre_completo: PropTypes.string,
  }),
  onRefresh: PropTypes.func,
  updateOptimistically: PropTypes.func,
};

export default GroomerAgendaView;