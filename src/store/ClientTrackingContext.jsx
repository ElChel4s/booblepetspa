import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { supabase } from '../api/supabase';
import {
  getClientLoyaltyPoints,
  getActiveTrackingAppointment,
  getChecklistForFicha,
  getPasosServicio,
  getPendingModifiers,
  approveModifier,
  rejectModifier,
  createAuditLog,
  submitSatisfactionSurvey
} from '../modules/agenda/services/clientTrackingService';

const ClientTrackingContext = createContext(null);

export const useClientLiveTracking = () => {
  const context = useContext(ClientTrackingContext);
  if (!context) {
    throw new Error('useClientLiveTracking debe usarse dentro de un ClientTrackingProvider');
  }
  return context;
};

export const ClientTrackingProvider = ({ children }) => {
  const { currentUser, rolActual } = useAuth();
  const { showToast } = useToast();

  const [activeCita, setActiveCita] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [puntosLealtad, setPuntosLealtad] = useState(0);
  const [loading, setLoading] = useState(false);

  // Modales y vistas
  const [showLiveTrackingOverlay, setShowLiveTrackingOverlay] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [alertaExtra, setAlertaExtra] = useState(null);
  const [eventos, setEventos] = useState([]);

  // Evitar bucles en llamadas asíncronas
  const activeCitaIdRef = useRef(null);

  const refreshTracking = useCallback(async () => {
    if (!currentUser?.id || rolActual !== 'cliente') {
      setActiveCita(null);
      setChecklist([]);
      setAlertaExtra(null);
      return;
    }

    try {
      // 1. Cargar puntos de lealtad
      const pointsRes = await getClientLoyaltyPoints(currentUser.id);
      if (!pointsRes.error) {
        setPuntosLealtad(pointsRes.data);
      }

      // 2. Cargar cita activa
      const citaRes = await getActiveTrackingAppointment(currentUser.id);
      if (citaRes.error) {
        console.error('[ClientTrackingContext] Error loading active appointment:', citaRes.error);
        return;
      }

      const activeCitaData = citaRes.data;
      setActiveCita(activeCitaData);

      if (!activeCitaData) {
        setChecklist([]);
        setAlertaExtra(null);
        activeCitaIdRef.current = null;
        return;
      }

      const citaId = activeCitaData.id;
      activeCitaIdRef.current = citaId;

      // 3. Cargar checklist de la ficha si existe
      if (activeCitaData.ficha?.id) {
        const [checklistRes, pasosRes] = await Promise.all([
          getChecklistForFicha(activeCitaData.ficha.id),
          getPasosServicio(activeCitaData.servicio_id)
        ]);

        const rawChecklist = checklistRes.data || [];
        const pasosServicio = pasosRes.data || [];

        // Ordenar checklist según los pasos del servicio
        const sortedChecklist = [...rawChecklist].sort((a, b) => {
          const pasoA = pasosServicio.find(p => p.tarea_id === a.tarea_id);
          const pasoB = pasosServicio.find(p => p.tarea_id === b.tarea_id);

          const ordenA = pasoA ? pasoA.orden : 999;
          const ordenB = pasoB ? pasoB.orden : 999;

          return ordenA - ordenB;
        });

        // Dar formato secuencial (orden 1..N)
        const mappedChecklist = sortedChecklist.map((item, idx) => ({
          ...item,
          orden: idx + 1,
          nombre: item.tarea?.nombre || 'Paso de estética',
          // Mapeo básico de íconos según nombre del paso
          icon: getIconForTaskName(item.tarea?.nombre)
        }));

        setChecklist(mappedChecklist);

        // Generar feed de eventos del checklist
        const logs = [];
        // Evento inicial
        logs.push({
          id: 'start',
          hora: formatTime(new Date(activeCitaData.fecha_hora_inicio)),
          texto: `¡${activeCitaData.mascota?.nombre} ingresó a spa para ${activeCitaData.servicio?.nombre}! 🐾`
        });

        // Agregar los completados
        mappedChecklist.forEach(item => {
          if (item.completado) {
            logs.push({
              id: item.id,
              hora: 'Listo',
              texto: `Completado: ${item.nombre} ✅`
            });
          }
        });

        if (activeCitaData.estado === 'completada') {
          logs.push({
            id: 'complete',
            hora: 'Listo',
            texto: `¡${activeCitaData.mascota?.nombre} está listo y hermoso! ✨`
          });
        }

        // Mostrar el más reciente primero
        setEventos(logs.reverse());
      } else {
        setChecklist([]);
        setEventos([]);
      }

      // 4. Buscar modificadores pendientes
      const modsRes = await getPendingModifiers(citaId);
      const pendingMods = modsRes.data || [];
      if (pendingMods.length > 0) {
        const mod = pendingMods[0]; // Mostrar el primero
        const isExtraService = mod.modificador?.valor === 'Servicio Adicional';
        const serviceName = mod.modificador?.criterio || 'Servicio';
        const mascotaNombre = activeCitaData.mascota?.nombre || 'tu mascota';

        setAlertaExtra({
          id: mod.id,
          concepto: mod.concepto_snap || mod.modificador?.criterio || 'Tratamiento adicional recomendado',
          precio: Number(mod.precio_aplicado || mod.modificador?.precio_adicional || 0),
          tiempoExtra: Number(mod.modificador?.tiempo_extra_minutos || 0),
          evidencia: mod.url_evidencia || null,
          titulo: isExtraService ? 'Servicio Extra Sugerido' : 'Tratamiento Recomendado',
          mensaje: isExtraService
            ? `El groomer sugiere añadir el servicio adicional de "${serviceName}" para consentir y mejorar la sesión de ${mascotaNombre}. ¿Deseas aprobar este servicio adicional?`
            : `Hemos detectado una incidencia de tipo "${serviceName}" para ${mascotaNombre}. El groomer sugiere un tratamiento adicional para un mejor resultado.`
        });
      } else {
        setAlertaExtra(null);
      }

    } catch (err) {
      console.error('[ClientTrackingContext] refreshTracking error:', err);
    }
  }, [currentUser?.id, rolActual]);

  // Realtime Subscriptions
  useEffect(() => {
    if (!currentUser?.id || rolActual !== 'cliente' || !supabase) return;

    // Carga inicial
    setLoading(true);
    refreshTracking().finally(() => setLoading(false));

    // Crear canal de escucha
    const channel = supabase
      .channel(`client_live_tracking_${currentUser.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'citas' }, () => {
        refreshTracking();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checklist_seguimiento' }, () => {
        refreshTracking();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cita_modificadores_aplicados' }, () => {
        refreshTracking();
      })
      .subscribe();

    return () => {
      if (supabase && channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [currentUser?.id, rolActual, refreshTracking]);

  // Operaciones del cliente
  const handleApproveModifier = async (modifierId) => {
    if (!activeCita) return;
    try {
      const { error } = await approveModifier(modifierId);
      if (error) {
        showToast('Error al aprobar el tratamiento', 'error');
        return;
      }

      const concepto = alertaExtra?.concepto || 'Tratamiento';
      await createAuditLog(currentUser.id, `Aprobó tratamiento adicional: ${concepto} para cita ${activeCita.id}`);
      showToast('Tratamiento autorizado correctamente', 'success');
      setAlertaExtra(null);
      await refreshTracking();
    } catch (err) {
      console.error(err);
      showToast('Error al autorizar el tratamiento', 'error');
    }
  };

  const handleRejectModifier = async (modifierId) => {
    if (!activeCita) return;
    try {
      const { error } = await rejectModifier(modifierId);
      if (error) {
        showToast('Error al rechazar el tratamiento', 'error');
        return;
      }

      const concepto = alertaExtra?.concepto || 'Tratamiento';
      await createAuditLog(currentUser.id, `Rechazó tratamiento adicional: ${concepto} para cita ${activeCita.id}`);
      showToast('Tratamiento adicional rechazado', 'warning');
      setAlertaExtra(null);
      await refreshTracking();
    } catch (err) {
      console.error(err);
      showToast('Error al rechazar el tratamiento', 'error');
    }
  };

  const handleFinishSurvey = async (score, comment) => {
    if (!activeCita) return;
    try {
      const { error } = await submitSatisfactionSurvey(activeCita.id, score, comment);
      if (error) {
        showToast('Error al enviar la encuesta', 'error');
        return;
      }

      showToast('¡Gracias por tus comentarios!', 'success');
      setShowCheckoutModal(false);
      setShowLiveTrackingOverlay(false);

      // Esperar brevemente para refrescar y borrar la cita del tracking activo
      await refreshTracking();
    } catch (err) {
      console.error(err);
      showToast('Error al enviar la encuesta', 'error');
    }
  };

  return (
    <ClientTrackingContext.Provider
      value={{
        activeCita,
        checklist,
        puntosLealtad,
        loading,
        showLiveTrackingOverlay,
        setShowLiveTrackingOverlay,
        showCheckoutModal,
        setShowCheckoutModal,
        alertaExtra,
        setAlertaExtra,
        eventos,
        refreshTracking,
        handleApproveModifier,
        handleRejectModifier,
        handleFinishSurvey
      }}
    >
      {children}
    </ClientTrackingContext.Provider>
  );
};

ClientTrackingProvider.propTypes = {
  children: PropTypes.node.isRequired
};

// Helpers de utilidades
function getIconForTaskName(name = '') {
  const lower = name.toLowerCase();
  if (lower.includes('baño') || lower.includes('lavar')) return '🛁';
  if (lower.includes('secad') || lower.includes('turbina')) return '💨';
  if (lower.includes('corte') || lower.includes('estil') || lower.includes('tijera') || lower.includes('maquina')) return '✂️';
  if (lower.includes('cepill') || lower.includes('deslan')) return '🪮';
  if (lower.includes('uña') || lower.includes('garra')) return '💅';
  if (lower.includes('oido') || lower.includes('oreja')) return '👂';
  return '🐾';
}

function formatTime(date) {
  const h = date.getHours();
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}
