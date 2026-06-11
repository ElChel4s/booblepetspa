import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../store/AuthContext';
import { useAgendaData } from './hooks/useAgendaData';
import AgendaShell from './components/AgendaShell';
import AdminAgendaView from './views/AdminAgendaView';
import ReceptionAgendaView from './views/ReceptionAgendaView';
import GroomerAgendaView from './views/GroomerAgendaView';
import ClientAgendaView from './views/ClientAgendaView';

const ROLE_TABS = {
  admin: [
    { id: 'calendario', label: 'Calendario' },
    { id: 'staff', label: 'Staff' },
    { id: 'bloqueos', label: 'Bloqueos' },
    { id: 'control', label: 'Control' },
  ],
  recepcion: [
    { id: 'calendario', label: 'Agenda diaria' },
    { id: 'validacion', label: 'Bandeja web' },
    { id: 'panel', label: 'Control' },
  ],
  groomer: [
    { id: 'turnos', label: 'Mis turnos' },
    { id: 'horario', label: 'Horario' },
    { id: 'fichas', label: 'Fichas' },
  ],
  cliente: [
    { id: 'reservar', label: 'Reservar' },
    { id: 'mis-citas', label: 'Mis citas' },
    { id: 'historial', label: 'Historial' },
  ],
};

const AgendaModule = () => {
  const { rolActual, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState(ROLE_TABS[rolActual]?.[0]?.id || 'calendario');
    const { data: agendaData, loading, error, selectedDate, setSelectedDate, refresh, updateOptimistically } = useAgendaData({
      role: rolActual,
      userId: currentUser?.id,
    });
  
    const tabs = useMemo(() => ROLE_TABS[rolActual] || ROLE_TABS.cliente, [rolActual]);
    const shellTabs = rolActual === 'recepcion' ? [] : tabs;
  
    useEffect(() => {
      setActiveTab(ROLE_TABS[rolActual]?.[0]?.id || 'calendario');
    }, [rolActual]);
  
    const content = (() => {
      if (rolActual === 'admin') {
        return <AdminAgendaView activeTab={activeTab} agendaData={agendaData} loading={loading} error={error} selectedDate={selectedDate} setSelectedDate={setSelectedDate} onRefresh={refresh} currentUser={currentUser} />;
      }
      if (rolActual === 'recepcion') {
        return (
          <ReceptionAgendaView
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            agendaData={agendaData}
            loading={loading}
            error={error}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            onRefresh={refresh}
          />
        );
      }
      if (rolActual === 'groomer') {
        return <GroomerAgendaView activeTab={activeTab} agendaData={agendaData} loading={loading} error={error} currentUser={currentUser} onRefresh={refresh} updateOptimistically={updateOptimistically} />;
      }
    return <ClientAgendaView activeTab={activeTab} agendaData={agendaData} loading={loading} error={error} />;
  })();

  return (
    <AgendaShell
      title="Agenda"
      subtitle="Reservas, turnos, horarios y excepciones"
      role={rolActual}
      tabs={shellTabs}
      activeTab={activeTab}
      onChangeTab={setActiveTab}
    >
      {content}
    </AgendaShell>
  );
};

export default AgendaModule;