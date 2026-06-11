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
      // Obtener citas activas que tengan alertas en sus fichas o modificadores sugeridos pendientes
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
          ),
          modificadores_aplicados:cita_modificadores_aplicados(
            id,
            precio_aplicado,
            concepto_snap,
            estado_aprobacion,
            url_evidencia,
            modificador:modificadores_servicio(id, criterio, valor, tiempo_extra_minutos, precio_adicional)
          )
        `)
        .in('estado', ['en_proceso', 'en_espera', 'programada']);

      if (error) throw error;

      const alerts = [];

      (data || []).forEach((c) => {
        // 1. Alertas de Triage de ingreso (nudos, pulgas, heridas)
        if (c.ficha && (c.ficha.estado_ingreso_nudos || c.ficha.estado_ingreso_pulgas || c.ficha.estado_ingreso_heridas)) {
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

          alerts.push({
            cita_id: c.id,
            mascota: c.mascota?.nombre || 'Mascota',
            groomer: c.groomer?.nombre_completo || 'Groomer',
            tel: c.mascota?.dueno?.telefono || 'Sin teléfono',
            dueño: c.mascota?.dueno?.nombre_completo || 'Dueño',
            motivo: tipo,
            desc: c.ficha.observaciones_groomer || 'Se reportó una incidencia de ingreso',
            sugerencia_extra: sugerencia,
            precio_extra: precio,
            evidencia_img: c.ficha.fotos?.[0]?.url_foto || 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&h=300&fit=crop',
            es_modificador: false
          });
        }

        // 2. Alertas de Modificadores / Servicios Adicionales pendientes
        if (c.modificadores_aplicados && c.modificadores_aplicados.length > 0) {
          c.modificadores_aplicados.forEach((mod) => {
            if (mod.estado_aprobacion === 'pendiente') {
              const isExtraService = mod.modificador?.valor === 'Servicio Adicional';
              const label = mod.concepto_snap || mod.modificador?.criterio || 'Tratamiento adicional recomendado';
              
              alerts.push({
                cita_id: c.id,
                modifier_applied_id: mod.id,
                mascota: c.mascota?.nombre || 'Mascota',
                groomer: c.groomer?.nombre_completo || 'Groomer',
                tel: c.mascota?.dueno?.telefono || 'Sin teléfono',
                dueño: c.mascota?.dueno?.nombre_completo || 'Dueño',
                motivo: label,
                desc: isExtraService 
                  ? `El groomer sugiere añadir el servicio adicional de "${label}".` 
                  : `Se recomienda el tratamiento de "${label}" para la sesión de grooming.`,
                sugerencia_extra: label,
                precio_extra: Number(mod.precio_aplicado || mod.modificador?.precio_adicional || 0),
                evidencia_img: mod.url_evidencia || 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&h=300&fit=crop',
                es_modificador: true
              });
            }
          });
        }
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
    const pendingKeys = alertasPendientes.map(a => a.es_modificador ? a.modifier_applied_id : a.cita_id);
    
    // Si la alerta activa ya no está en rawAlerts (porque se aprobó o eliminó)
    if (alertaActiva) {
      const activeKey = alertaActiva.es_modificador ? alertaActiva.modifier_applied_id : alertaActiva.cita_id;
      const remains = rawAlerts.some(r => {
        const rKey = r.es_modificador ? r.modifier_applied_id : r.cita_id;
        return rKey === activeKey;
      });
      if (!remains) {
        setAlertaActiva(null);
      }
    }

    // Actualizar la lista de pendientes con la info fresca de Supabase
    const freshPending = rawAlerts.filter(r => {
      const rKey = r.es_modificador ? r.modifier_applied_id : r.cita_id;
      return pendingKeys.includes(rKey);
    });
    setAlertasPendientes(freshPending);

    // Si no hay alerta activa y hay alertas nuevas que no están pendientes, activar la primera
    const available = rawAlerts.filter(r => {
      const rKey = r.es_modificador ? r.modifier_applied_id : r.cita_id;
      return !pendingKeys.includes(rKey);
    });
    if (!alertaActiva && available.length > 0) {
      setAlertaActiva(available[0]);
    }
  }, [rawAlerts]);

  // Suscripción en tiempo real a Supabase
  useEffect(() => {
    if (!supabase || !isAuthenticated || (rolActual !== 'recepcion' && rolActual !== 'admin')) {
      return;
    }

    // Carga inicial
    fetchAlerts();

    const channel = supabase
      .channel('reception_alerts_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'citas' }, () => {
        fetchAlerts();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fichas_grooming' }, () => {
        fetchAlerts();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cita_modificadores_aplicados' }, () => {
        fetchAlerts();
      })
      .subscribe();

    return () => {
      if (supabase && channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [isAuthenticated, rolActual, fetchAlerts]);

  const posponerAlerta = useCallback((alerta) => {
    if (alerta) {
      const key = alerta.es_modificador ? alerta.modifier_applied_id : alerta.cita_id;
      setAlertasPendientes((prev) => [
        ...prev.filter(a => {
          const aKey = a.es_modificador ? a.modifier_applied_id : a.cita_id;
          return aKey !== key;
        }),
        alerta
      ]);
      setAlertaActiva(null);
    }
  }, []);

  const restaurarAlerta = useCallback((alerta) => {
    setAlertaActiva(alerta);
    const key = alerta.es_modificador ? alerta.modifier_applied_id : alerta.cita_id;
    setAlertasPendientes((prev) => prev.filter(a => {
      const aKey = a.es_modificador ? a.modifier_applied_id : a.cita_id;
      return aKey !== key;
    }));
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
