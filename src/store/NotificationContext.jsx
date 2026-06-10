/* eslint-disable react-refresh/only-export-components, react-hooks/set-state-in-effect, no-unused-vars */
import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../api/supabase';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, currentUser } = useAuth();
  const { showToast } = useToast();
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !currentUser) return;
    
    setLoading(true);
    try {
      // The RLS policy handles returning only the user's notifications or their role's notifications
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

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    } else {
      setNotifications([]);
    }
  }, [isAuthenticated, fetchNotifications]);

  // Suscripción a Realtime
  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;

    // We subscribe to the whole table, RLS automatically filters the events sent to this user
    const channel = supabase.channel('realtime:notificaciones')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notificaciones' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNotif = payload.new;
            setNotifications((prev) => [newNotif, ...prev]);
            
            // Show toast visually
            // Map types to toast colors
            let toastType = 'info';
            if (newNotif.tipo === 'stock' || newNotif.tipo === 'seguridad' || newNotif.tipo === 'encuesta') toastType = 'warning';
            if (newNotif.tipo === 'pago') toastType = 'success';
            
            showToast(newNotif.titulo, toastType);
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
    // Optimistic update
    setNotifications((prev) => prev.map(n => n.id === id ? { ...n, leido: true } : n));
    try {
      const { error } = await supabase
        .from('notificaciones')
        .update({ leido: true })
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('[NotificationContext] Error marking as read:', err);
      // Revert if error
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
        refetchNotifications: fetchNotifications
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
