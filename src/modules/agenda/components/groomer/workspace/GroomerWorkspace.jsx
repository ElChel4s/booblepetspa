import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Play, Pause, Box, AlertTriangle, Sparkles, X, Package } from 'lucide-react';
import { useToast } from '../../../../../store/ToastContext';
import { supabase } from '../../../../../api/supabase';

// Import components
import GroomerHeader from './GroomerHeader';
import PatientClinicalInfo from './PatientClinicalInfo';
import DiagnosticsTriage from './DiagnosticsTriage';
import ExtraChargesSelector from './ExtraChargesSelector';
import GroomerChecklist from './GroomerChecklist';
import GroomerCheckout from './GroomerCheckout';
import InsumosStockModal from './InsumosStockModal';

// Import services
import {
  addCitaModifier,
  removeCitaModifier,
  getInsumosList,
  withdrawInsumo,
  saveAndFinishFicha,
  toggleChecklistItem,
  addGroomingPhoto,
  removeGroomingPhoto,
  startAppointment,
  pauseAppointment
} from '../../../services/groomerAgendaService';

export default function GroomerWorkspace({
  activeApp,
  availableModifiers,
  onRefresh,
  currentUser,
  savingParent,
  onMinimize
}) {
  const { showToast } = useToast();

  // Timer State
  const [activeTimer, setActiveTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(activeApp?.estado === 'pausada');

  // Diagnostics and Ficha Form State
  const [fichaForm, setFichaForm] = useState({
    nudos: false,
    pulgas: false,
    heridas: false,
    peso: '',
    temperamento: '',
    observaciones_groomer: '',
    recomendaciones_post: '',
    foto_antes: null,
    foto_despues: null
  });

  // Modal State
  const [showInsumos, setShowInsumos] = useState(false);
  const [insumosList, setInsumosList] = useState([]);
  const [loadingInsumos, setLoadingInsumos] = useState(false);
  const [localSaving, setLocalSaving] = useState(false);
  const [sessionInsumos, setSessionInsumos] = useState([]);
  const [insumosUsados, setInsumosUsados] = useState([]);

  const saving = localSaving || savingParent;

  // Cargar receta por defecto y catálogo de insumos
  useEffect(() => {
    const fetchRecetaAndInsumos = async () => {
      if (!activeApp?.servicio_id || !supabase) return;

      try {
        // 1. Cargar receta del servicio
        const { data: recetaData, error: recetaError } = await supabase
          .from('recetas_insumos')
          .select(`
            producto_id,
            cantidad,
            productos (
              id,
              nombre,
              stock_actual
            )
          `)
          .eq('servicio_id', activeApp.servicio_id);

        if (!recetaError && recetaData) {
          const mapped = recetaData.map((item) => ({
            producto_id: item.producto_id,
            nombre: item.productos?.nombre || 'Insumo',
            cantidad: parseFloat(item.cantidad) || 1.0,
            stock_actual: item.productos?.stock_actual || 0,
            abrio_nuevo: false
          }));
          setInsumosUsados(mapped);
        } else {
          setInsumosUsados([]);
        }

        // 2. Pre-cargar catálogo completo de insumos
        const { data: catData, error: catError } = await getInsumosList();
        if (!catError && catData) {
          setInsumosList(catData);
        }
      } catch (err) {
        console.error('Error al cargar insumos iniciales:', err);
      }
    };

    fetchRecetaAndInsumos();
  }, [activeApp?.servicio_id]);

  const activeAppId = activeApp?.id;

  // Cargar orden de pasos de servicio para ordenar secuencialmente
  const [pasos, setPasos] = useState([]);
  useEffect(() => {
    const loadPasos = async () => {
      if (!activeApp?.servicio_id || !supabase) return;
      const { data } = await supabase
        .from('pasos_servicio')
        .select('tarea_id, orden')
        .eq('servicio_id', activeApp.servicio_id)
        .order('orden', { ascending: true });
      setPasos(data || []);
    };
    loadPasos();
  }, [activeApp?.servicio_id]);

  // Initialize Ficha Form from Active Appointment Details
  useEffect(() => {
    if (activeApp) {
      const ficha = activeApp.ficha || {};
      const fotos = activeApp.fotos || [];

      const beforePhoto = fotos.find((f) => f.tipo_momento === 'antes')?.url_foto || null;
      const afterPhoto = fotos.find((f) => f.tipo_momento === 'despues')?.url_foto || null;

      setFichaForm({
        nudos: !!ficha.estado_ingreso_nudos,
        pulgas: !!ficha.estado_ingreso_pulgas,
        heridas: !!ficha.estado_ingreso_heridas,
        peso: ficha.peso_actual || '',
        temperamento: ficha.temperamento_actual || activeApp.mascota?.temperamento || '',
        observaciones_groomer: ficha.observaciones_groomer || '',
        recomendaciones_post: ficha.recomendaciones_post || '',
        foto_antes: beforePhoto,
        foto_despues: afterPhoto
      });

      setIsPaused(activeApp.estado === 'pausada');
    }
  }, [activeAppId]);

  // Synchronized Timer Effect (matching GroomerFocusZone.jsx)
  useEffect(() => {
    if (!activeApp) return;

    const isRunning = activeApp.estado === 'en_proceso';

    const saved = localStorage.getItem(`groomer_timer_${activeApp.id}`);
    let parsed = saved ? parseInt(saved, 10) : 0;

    if (isRunning) {
      const lastActive = localStorage.getItem(`groomer_timer_last_active_${activeApp.id}`);
      if (lastActive) {
        const diff = Math.floor((Date.now() - parseInt(lastActive, 10)) / 1000);
        parsed += Math.max(0, diff);
      }
    }
    setActiveTimer(parsed);
  }, [activeApp]);

  // Clock Ticker Effect
  useEffect(() => {
    if (!activeApp || activeApp.estado !== 'en_proceso') return;

    const interval = setInterval(() => {
      setActiveTimer((prev) => {
        const next = prev + 1;
        localStorage.setItem(`groomer_timer_${activeApp.id}`, next.toString());
        localStorage.setItem(`groomer_timer_last_active_${activeApp.id}`, Date.now().toString());
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeApp]);

  // Pause Timer Cleanups
  useEffect(() => {
    if (activeApp && activeApp.estado !== 'en_proceso') {
      localStorage.removeItem(`groomer_timer_last_active_${activeApp.id}`);
    }
  }, [activeApp]);

  // Fetch Insumos when Modal Opens
  const handleOpenInsumos = async () => {
    setShowInsumos(true);
    setLoadingInsumos(true);
    const { data, error } = await getInsumosList();
    if (error) {
      showToast('Error al cargar insumos', 'error');
    } else {
      setInsumosList(data || []);
    }
    setLoadingInsumos(false);
  };

  // Toggle pause state
  const handlePauseToggle = async () => {
    if (!activeApp) return;
    setLocalSaving(true);

    if (isPaused) {
      const { error } = await startAppointment(activeApp.id);
      if (error) {
        showToast('Error al reanudar el servicio', 'error');
      } else {
        setIsPaused(false);
        showToast('Servicio reanudado', 'success');
        if (onRefresh) await onRefresh();
      }
    } else {
      const { error } = await pauseAppointment(activeApp.id);
      if (error) {
        showToast('Error al pausar el servicio', 'error');
      } else {
        setIsPaused(true);
        showToast('Servicio pausado', 'success');
        if (onRefresh) await onRefresh();
      }
    }
    setLocalSaving(false);
  };

  // Toggle checklist tasks
  const handleToggleTask = async (taskId, currentCompleted) => {
    setLocalSaving(true);
    const { error } = await toggleChecklistItem(taskId, !currentCompleted);
    if (error) {
      showToast('No se pudo actualizar la tarea', 'error');
    } else {
      if (onRefresh) await onRefresh();
    }
    setLocalSaving(false);
  };

  // Sugerir / Quitar recargos
  const handleToggleModifier = async (extra, isSelected) => {
    if (!activeApp) return;
    setLocalSaving(true);

    if (isSelected) {
      // Quitar modificador
      const applied = activeApp.modificadores_aplicados?.find((a) => a.modificador_id === extra.id || a.id === extra.id);
      const modId = applied?.modificador_id || extra.id;

      const { error } = await removeCitaModifier(activeApp.id, modId);
      if (error) {
        showToast('Error al remover recargo sugerido', 'error');
      } else {
        showToast('Recargo removido', 'success');
        if (onRefresh) await onRefresh();
      }
    } else {
      // Añadir modificador
      const { error } = await addCitaModifier(activeApp.id, extra.id, extra.precio_adicional || 0);
      if (error) {
        showToast('Error al sugerir recargo', 'error');
      } else {
        showToast('Recargo sugerido correctamente', 'success');

        // --- INSERCIÓN DE NOTIFICACIONES (JS-Only) ---
        if (supabase) {
          const mascotaNombre = activeApp.mascota?.nombre || 'la mascota';
          const serviceName = extra.criterio || 'Servicio Adicional';
          const duenoId = activeApp.mascota?.dueno_id;

          try {
            // 1. Notificar a Recepción
            await supabase.from('notificaciones').insert({
              rol_destino: 'recepcion',
              titulo: 'Nuevo Servicio Sugerido',
              mensaje: `El groomer sugirió "${serviceName}" para ${mascotaNombre}.`,
              tipo: 'cita',
              link_modulo: 'agenda'
            });

            // 2. Notificar al Administrador
            await supabase.from('notificaciones').insert({
              rol_destino: 'admin',
              titulo: 'Nuevo Servicio Sugerido',
              mensaje: `El groomer sugirió "${serviceName}" para ${mascotaNombre}.`,
              tipo: 'cita',
              link_modulo: 'agenda'
            });

            // 3. Notificar al Cliente
            if (duenoId) {
              await supabase.from('notificaciones').insert({
                usuario_id: duenoId,
                rol_destino: 'cliente',
                titulo: 'Sugerencia de Servicio Extra',
                mensaje: `El groomer recomienda añadir "${serviceName}" para ${mascotaNombre}. Revisa y aprueba la solicitud.`,
                tipo: 'cita',
                link_modulo: '/cliente/citas'
              });
            }
          } catch (notifErr) {
            console.error('[GroomerWorkspace] Error inserting suggestions notifications:', notifErr);
          }
        }
        // --- FIN INSERCIÓN ---

        if (onRefresh) await onRefresh();
      }
    }
    setLocalSaving(false);
  };

  // Registrar retiro de Insumo
  const handleWithdrawInsumo = async (insumo) => {
    if (!activeApp || !currentUser) return;
    setLocalSaving(true);

    const { error } = await withdrawInsumo(insumo.id, currentUser.id, activeApp.id);
    if (error) {
      showToast('Error al registrar retiro de insumo', 'error');
    } else {
      showToast(`📦 Insumo Registrado: -1 ${insumo.nombre} en Almacén Global`, 'success');
      // Decrementar stock localmente
      setInsumosList((prev) =>
        prev.map((item) =>
          item.id === insumo.id ? { ...item, stock_actual: Math.max(0, item.stock_actual - 1) } : item
        )
      );
      // Actualizar sesión
      setSessionInsumos((prev) => {
        const existing = prev.find(p => p.id === insumo.id);
        if (existing) return prev.map(p => p.id === insumo.id ? { ...p, qty: p.qty + 1 } : p);
        return [...prev, { id: insumo.id, nombre: insumo.nombre, qty: 1 }];
      });
    }
    setLocalSaving(false);
  };

  // Simular o subir foto (tomar foto)
  const handleTakePhoto = async (tipo) => {
    if (!activeApp) return;
    setLocalSaving(true);

    // Generar URL demo de Unsplash
    const randomUrl = `https://images.unsplash.com/photo-${tipo === 'antes' ? '1537151608804-ea2f1ea14a15' : '1552053831-71594a27632d'
      }?w=400&h=400&fit=crop`;

    const fichaId = activeApp.ficha?.id;
    if (fichaId) {
      const { error } = await addGroomingPhoto(fichaId, randomUrl, tipo);
      if (error) {
        showToast('Error al guardar evidencia fotográfica', 'error');
      } else {
        setFichaForm((prev) => ({ ...prev, [tipo === 'antes' ? 'foto_antes' : 'foto_despues']: randomUrl }));
        showToast(`Evidencia foto "${tipo}" guardada correctamente`, 'success');
        if (onRefresh) await onRefresh();
      }
    } else {
      // Si la ficha no está inicializada aún
      setFichaForm((prev) => ({ ...prev, [tipo === 'antes' ? 'foto_antes' : 'foto_despues']: randomUrl }));
    }
    setLocalSaving(false);
  };

  // Eliminar foto
  const handleRemovePhoto = async (tipo) => {
    if (!activeApp) return;
    setLocalSaving(true);

    const fotoRecord = activeApp.fotos?.find((f) => f.tipo_momento === tipo);
    if (fotoRecord) {
      const { error } = await removeGroomingPhoto(fotoRecord.id);
      if (error) {
        showToast('Error al eliminar evidencia fotográfica', 'error');
      } else {
        setFichaForm((prev) => ({ ...prev, [tipo === 'antes' ? 'foto_antes' : 'foto_despues']: null }));
        showToast(`Foto de evidencia "${tipo}" removida`, 'success');
        if (onRefresh) await onRefresh();
      }
    } else {
      setFichaForm((prev) => ({ ...prev, [tipo === 'antes' ? 'foto_antes' : 'foto_despues']: null }));
    }
    setLocalSaving(false);
  };

  // Finalizar servicio
  const handleFinalizarServicio = async () => {
    if (!activeApp) return;
    setLocalSaving(true);

    // Guardar diagnóstico e ingresos en fichas_grooming, guardar insumos manuales, y completar la cita
    const { error } = await saveAndFinishFicha(
      activeApp.id,
      {
        nudos: fichaForm.nudos,
        pulgas: fichaForm.pulgas,
        heridas: fichaForm.heridas,
        peso: fichaForm.peso,
        temperamento: fichaForm.temperamento,
        observaciones_groomer: fichaForm.observaciones_groomer,
        recomendaciones_post: fichaForm.recomendaciones_post,
        foto_despues: fichaForm.foto_despues
      },
      insumosUsados,
      currentUser?.id
    );

    if (error) {
      showToast('Error al finalizar el servicio', 'error');
    } else {
      // Limpiar timer de LocalStorage
      localStorage.removeItem(`groomer_timer_${activeApp.id}`);
      localStorage.removeItem(`groomer_timer_last_active_${activeApp.id}`);

      showToast('¡Servicio finalizado y enviado a caja!', 'success');
      if (onRefresh) await onRefresh();
    }
    setLocalSaving(false);
  };

  // Ordenar checklist en memoria según el orden de pasos_servicio
  const sortedChecklist = useMemo(() => {
    const list = [...(activeApp?.checklist || [])];
    if (pasos.length === 0) return list;

    const ordenMap = new Map(pasos.map((p) => [p.tarea_id, p.orden]));

    return list.sort((a, b) => {
      const ordA = ordenMap.has(a.tarea_id) ? ordenMap.get(a.tarea_id) : 999;
      const ordB = ordenMap.has(b.tarea_id) ? ordenMap.get(b.tarea_id) : 999;
      return ordA - ordB;
    });
  }, [activeApp?.checklist, pasos]);

  // Progress calculations
  const checklist = sortedChecklist;
  const completedCount = checklist.filter((t) => t.completado).length;
  const isReadyToCheckout = checklist.length > 0 && completedCount === checklist.length;

  return (
    <div className="fixed inset-0 z-[100] bg-[#f8fafc] font-['Nunito',sans-serif] flex flex-col overflow-hidden">

      {/* Header */}
      <GroomerHeader
        activeApp={activeApp}
        isPaused={isPaused}
        onPauseToggle={handlePauseToggle}
        activeTimer={activeTimer}
        onMinimize={onMinimize}
      />

      {/* Pausado Overlay */}
      {isPaused && (
        <div className="absolute inset-0 z-30 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-amber-400 p-8 rounded-3xl border-[6px] border-black shadow-[12px_12px_0px_0px_black] text-center max-w-sm mx-4">
            <Pause size={64} className="mx-auto mb-4 animate-bounce text-black" strokeWidth={3} />
            <h3 className="text-3xl font-black uppercase mb-2">Servicio Pausado</h3>
            <p className="font-bold mb-6 text-slate-900 leading-snug">
              El tiempo se ha detenido. Recepción ha sido notificada del estado actual de tu cabina.
            </p>
            <button
              type="button"
              disabled={saving}
              onClick={handlePauseToggle}
              className="w-full bg-black text-white border-[3px] border-black rounded-2xl py-3.5 font-black uppercase text-sm tracking-wider shadow-[4px_4px_0px_0px_white] active:translate-y-1 active:shadow-none hover:bg-slate-900 transition-all cursor-pointer"
            >
              Reanudar Servicio
            </button>
          </div>
        </div>
      )}

      {/* Workspace columns */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">

        {/* COLUMNA IZQUIERDA: DIAGNÓSTICO Y REGISTRO */}
        <div className="w-full lg:w-5/12 bg-white border-r-[4px] border-black p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6 pb-24">

          <PatientClinicalInfo activeApp={activeApp} />

          <h3 className="font-black text-xl uppercase border-b-[4px] border-black pb-2 flex items-center gap-2 mt-2">
            Diagnóstico de Ingreso
          </h3>

          <DiagnosticsTriage
            fichaForm={fichaForm}
            onChange={setFichaForm}
            onTakePhoto={handleTakePhoto}
            onRemovePhoto={handleRemovePhoto}
          />

          <ExtraChargesSelector
            availableModifiers={availableModifiers}
            appliedModifiers={activeApp?.modificadores_aplicados || []}
            onToggleModifier={handleToggleModifier}
            saving={saving}
          />

          {/* Sección de Insumos */}
          <div className="mt-4 bg-white border-[4px] border-black rounded-[2rem] p-5 shadow-[6px_6px_0px_0px_black] space-y-4">
            <h4 className="font-black text-lg uppercase flex items-center gap-2">
              <Package size={20} className="text-[var(--primary)]" /> Insumos en uso de estación
            </h4>

            {sessionInsumos.length > 0 ? (
              <div className="space-y-2">
                {sessionInsumos.map((ins) => (
                  <div key={ins.id} className="text-sm font-bold uppercase bg-slate-50 border-2 border-black p-2 rounded-xl flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 border border-black shrink-0" />
                    En uso: {ins.qty}x {ins.nombre}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-bold text-slate-400 uppercase">Aún no has abierto insumos nuevos en este turno.</p>
            )}

            <button
              type="button"
              onClick={handleOpenInsumos}
              className="w-full mt-2 py-3 bg-[var(--primary)] text-white border-[3px] border-black rounded-xl font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_black] active:translate-y-1 active:shadow-none hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_black] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              🍾 Abrir Nuevo Bote
            </button>
          </div>
        </div>

        {/* COLUMNA DERECHA: CHECKLIST Y CHECKOUT */}
        <div className="w-full lg:w-7/12 bg-slate-100 p-6 flex flex-col relative overflow-y-auto">
          {isReadyToCheckout ? (
            <GroomerCheckout
              fotoDespues={fichaForm.foto_despues}
              onTakePhoto={handleTakePhoto}
              onRemovePhoto={handleRemovePhoto}
              recommendations={fichaForm.recomendaciones_post}
              onRecommendationsChange={(text) => setFichaForm((prev) => ({ ...prev, recomendaciones_post: text }))}
              onSubmit={handleFinalizarServicio}
              saving={saving}
              insumosUsados={insumosUsados}
              setInsumosUsados={setInsumosUsados}
              insumosList={insumosList}
            />
          ) : (
            <GroomerChecklist
              checklist={checklist}
              onToggleTask={handleToggleTask}
              saving={saving}
            />
          )}
        </div>
      </div>

      {/* Modal Insumos (Overlay) */}
      <InsumosStockModal
        isOpen={showInsumos}
        onClose={() => setShowInsumos(false)}
        insumos={insumosList}
        onWithdraw={handleWithdrawInsumo}
        loading={loadingInsumos}
      />
    </div>
  );
}

GroomerWorkspace.propTypes = {
  activeApp: PropTypes.object,
  availableModifiers: PropTypes.array.isRequired,
  onRefresh: PropTypes.func.isRequired,
  currentUser: PropTypes.object,
  savingParent: PropTypes.bool,
  onMinimize: PropTypes.func,
};
