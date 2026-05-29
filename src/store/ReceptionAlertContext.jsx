import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from './AuthContext';
import { supabase } from '../api/supabase';

const ReceptionAlertContext = createContext();

export const ReceptionAlertProvider = ({ children }) => {
  const { rolActual, isAuthenticated } = useAuth();
  
  const [alertaActiva, setAlertaActiva] = useState(null);
  const [alertasPendientes, setAlertasPendientes] = useState([]);
  const [rawAlerts, setRawAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  const fetchAlerts = useCallback(async () => {
    if (!supabase || !isAuthenticated || (rolActual !== 'recepcion' && rolActual !== 'admin')) {
      return;
    }
    
    setLoadingAlerts(true);
    try {
      // Obtener citas activas que tengan alertas en sus fichas
      const { data, error } = await supabase
        .from('citas')
        .select(`
          id,
          mascota:mascotas(
            id,
            nombre,
            especie,
            dueno:perfiles!mascotas_dueno_id_fkey(id, telefono, nombre_completo)
          ),
          groomer:perfiles!citas_groomer_id_fkey(id, nombre_completo),
          ficha:fichas_grooming(
            id,
            estado_ingreso_nudos,
            estado_ingreso_pulgas,
            estado_ingreso_heridas,
            observaciones_groomer,
            nivel_suciedad,
            recomendaciones_post,
            fotos:fotos_grooming(url_foto)
          )
        `)
        .in('estado', ['en_proceso', 'en_espera', 'programada']);

      if (error) throw error;

      // Filtrar solo las citas que tienen alguna alerta sin resolver
      const alerts = (data || [])
        .filter((c) => c.ficha && (c.ficha.estado_ingreso_nudos || c.ficha.estado_ingreso_pulgas || c.ficha.estado_ingreso_heridas))
        .map((c) => {
          let tipo = 'nudos';
          let sugerencia = 'Tratamiento Acondicionador';
          let precio = 30;

          if (c.ficha.estado_ingreso_pulgas) {
            tipo = 'pulgas';
            sugerencia = 'Shampoo Antipulgas';
            precio = 50;
          } else if (c.ficha.estado_ingreso_heridas) {
            tipo = 'heridas';
            sugerencia = 'Cuidado Antiséptico';
            precio = 40;
          }

          return {
            cita_id: c.id,
            mascota: c.mascota?.nombre || 'Mascota',
            groomer: c.groomer?.nombre_completo || 'Groomer',
            tel: c.mascota?.dueno?.telefono || 'Sin teléfono',
            dueño: c.mascota?.dueno?.nombre_completo || 'Dueño',
            motivo: tipo,
            desc: c.ficha.observaciones_groomer || 'Se reportó una incidencia de ingreso',
            sugerencia_extra: sugerencia,
            precio_extra: precio,
            evidencia_img: c.ficha.fotos?.[0]?.url_foto || 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&h=300&fit=crop'
          };
        });

      setRawAlerts(alerts);
    } catch (err) {
      console.error('[ReceptionAlerts] Error fetching alerts:', err);
    } finally {
      setLoadingAlerts(false);
    }
  }, [rolActual, isAuthenticated]);

  // Sincronizar alertas activas y pendientes
  useEffect(() => {
    if (rawAlerts.length === 0) {
      setAlertaActiva(null);
      setAlertasPendientes([]);
      return;
    }

    // Filtrar las alertas que el usuario tiene pendientes
    const pendingIds = alertasPendientes.map(a => a.cita_id);
    
    // Si la alerta activa ya no está en rawAlerts (porque se aprobó o eliminó)
    if (alertaActiva && !rawAlerts.some(r => r.cita_id === alertaActiva.cita_id)) {
      setAlertaActiva(null);
    }

    // Actualizar la lista de pendientes con la info fresca de Supabase
    const freshPending = rawAlerts.filter(r => pendingIds.includes(r.cita_id));
    setAlertasPendientes(freshPending);

    // Si no hay alerta activa y hay alertas nuevas que no están pendientes, activar la primera
    const available = rawAlerts.filter(r => !pendingIds.includes(r.cita_id));
    if (!alertaActiva && available.length > 0) {
      setAlertaActiva(available[0]);
    }
  }, [rawAlerts]);

  // Polling cada 30 segundos
  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const posponerAlerta = useCallback((alerta) => {
    if (alerta) {
      setAlertasPendientes((prev) => [...prev.filter(a => a.cita_id !== alerta.cita_id), alerta]);
      setAlertaActiva(null);
    }
  }, []);

  const restaurarAlerta = useCallback((alerta) => {
    setAlertaActiva(alerta);
    setAlertasPendientes((prev) => prev.filter(a => a.cita_id !== alerta.cita_id));
  }, []);

  return (
    <ReceptionAlertContext.Provider
      value={{
        alertaActiva,
        setAlertaActiva,
        alertasPendientes,
        setAlertasPendientes,
        posponerAlerta,
        restaurarAlerta,
        refetchAlerts: fetchAlerts,
        loadingAlerts
      }}
    >
      {children}
    </ReceptionAlertContext.Provider>
  );
};

ReceptionAlertProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useReceptionAlerts = () => useContext(ReceptionAlertContext);
