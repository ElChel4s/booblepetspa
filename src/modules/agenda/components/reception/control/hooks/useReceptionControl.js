import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../../../../../store/ToastContext';
import { useReceptionAlerts } from '../../../../../../store/ReceptionAlertContext';
import {
  getTodayCitas,
  getCitaModificadores,
  checkInCita,
  completeServiceCita,
  processCitaCheckout,
  getFacturasForReservations,
} from '../services/receptionControlService';

export const useReceptionControl = () => {
  const { showToast } = useToast();
  const { refetchAlerts } = useReceptionAlerts();

  const [citas, setCitas] = useState([]);
  const [modificadoresMap, setModificadoresMap] = useState({});
  const [facturadasReservaIds, setFacturadasReservaIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  // POS Checkout State
  const [checkoutData, setCheckoutData] = useState(null);
  const [billingForm, setBillingForm] = useState({ nit_ci: '', razon_social: '', metodo_pago: 'QR' });
  const [billingSaving, setBillingSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const citasRes = await getTodayCitas();
      if (citasRes.error) throw citasRes.error;

      const rawCitas = citasRes.data || [];
      const resIds = rawCitas.map(c => c.reserva_id).filter(Boolean);

      let facturas = [];
      if (resIds.length > 0) {
        const facturasRes = await getFacturasForReservations(resIds);
        if (facturasRes.error) throw facturasRes.error;
        facturas = facturasRes.data || [];
      }

      // Guardar IDs de reservas facturadas
      const facturadasSet = new Set(
        facturas.filter(f => f.reserva_id).map(f => f.reserva_id)
      );
      setFacturadasReservaIds(facturadasSet);

      // Cargar modificadores aplicados
      const citaIds = rawCitas.map(c => c.id);
      if (citaIds.length > 0) {
        const modsRes = await getCitaModificadores(citaIds);
        if (!modsRes.error) {
          const modsByCita = (modsRes.data || []).reduce((acc, m) => {
            if (!acc[m.cita_id]) acc[m.cita_id] = [];
            acc[m.cita_id].push({
              id: m.id,
              concepto: m.modificador?.criterio || 'Cargo extra',
              precio: Number(m.precio_aplicado || 0)
            });
            return acc;
          }, {});
          setModificadoresMap(modsByCita);
        }
      }

      setCitas(rawCitas);
    } catch (err) {
      console.error('[useReceptionControl] Error loading data:', err);
      showToast('Error al cargar la agenda de hoy', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
    // Refrescar cada 45 segundos
    const interval = setInterval(loadData, 45000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Dar Ingreso
  const handleDarIngreso = useCallback(async (citaId) => {
    const { error } = await checkInCita(citaId);
    if (error) {
      showToast('Error al dar ingreso a la mascota', 'error');
    } else {
      showToast('Mascota ingresada a estética 🐾', 'success');
      loadData();
      refetchAlerts(); // Sincronizar alertas globales
    }
  }, [loadData, showToast, refetchAlerts]);

  // Completar cita (simulación)
  const handleCompletarCita = useCallback(async (citaId) => {
    const { error } = await completeServiceCita(citaId);
    if (error) {
      showToast('Error al completar el servicio', 'error');
    } else {
      showToast('Servicio finalizado ✓ Mascota lista para salida', 'success');
      loadData();
    }
  }, [loadData, showToast]);

  // Abrir Checkout POS
  const handleAbrirCheckout = useCallback((cita) => {
    const mods = modificadoresMap[cita.id] || [];
    const basePrice = Number(cita.servicio?.precio_base || 0);
    const extraPrice = mods.reduce((acc, m) => acc + m.precio, 0);

    setCheckoutData({
      cita,
      recomendaciones_post: cita.ficha?.recomendaciones_post || null,
      modificadores_aplicados: mods,
      total_calculado: basePrice + extraPrice
    });

    setBillingForm({
      nit_ci: 'S/N',
      razon_social: cita.mascota?.dueno?.nombre_completo || 'Cliente General',
      metodo_pago: 'QR'
    });
  }, [modificadoresMap]);

  // Cerrar Checkout
  const handleCerrarCheckout = useCallback(() => {
    setCheckoutData(null);
  }, []);

  // Registrar Pago final en Supabase
  const handleFinalizarPago = useCallback(async () => {
    if (!checkoutData) return;
    setBillingSaving(true);
    
    const { error } = await processCitaCheckout({
      citaId: checkoutData.cita.id,
      reservaId: checkoutData.cita.reserva_id,
      clienteId: checkoutData.cita.mascota?.dueno?.id,
      nitCi: billingForm.nit_ci,
      razonSocial: billingForm.razon_social,
      metodoPago: billingForm.metodo_pago,
      montoTotal: checkoutData.total_calculado
    });

    setBillingSaving(false);

    if (error) {
      showToast('Error al procesar el pago: ' + error.message, 'error');
    } else {
      showToast('¡Checkout finalizado con éxito! 🧾💵', 'success');
      setCheckoutData(null);
      loadData();
    }
  }, [checkoutData, billingForm, showToast, loadData]);

  // Filtrar citas que aún no han sido cobradas hoy
  const activeCitas = citas.filter(c => !facturadasReservaIds.has(c.reserva_id));

  // Agrupar por columnas de flujo
  const citasEsperando = activeCitas.filter(c => c.estado === 'programada' || c.estado === 'en_espera');
  const citasEnProceso = activeCitas.filter(c => c.estado === 'en_proceso' || c.estado === 'pausada');
  const citasListas = activeCitas.filter(c => c.estado === 'completada');

  return {
    citasEsperando,
    citasEnProceso,
    citasListas,
    modificadoresMap,
    loading,
    checkoutData,
    billingForm,
    setBillingForm,
    billingSaving,
    handleDarIngreso,
    handleCompletarCita,
    handleAbrirCheckout,
    handleCerrarCheckout,
    handleFinalizarPago,
    refresh: loadData
  };
};
