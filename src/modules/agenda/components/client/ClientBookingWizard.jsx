import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { ArrowLeft } from 'lucide-react';

import ClientTicketSummary from './ClientTicketSummary';
import WizardStepPets from './WizardStepPets';
import WizardStepGroomer from './WizardStepGroomer';
import WizardStepServices from './WizardStepServices';
import WizardStepSchedule from './WizardStepSchedule';
import WizardStepConfirm from './WizardStepConfirm';

// --- Helpers de cálculo (lógica pura, sin UI) ---

const resolvePetModifiers = (pet, allModifiers) => {
  if (!pet || !allModifiers) return [];
  return allModifiers.filter((mod) => {
    const criterioLower = String(mod.criterio || '').toLowerCase();
    const valorLower = String(mod.valor || '').toLowerCase();
    const petSize = String(pet.tamano || '').toLowerCase();
    const petTemp = String(pet.temperamento || '').toLowerCase();
    return (
      (petSize && (criterioLower.includes(petSize) || valorLower.includes(petSize))) ||
      (petTemp && (criterioLower.includes(petTemp) || valorLower.includes(petTemp)))
    );
  });
};

const calculatePetServiceFn = (pet, serviceId, allServices, allModifiers) => {
  if (!serviceId) return null;
  const service = allServices.find((s) => s.id === serviceId);
  if (!service) return null;

  let totalTime = Number(service.duracion_base_minutos || 0);
  let totalPrice = Number(service.precio_base || 0);
  const petModifiers = resolvePetModifiers(pet, allModifiers);
  const breakdown = [];

  petModifiers.forEach((mod) => {
    totalTime += Number(mod.tiempo_extra_minutos || 0);
    totalPrice += Number(mod.precio_adicional || 0);
    breakdown.push({
      id: mod.id,
      label: mod.criterio || mod.valor || 'Modificador',
      extraP: Number(mod.precio_adicional || 0),
      extraT: Number(mod.tiempo_extra_minutos || 0),
    });
  });

  return { service, totalTime, totalPrice, breakdown, modifiers: petModifiers };
};

const formatTimeUI = (timeStr) => {
  const [h, m] = timeStr.split(':');
  const d = new Date();
  d.setHours(parseInt(h, 10), parseInt(m, 10));
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
};

