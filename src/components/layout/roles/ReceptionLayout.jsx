import PropTypes from 'prop-types';
import Sidebar from '../Sidebar';
import BottomNav from '../BottomNav';
import { useReceptionAlerts } from '../../../store/ReceptionAlertContext';
import TriageModal from '../../../modules/agenda/components/reception/control/components/TriageModal';
import FloatingAlerts from '../../../modules/agenda/components/reception/control/components/FloatingAlerts';
import { approveTriageAlert } from '../../../modules/grooming/services/groomingMonitorService';
import { updateCitaModifierStatus } from '../../../modules/agenda/components/reception/control/services/receptionControlService';
import { useToast } from '../../../store/ToastContext';

const ReceptionLayout = ({ themeVars, onOpenSettings, children }) => {
  const {
    alertaActiva,
    setAlertaActiva,
    alertasPendientes,
    posponerAlerta,
    restaurarAlerta,
    refetchAlerts
  } = useReceptionAlerts();

  const { showToast } = useToast();

  const handleApprove = async () => {
    if (!alertaActiva) return;
    
    if (alertaActiva.es_modificador) {
      const { error } = await updateCitaModifierStatus(alertaActiva.modifier_applied_id, 'aprobado');
      if (error) {
        showToast('Error al aprobar el servicio adicional: ' + error.message, 'error');
      } else {
        showToast('Servicio adicional aprobado y aplicado', 'success');
        setAlertaActiva(null);
        refetchAlerts();
      }
    } else {
      const { error } = await approveTriageAlert(alertaActiva.cita_id, alertaActiva.motivo, alertaActiva.precio_extra);
      if (error) {
        showToast('Error al aprobar el recargo: ' + error.message, 'error');
      } else {
        showToast('Recargo aprobado y aplicado', 'success');
        setAlertaActiva(null);
        refetchAlerts();
      }
    }
  };

  const handleReject = async () => {
    if (!alertaActiva) return;

    if (alertaActiva.es_modificador) {
      const { error } = await updateCitaModifierStatus(alertaActiva.modifier_applied_id, 'rechazado');
      if (error) {
        showToast('Error al rechazar el servicio adicional: ' + error.message, 'error');
      } else {
        showToast('Servicio adicional rechazado', 'warning');
        setAlertaActiva(null);
        refetchAlerts();
      }
    } else {
      setAlertaActiva(null);
    }
  };

  return (
    <div
      style={themeVars}
      className="min-h-screen bg-[var(--bg)] font-['Nunito',sans-serif] text-[var(--text)] flex flex-col md:flex-row relative overflow-hidden transition-colors duration-500"
    >
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(var(--border) 2px, transparent 2px)',
          backgroundSize: '35px 35px',
        }}
      />

      <Sidebar onOpenSettings={onOpenSettings} />

      <main className="flex-1 flex flex-col w-full pb-32 md:pb-16 relative md:pl-40 md:px-10 md:pt-8 transition-all duration-500">
        {children}
      </main>

      <BottomNav onOpenSettings={onOpenSettings} />

      {/* Alerta de triage global en modal */}
      {alertaActiva && (
        <TriageModal
          alerta={alertaActiva}
          onClose={() => setAlertaActiva(null)}
          onPostpone={posponerAlerta}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {/* Alertas minimizadas flotando */}
      <FloatingAlerts
        pendingAlerts={alertasPendientes}
        onRestore={restaurarAlerta}
      />
    </div>
  );
};

ReceptionLayout.propTypes = {
  themeVars: PropTypes.object,
  onOpenSettings: PropTypes.func,
  children: PropTypes.node,
};

export default ReceptionLayout;
