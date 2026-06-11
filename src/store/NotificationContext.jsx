/* eslint-disable react-refresh/only-export-components, react-hooks/set-state-in-effect, no-unused-vars */
import { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../api/supabase';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const NotificationContext = createContext();

// ─── Helpers para Notificaciones Nativas del navegador ──────────────────────

const getNativePermission = () => {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
};

const sendNativeNotification = (title, body, icon) => {
  if (getNativePermission() !== 'granted') return;
  // Solo mostrar si la página NO está visible (usuario en otra pestaña / pantalla apagada)
  if (document.visibilityState === 'visible') return;

  try {
    const notif = new Notification(title, {
      body,
      icon: icon || '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: `moopsic-${Date.now()}`,
      vibrate: [200, 100, 200],
      requireInteraction: false,
    });

    notif.onclick = () => {
      window.focus();
      notif.close();
    };

    // Auto-cerrar después de 8 segundos
    setTimeout(() => notif.close(), 8000);
  } catch (err) {
    // En iOS Safari y algunos navegadores, new Notification() puede fallar si no es desde un SW
    console.warn('[Notifications] Error sending native notification:', err);
  }
};

// ─── Provider ───────────────────────────────────────────────────────────────

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, currentUser } = useAuth();
  const { showToast } = useToast();
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nativePermission, setNativePermission] = useState(getNativePermission());

  // Para evitar notifs duplicadas en el primer mount
  const hasInitialized = useRef(false);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !currentUser) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notificaciones')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('[NotificationContext] Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, currentUser]);

  // ─── Solicitar Permiso de Notificaciones Nativas ────────────────────────
  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNativePermission('unsupported');
      return 'unsupported';
    }

    if (Notification.permission === 'granted') {
      setNativePermission('granted');
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      setNativePermission('denied');
      return 'denied';
    }

    try {
      const result = await Notification.requestPermission();
      setNativePermission(result);
      return result;
    } catch (err) {
      console.error('[NotificationContext] Error requesting permission:', err);
      setNativePermission('denied');
      return 'denied';
    }
  }, []);

  // Auto-solicitar permiso al autenticarse (solo una vez)
  useEffect(() => {
    if (isAuthenticated && currentUser && !hasInitialized.current) {
      hasInitialized.current = true;
      // Pedir permiso en silencio después de un breve delay (mejor UX)
      const timer = setTimeout(() => {
        if (getNativePermission() === 'default') {
          requestNotificationPermission();
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, currentUser, requestNotificationPermission]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    } else {
      setNotifications([]);
      hasInitialized.current = false;
    }
  }, [isAuthenticated, fetchNotifications]);

  // Suscripción a Realtime
  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;

    const channel = supabase.channel('realtime:notificaciones')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notificaciones' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNotif = payload.new;
            setNotifications((prev) => [newNotif, ...prev]);
            
            // Show in-app toast
            let toastType = 'info';
            if (newNotif.tipo === 'stock' || newNotif.tipo === 'seguridad' || newNotif.tipo === 'encuesta') toastType = 'warning';
            if (newNotif.tipo === 'pago') toastType = 'success';
            
            showToast(newNotif.titulo, toastType);

            // 🔔 Enviar notificación nativa del navegador/teléfono
            sendNativeNotification(
              newNotif.titulo || 'BubblePet Spa',
              newNotif.mensaje || 'Tienes una nueva notificación',
              '/pwa-192x192.png'
            );
          } else if (payload.eventType === 'UPDATE') {
            setNotifications((prev) => 
              prev.map(n => n.id === payload.new.id ? payload.new : n)
            );
          } else if (payload.eventType === 'DELETE') {
            setNotifications((prev) => 
              prev.filter(n => n.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, currentUser, showToast]);

  const markAsRead = async (id) => {
    setNotifications((prev) => prev.map(n => n.id === id ? { ...n, leido: true } : n));
    try {
      const { error } = await supabase
        .from('notificaciones')
        .update({ leido: true })
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('[NotificationContext] Error marking as read:', err);
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.leido).map(n => n.id);
    if (unreadIds.length === 0) return;

    setNotifications((prev) => prev.map(n => ({ ...n, leido: true })));
    try {
      const { error } = await supabase
        .from('notificaciones')
        .update({ leido: true })
        .in('id', unreadIds);
      if (error) throw error;
    } catch (err) {
      console.error('[NotificationContext] Error marking all as read:', err);
      fetchNotifications();
    }
  };

  const deleteNotification = async (id) => {
    setNotifications((prev) => prev.filter(n => n.id !== id));
    try {
      const { error } = await supabase
        .from('notificaciones')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('[NotificationContext] Error deleting notification:', err);
      fetchNotifications();
    }
  };

  const unreadCount = notifications.filter((n) => !n.leido).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refetchNotifications: fetchNotifications,
        // PWA Push Notifications
        nativePermission,
        requestNotificationPermission,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications debe usarse dentro de un NotificationProvider');
  }
  return context;
};
