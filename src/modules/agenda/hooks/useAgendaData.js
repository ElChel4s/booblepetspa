import { useCallback, useEffect, useState } from 'react';
import { loadAgendaData, getTodayISODate } from '../services/agendaService';

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

  return {
    data,
    loading,
    error,
    selectedDate,
    setSelectedDate,
    refresh,
  };
};