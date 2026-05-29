import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../../store/AuthContext';
import { useToast } from '../../../store/ToastContext';
import { 
  getClientPets, 
  getClientAppointments, 
  getClientAppliedModifiers,
  getBookingResources, 
  createClientBooking, 
  cancelClientAppointment,
  acceptProposal,
  rejectProposal
} from '../services/clientAgendaService';

import ClientDashboardView from '../components/client/ClientDashboardView';
import ClientBookingWizard from '../components/client/ClientBookingWizard';
import ClientSuccessView from '../components/client/ClientSuccessView';
import ClientProposalModal from '../components/client/tracking/ClientProposalModal';

const ClientAgendaView = ({ activeTab }) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [currentView, setCurrentView] = useState('dashboard');
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);

  // Database resource states
  const [pets, setPets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [resources, setResources] = useState({ services: [], modifiers: [], groomers: [], schedules: [] });

  // Wizard state parameters
  const [initialCart, setInitialCart] = useState([]);
  const [initialStep, setInitialStep] = useState(1);

  const [proposalCita, setProposalCita] = useState(null);

  useEffect(() => {
    if (!appointments.length || !resources.groomers?.length) return;
    const pending = appointments.find(app => app.estado_propuesta === 'pendiente');
    if (pending) {
      const sugGroomer = resources.groomers.find(g => g.id === pending.sugerencia_groomer_id);
      setProposalCita({
        ...pending,
        sugerencia_groomer_nombre: sugGroomer?.nombre_completo || 'Estilista Sugerido',
        sugerencia_groomer_avatar: sugGroomer?.avatar_url
      });
    } else {
      setProposalCita(null);
    }
  }, [appointments, resources.groomers]);

  const handleAcceptProposal = async () => {
    if (!proposalCita) return;
    setSaving(true);
    try {
      const result = await acceptProposal(
        proposalCita.id, 
        proposalCita.sugerencia_groomer_id,
        proposalCita.sugerencia_fecha_hora_inicio,
        proposalCita.sugerencia_fecha_hora_fin
      );
      if (result.error) {
        showToast('Error al aceptar la propuesta', 'error');
      } else {
        showToast('Propuesta aceptada con éxito. Cita confirmada!', 'success');
        setProposalCita(null);
        await loadClientData();
      }
    } catch (err) {
      console.error(err);
      showToast('Error al aceptar la propuesta', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRejectProposal = async () => {
    if (!proposalCita) return;
    setSaving(true);
    try {
      const result = await rejectProposal(proposalCita.id);
      if (result.error) {
        showToast('Error al rechazar la propuesta', 'error');
      } else {
        showToast('Propuesta rechazada. Reserva cancelada.', 'info');
        
        const pet = pets.find(p => p.id === proposalCita.mascota_id) || proposalCita.mascota;
        const serviceId = proposalCita.servicio_id;
        
        setProposalCita(null);
        await loadClientData();

        // Redirigir al wizard para reprogramar
        handleQuickRebook(pet, serviceId);
      }
    } catch (err) {
      console.error(err);
      showToast('Error al rechazar la propuesta', 'error');
    } finally {
      setSaving(false);
    }
  };

  const loadClientData = async () => {
    if (!currentUser?.id) return;
    setLoadingData(true);
    console.log('[ClientAgendaView] Fetching client data for ID:', currentUser.id);
    try {
      const [petsRes, appRes, resourcesRes] = await Promise.all([
        getClientPets(currentUser.id),
        getClientAppointments(currentUser.id),
        getBookingResources(),
      ]);

      console.log('[ClientAgendaView] getClientPets response:', petsRes);
      console.log('[ClientAgendaView] getClientAppointments response:', appRes);

      if (petsRes.error) {
        console.error('[ClientAgendaView] Error loading pets:', petsRes.error);
        showToast('Error al cargar mascotas: ' + petsRes.error.message, 'error');
      }
      if (appRes.error) {
        console.error('[ClientAgendaView] Error loading appointments:', appRes.error);
        showToast('Error al cargar citas: ' + appRes.error.message, 'error');
      }

      let appointmentsList = appRes.data || [];
      if (appointmentsList.length > 0) {
        const appIds = appointmentsList.map((a) => a.id);
        const modsRes = await getClientAppliedModifiers(appIds);
        const modsByAppId = (modsRes.data || []).reduce((acc, curr) => {
          if (!acc[curr.cita_id]) acc[curr.cita_id] = [];
          acc[curr.cita_id].push(
            curr.modificador
              ? { ...curr.modificador, precio_aplicado: curr.precio_aplicado }
              : curr
          );
          return acc;
        }, {});

        appointmentsList = appointmentsList.map((app) => ({
          ...app,
          modificadores_aplicados: modsByAppId[app.id] || [],
        }));
      }

      setPets(petsRes.data || []);
      setAppointments(appointmentsList);
      setResources(resourcesRes);
    } catch (err) {
      console.error('[ClientAgendaView] Error loading data:', err);
      showToast('Error al sincronizar datos', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadClientData();
  }, [currentUser?.id]);

  // Sync tab navigation with views
  useEffect(() => {
    if (activeTab === 'reservar') {
      handleStartNewBooking();
    } else {
      setCurrentView('dashboard');
    }
  }, [activeTab]);

  const handleStartNewBooking = () => {
    setInitialCart([]);
    setInitialStep(1);
    setCurrentView('wizard');
  };

  const handleQuickRebook = (pet, serviceId) => {
    setInitialCart([{ pet, serviceId }]);
    setInitialStep(3); // Jump straight to calendar
    setCurrentView('wizard');
  };

  const handleConfirmBooking = async (bookingData) => {
    setSaving(true);
    try {
      const { cartTotals, grandTotalPrice, selectedDate, selectedTime, selectedGroomer } = bookingData;

      let currentStartTime = new Date(selectedDate);
      const [startH, startM] = selectedTime.split(':');
      currentStartTime.setHours(parseInt(startH, 10), parseInt(startM, 10), 0, 0);

      const appointmentsPayload = cartTotals.map((item) => {
        const citaInicio = new Date(currentStartTime);
        const citaFin = new Date(currentStartTime.getTime() + item.totalTime * 60000);

        currentStartTime = citaFin;

        return {
          mascota_id: item.pet.id,
          groomer_id: selectedGroomer === 'any' ? null : selectedGroomer,
          servicio_id: item.service.id,
          fecha_hora_inicio: citaInicio.toISOString(),
          fecha_hora_fin: citaFin.toISOString(),
          modifiers: item.modifiers,
        };
      });

      const result = await createClientBooking({
        clienteId: currentUser.id,
        totalReserva: grandTotalPrice,
        appointments: appointmentsPayload,
      });

      if (result.error) {
        showToast(result.error.message || 'No se pudo crear la reserva', 'error');
      } else {
        showToast('Reserva enviada con éxito. Espere la confirmación de recepción.', 'success');
        setCurrentView('success');
        await loadClientData();
      }
    } catch (err) {
      console.error(err);
      showToast('Error al confirmar la reserva', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    setSaving(true);
    try {
      const result = await cancelClientAppointment(appointmentId);
      if (result.error) {
        showToast(result.error.message || 'No se pudo cancelar la cita', 'error');
      } else {
        showToast('Cita cancelada correctamente', 'success');
        await loadClientData();
      }
    } catch (err) {
      console.error(err);
      showToast('Error al cancelar la cita', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) {
    return (
      <div className="bg-white border-[4px] border-black p-12 rounded-[3rem] shadow-[10px_10px_0px_0px_black] text-center space-y-4">
        <div className="text-4xl animate-spin inline-block">🔄</div>
        <h3 className="text-xl font-black uppercase italic">Cargando panel de control...</h3>
        <p className="text-xs font-bold text-slate-500 max-w-md mx-auto uppercase tracking-wider">
          Estamos cargando tus citas, mascotas e información de reservas en tiempo real.
        </p>
      </div>
    );
  }

  return (
    <div>
      {currentView === 'dashboard' && (
        <ClientDashboardView
          currentUser={currentUser}
          pets={pets}
          appointments={appointments}
          onStartNewBooking={handleStartNewBooking}
          onQuickRebook={handleQuickRebook}
          onCancelAppointment={handleCancelAppointment}
          saving={saving}
          onOpenProposal={setProposalCita}
        />
      )}

      {currentView === 'wizard' && (
        <ClientBookingWizard
          pets={pets}
          services={resources.services}
          modifiers={resources.modifiers}
          groomers={resources.groomers}
          schedules={resources.schedules}
          initialCart={initialCart}
          initialStep={initialStep}
          onConfirmBooking={handleConfirmBooking}
          onCancel={() => setCurrentView('dashboard')}
          saving={saving}
        />
      )}

      {currentView === 'success' && (
        <ClientSuccessView onBackToDashboard={() => setCurrentView('dashboard')} />
      )}

      <ClientProposalModal
        isOpen={!!proposalCita}
        cita={proposalCita}
        onClose={() => setProposalCita(null)}
        onAccept={handleAcceptProposal}
        onReject={handleRejectProposal}
      />
    </div>
  );
};

ClientAgendaView.propTypes = {
  activeTab: PropTypes.string.isRequired,
};

export default ClientAgendaView;