const calculateEndTime = (startTime, durationMins) => {
  const [h, m] = startTime.split(':');
  const d = new Date();
  d.setHours(parseInt(h, 10), parseInt(m, 10) + durationMins);
  return formatTimeUI(
    `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  );
};

const STEP_LABELS = {
  1: '1. Mascotas',
  2: '2. Especialista',
  3: '3. Servicios',
  4: '4. Fecha y Hora',
  5: '5. Confirmación',
};

// --- Componente Orquestador ---

const ClientBookingWizard = ({
  pets = [],
  services = [],
  modifiers = [],
  groomers = [],
  schedules = [],
  initialCart = [],
  initialStep = 1,
  onConfirmBooking,
  onCancel,
  saving = false,
}) => {
  const [wizardStep, setWizardStep] = useState(initialStep);
  const [cart, setCart] = useState(initialCart);
  const [selectedGroomer, setSelectedGroomer] = useState('any');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  useEffect(() => {
    setCart(initialCart);
    setWizardStep(initialStep);
  }, [initialCart, initialStep]);

  const togglePetInCart = (pet) => {
    const exists = cart.find((i) => i.pet.id === pet.id);
    if (exists) {
      setCart(cart.filter((i) => i.pet.id !== pet.id));
    } else {
      setCart([...cart, { pet, serviceId: null }]);
    }
  };

  const setServiceForCartItem = (petId, serviceId) => {
    setCart(cart.map((item) => (item.pet.id === petId ? { ...item, serviceId } : item)));
  };

  // Curried para pasar como prop sin exponer allServices/allModifiers
  const calculatePetService = (pet, serviceId) =>
    calculatePetServiceFn(pet, serviceId, services, modifiers);

  const cartTotals = useMemo(
    () =>
      cart
        .map((item) => {
          const calc = calculatePetServiceFn(item.pet, item.serviceId, services, modifiers);
          if (!calc) return null;
          return {
            pet: item.pet,
            service: calc.service,
            totalPrice: calc.totalPrice,
            totalTime: calc.totalTime,
            breakdown: calc.breakdown,
            modifiers: calc.modifiers,
          };
        })
        .filter(Boolean),
    [cart, services, modifiers]
  );

  const grandTotalTime = useMemo(
    () => cartTotals.reduce((acc, curr) => acc + curr.totalTime, 0),
    [cartTotals]
  );

  const grandTotalPrice = useMemo(
    () => cartTotals.reduce((acc, curr) => acc + curr.totalPrice, 0),
    [cartTotals]
  );

  const uiStartTime = selectedTime ? selectedTime : '';
  const uiEndTime = selectedTime ? calculateEndTime(selectedTime, grandTotalTime) : '';

  const handleBookingSubmit = () => {
    onConfirmBooking({
      cartTotals,
      grandTotalPrice,
      grandTotalTime,
      selectedDate,
      selectedTime,
      selectedGroomer,
    });
  };

  const sharedTicketProps = {
    cartTotals,
    grandTotalPrice,
    grandTotalTime,
    selectedDate,
    uiStartTime,
    uiEndTime,
    selectedGroomer,
    groomersList: groomers,
    confirmAction: handleBookingSubmit,
    wizardStep,
  };

  return (
    <div className="animate-in slide-in-from-bottom-8 duration-300 pb-24 h-full flex flex-col lg:flex-row gap-8 lg:gap-12">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Columna principal */}
      <div className="flex-1 space-y-8">

        {/* Header con navegación de pasos */}
        <div className="flex items-center gap-4 border-b-[4px] border-black pb-6">
          <button
            onClick={onCancel}
            className="p-3.5 bg-white border-[3.5px] border-black rounded-2xl shadow-[4px_4px_0px_0px_black] hover:-translate-y-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer"
          >
            <ArrowLeft size={20} strokeWidth={3} />
          </button>
          <div className="flex-1">
            <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-none text-slate-900">
              {STEP_LABELS[wizardStep]}
            </h2>
            <div className="flex items-center gap-2 mt-3">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={`h-2.5 rounded-full border-[2.5px] border-black transition-all duration-300 ${
                    wizardStep >= step ? 'bg-[var(--primary)] w-10' : 'bg-white w-3 opacity-50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Paso 1: Mascotas */}
        {wizardStep === 1 && (
          <WizardStepPets
            pets={pets}
            cart={cart}
            togglePetInCart={togglePetInCart}
            setWizardStep={setWizardStep}
          />
        )}

        {/* Paso 2: Especialista */}
        {wizardStep === 2 && (
          <WizardStepGroomer
            groomers={groomers}
            selectedGroomer={selectedGroomer}
            setSelectedGroomer={setSelectedGroomer}
            setWizardStep={setWizardStep}
          />
        )}

        {/* Paso 3: Servicios */}
        {wizardStep === 3 && (
          <WizardStepServices
            cart={cart}
            services={services}
            setServiceForCartItem={setServiceForCartItem}
            calculatePetService={calculatePetService}
            setWizardStep={setWizardStep}
          />
        )}

        {/* Paso 4: Fecha y Hora */}
        {wizardStep === 4 && (
          <WizardStepSchedule
            grandTotalTime={grandTotalTime}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedTime={selectedTime}
            setSelectedTime={setSelectedTime}
            uiStartTime={uiStartTime}
            uiEndTime={uiEndTime}
            setWizardStep={setWizardStep}
            schedules={schedules}
            selectedGroomer={selectedGroomer}
          />
        )}

        {/* Paso 5: Confirmación (ticket móvil) */}
        {wizardStep === 5 && (
          <WizardStepConfirm
            {...sharedTicketProps}
            handleBookingSubmit={handleBookingSubmit}
            saving={saving}
            setWizardStep={setWizardStep}
          />
        )}
      </div>

      {/* Columna derecha: ticket sticky (solo desktop, pasos 1-4) */}
      {wizardStep < 5 && (
        <div className="hidden lg:block w-[380px] shrink-0 animate-in fade-in">
          <div className="sticky top-8">
            <ClientTicketSummary {...sharedTicketProps} isDesktop={true} />
          </div>
        </div>
      )}
    </div>
  );
};

ClientBookingWizard.propTypes = {
  pets: PropTypes.array,
  services: PropTypes.array,
  modifiers: PropTypes.array,
  groomers: PropTypes.array,
  schedules: PropTypes.array,
  initialCart: PropTypes.array,
  initialStep: PropTypes.number,
  onConfirmBooking: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};

export default ClientBookingWizard;
