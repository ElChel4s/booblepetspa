import { useCallback, useEffect, useState } from 'react';
import { loadAgendaData, getTodayISODate } from '../services/agendaService';
import { supabase } from '../../../api/supabase';

export const useAgendaData = ({ role, userId }) => {
  const [selectedDate, setSelectedDate] = useState(getTodayISODate());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await loadAgendaData({
      role,
      userId,
      date: selectedDate,
    });

    if (result.error) {
      setError(result.error);
      setData(result.data);
    } else {
      setData(result.data);
    }

    setLoading(false);
  }, [role, userId, selectedDate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('agenda-realtime-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cita_modificadores_aplicados'
        },
        () => {
          refresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'citas'
        },
        () => {
          refresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fichas_grooming'
        },
        () => {
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  return {
    data,
    loading,
    error,
    selectedDate,
    setSelectedDate,
    refresh,
    updateOptimistically: (updater) => setData(prev => {
      if (!prev) return prev;
      return updater(prev);
    })
  };
};