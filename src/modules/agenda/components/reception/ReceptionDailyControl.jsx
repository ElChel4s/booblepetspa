import { useReceptionControl } from './control/hooks/useReceptionControl';
import { Clock, Scissors, CheckCircle, Dog } from 'lucide-react';
import KanbanColumn from './control/components/KanbanColumn';
import WaitingCard from './control/components/WaitingCard';
import GroomingCard from './control/components/GroomingCard';
import ReadyCard from './control/components/ReadyCard';
import CheckoutModal from './control/components/CheckoutModal';

const ReceptionDailyControl = () => {
  const {
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
    handleUpdateModifierStatus,
  } = useReceptionControl();

  if (loading && citasEsperando.length === 0 && citasEnProceso.length === 0 && citasListas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <div className="text-4xl animate-bounce">🐾</div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Cargando flujo de spa del día...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 relative z-10 w-full">
      {/* Contenedor Kanban */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 h-[calc(100vh-280px)] min-h-[500px] overflow-y-hidden overflow-x-auto pb-4 snap-x">
        
        {/* ZONA 1: SALA DE ESPERA */}
        <KanbanColumn
          title="En Espera"
          count={citasEsperando.length}
          icon={<Clock className="text-slate-500" />}
          bgClass="bg-slate-100/80"
        >
          {citasEsperando.map((cita) => (
            <WaitingCard
              key={cita.id}
              cita={cita}
              onCheckIn={handleDarIngreso}
            />
          ))}
          {citasEsperando.length === 0 && (
            <div className="text-center py-10 opacity-50">
              <Dog size={40} className="mx-auto mb-2" />
              <p className="font-black uppercase text-xs">Sala Vacía</p>
            </div>
          )}
        </KanbanColumn>

        {/* ZONA 2: EN ESTÉTICA */}
        <KanbanColumn
          title="En Estética"
          count={citasEnProceso.length}
          icon={<Scissors className="text-blue-500" />}
          bgClass="bg-blue-50/80"
        >
          {citasEnProceso.map((cita) => (
            <GroomingCard
              key={cita.id}
              cita={cita}
              extras={modificadoresMap[cita.id] || []}
              onComplete={handleCompletarCita}
              onUpdateModifierStatus={handleUpdateModifierStatus}
            />
          ))}
          {citasEnProceso.length === 0 && (
            <div className="text-center py-10 opacity-50">
              <Scissors size={40} className="mx-auto mb-2" />
              <p className="font-black uppercase text-xs">Nadie en estética</p>
            </div>
          )}
        </KanbanColumn>

        {/* ZONA 3: LISTOS PARA SALIDA */}
        <KanbanColumn
          title="Salida Lista"
          count={citasListas.length}
          icon={<CheckCircle className="text-emerald-600" />}
          bgClass="bg-emerald-50/80"
        >
          {citasListas.map((cita) => (
            <ReadyCard
              key={cita.id}
              cita={cita}
              onOpenCheckout={handleAbrirCheckout}
            />
          ))}
          {citasListas.length === 0 && (
            <div className="text-center py-10 opacity-50">
              <CheckCircle size={40} className="mx-auto mb-2" />
              <p className="font-black uppercase text-xs">Sin Mascotas Listas</p>
            </div>
          )}
        </KanbanColumn>

      </div>

      {/* MODAL DE CHECKOUT POS */}
      {checkoutData && (
        <CheckoutModal
          checkoutData={checkoutData}
          billingForm={billingForm}
          onChangeBillingForm={setBillingForm}
          onClose={handleCerrarCheckout}
          onFinalizePayment={handleFinalizarPago}
          saving={billingSaving}
        />
      )}
    </div>
  );
};

export default ReceptionDailyControl;
