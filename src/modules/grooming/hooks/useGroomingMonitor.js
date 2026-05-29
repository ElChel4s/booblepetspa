import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../../store/ToastContext';
import {
  getActiveCitas,
  getActiveGroomers,
  getFichaGrooming,
  getCompletedTodayCitas,
  reassignCita,
  approveTriageAlert,
} from '../services/groomingMonitorService';

/**
 * Hook central del monitor de grooming.
 * Carga groomers, citas activas y completadas.
 * Expone lógica de drag & drop, ficha modal y aprobación de alertas.
 */
export const useGroomingMonitor = () => {
  const { showToast } = useToast();

  const [groomers, setGroomers] = useState([]);
  const [citas, setCitas] = useState([]);
  const [completedToday, setCompletedToday] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal de auditoría
  const [selectedFicha, setSelectedFicha] = useState(null);
  const [loadingFicha, setLoadingFicha] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [groomersRes, citasRes, completedRes] = await Promise.all([
      getActiveGroomers(),
      getActiveCitas(),
      getCompletedTodayCitas(),
    ]);

    if (!groomersRes.error) setGroomers(groomersRes.data || []);
    if (!citasRes.error) setCitas(citasRes.data || []);
    if (!completedRes.error) setCompletedToday(completedRes.data || []);

    if (groomersRes.error || citasRes.error) {
      showToast('Error al cargar datos del monitor', 'error');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    // Refresco cada 60 segundos
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  /** Abre modal con ficha de grooming de una cita */
  const openFicha = useCallback(async (citaId, displayInfo) => {
    setLoadingFicha(true);
    setSelectedFicha(null);
    const { data, error } = await getFichaGrooming(citaId);
    setLoadingFicha(false);
    if (error) {
      showToast('No se pudo cargar la ficha', 'error');
      return;
    }
    setSelectedFicha({ ...displayInfo, ficha: data });
  }, []);

  const closeFicha = () => setSelectedFicha(null);

  /** Drag & Drop: reasignar cita a otro groomer */
  const handleDrop = useCallback(async (citaId, newGroomerId) => {
    // Optimistic update
    setCitas((prev) =>
      prev.map((c) => (c.id === citaId ? { ...c, groomer_id: newGroomerId } : c))
    );
    const { error } = await reassignCita(citaId, newGroomerId);
    if (error) {
      showToast('Error al reasignar la cita', 'error');
      loadData(); // Revertir con datos reales
    } else {
      showToast('Cita reasignada correctamente', 'success');
    }
  }, [loadData]);

  /** Aprueba un recargo de triage en la base de datos */
  const approveAlert = useCallback(async (citaId, tipoAlert, precioSugerido) => {
    const { error } = await approveTriageAlert(citaId, tipoAlert, precioSugerido);
    if (error) {
      showToast('Error al aprobar el recargo: ' + error.message, 'error');
    } else {
      showToast('Recargo aprobado y aplicado a la cita', 'success');
      loadData(); // Recargar datos frescos
    }
  }, [loadData]);

  // Estadísticas del día
  const statsToday = {
    completados: completedToday.length,
    retrasados: citas.filter((c) => new Date(c.fecha_hora_fin) < new Date()).length,
    enProceso: citas.filter((c) => c.estado === 'en_proceso').length,
  };

  return {
    groomers,
    citas,
    completedToday,
    loading,
    selectedFicha,
    loadingFicha,
    statsToday,
    openFicha,
    closeFicha,
    handleDrop,
    approveAlert,
    refresh: loadData,
  };
};
