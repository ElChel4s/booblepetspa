import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { User, Phone, AlertCircle, Activity, CheckCircle2, Zap } from 'lucide-react';
import { useToast } from '../../../../store/ToastContext';
import { PopModal, BrutalInput } from './BrutalUI';
import { createReservation, createGuestPet, applyAppointmentModifiers } from '../../services/receptionAgendaService';
import { createAppointment } from '../../services/adminAgendaService';

const ICON_BY_NAME = {
  Ruler: Activity,
  Scissors: Activity,
  Zap: Zap,
  Activity: Activity,
  AlertCircle: AlertCircle,
};

const ReceptionQuickBookModal = ({
  isOpen,
  onClose,
  defaultGroomerId,
  defaultStartTime,
  services,
  groomers,
  modifiers,
  selectedDate,
  onRefresh,
}) => {
  const [actionKey, setActionKey] = useState(null);
  const { showToast } = useToast();
  const [bookingData, setBookingData] = useState({
    ownerName: '',
    phone: '',
    ci: '',
    petType: 'perro',
    petName: '',
    breed: '',
    serviceId: '',
    modifiers: [],
    groomerId: '',
    startTime: '09:00',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      setBookingData({
        ownerName: '',
        phone: '',
        ci: '',
        petType: 'perro',
        petName: '',
        breed: '',
        serviceId: '',
        modifiers: [],
        groomerId: defaultGroomerId || '',
        startTime: defaultStartTime || '09:00',
        notes: '',
      });
    }
  }, [isOpen, defaultGroomerId, defaultStartTime]);

  const selectedService = services.find((service) => service.id === bookingData.serviceId) || null;

  const calculateTotals = () => {
    let time = selectedService?.duracion_base_minutos || 0;
    let price = Number(selectedService?.precio_base || 0);

    bookingData.modifiers.forEach((modifierId) => {
      const tag = modifiers.find((item) => item.id === modifierId);
      if (!tag) return;
      time += Number(tag.tiempo_extra_minutos || 0);
      price += Number(tag.precio_adicional || 0);
    });

    return { time, price };
  };

  const calculateEndTime = () => {
    if (!bookingData.startTime) return '--:--';
    const totalMinutes = calculateTotals().time;
    const [hours, minutes] = bookingData.startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes + totalMinutes, 0, 0);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const toggleModifier = (id) => {
    setBookingData((prev) => ({
      ...prev,
      modifiers: prev.modifiers.includes(id)
        ? prev.modifiers.filter((item) => item !== id)
        : [...prev.modifiers, id],
    }));
  };

  const submitQuickBooking = async () => {
    const totals = calculateTotals();
    if (!bookingData.groomerId || !bookingData.serviceId || !bookingData.startTime) {
      showToast('Completa groomer, servicio y hora antes de confirmar.', 'error');
      return;
    }

    setActionKey('reservation-create');

    const reservationRes = await createReservation({
      nombre_invitado: bookingData.ownerName,
      telefono_invitado: bookingData.phone,
      ci_invitado: bookingData.ci,
      origen: 'presencial',
      total_reserva: totals.price,
      fecha_creacion: new Date().toISOString(),
      estado_general: 'pendiente',
    });

    if (reservationRes?.error) {
      showToast(reservationRes.error.message || 'No se pudo crear la reserva.', 'error');
      setActionKey(null);
      return;
    }

    let petId = null;
    if (bookingData.petName) {
      const petRes = await createGuestPet({
        nombre: bookingData.petName,
        especie: bookingData.petType,
        raza: bookingData.breed || null,
      });
      if (petRes?.error) {
        console.warn('Error al registrar mascota de invitado:', petRes.error);
      } else {
        petId = petRes.data?.id || null;
      }
    }

    const startDate = new Date(`${selectedDate}T${bookingData.startTime}:00`);
    const endDate = new Date(startDate.getTime() + totals.time * 60000);

    const appointmentRes = await createAppointment({
      reserva_id: reservationRes?.data?.id || null,
      mascota_id: petId,
      groomer_id: bookingData.groomerId,
      servicio_id: bookingData.serviceId,
      fecha_hora_inicio: startDate.toISOString(),
      fecha_hora_fin: endDate.toISOString(),
      estado: 'programada',
      notas_cliente: bookingData.notes,
    });

    if (appointmentRes?.error) {
      showToast(appointmentRes.error.message || 'No se pudo crear la cita.', 'error');
      setActionKey(null);
      return;
    }

    if (bookingData.modifiers.length > 0 && appointmentRes?.data?.id) {
      const modRes = await applyAppointmentModifiers(
        appointmentRes.data.id,
        bookingData.modifiers,
        modifiers
      );
      if (modRes?.error) {
        console.warn('Error al aplicar modificadores a la cita:', modRes.error);
      }
    }

    showToast('Reserva express confirmada con éxito', 'success');
    onClose();
    await onRefresh();
    setActionKey(null);
  };

  return (
    <PopModal isOpen={isOpen} onClose={onClose} title="Reserva Express" maxWidth="max-w-4xl">


      <div className="flex justify-between items-center bg-slate-100 p-4 rounded-2xl border-[3px] border-black mb-6">
        <div className="flex items-center gap-3">
          <Zap size={24} className="text-[var(--primary)]" />
          <div>
            <h4 className="font-black text-sm uppercase">Modo invitado activo</h4>
            <p className="text-[10px] font-bold text-slate-500">Agendamiento sin registro de cuenta.</p>
          </div>
        </div>
        <div className="bg-black text-white px-6 py-3 rounded-xl flex items-center gap-6 shadow-inner">
          <div className="text-right">
            <span className="block text-[8px] font-black uppercase text-slate-400">Tiempo est.</span>
            <span className="font-black text-lg text-[var(--secondary)]">{calculateTotals().time}m</span>
          </div>
          <div className="w-0.5 h-8 bg-slate-700"></div>
          <div className="text-right">
            <span className="block text-[8px] font-black uppercase text-slate-400">Total</span>
            <span className="font-black text-lg text-emerald-400">${calculateTotals().price}</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 border-[3px] border-dashed border-slate-300 p-4 rounded-2xl mb-8 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">
            Groomer asignado
          </label>
          <select
            value={bookingData.groomerId}
            onChange={(event) => setBookingData({ ...bookingData, groomerId: event.target.value })}
            className="w-full bg-white border-[3px] border-black rounded-xl px-4 py-2 font-black text-xs focus:ring-[var(--primary)]"
          >
            <option value="" disabled>
              Seleccionar groomer...
            </option>
            {groomers.map((groomer) => (
              <option key={groomer.id} value={groomer.id}>
                {groomer.nombre_completo}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 flex gap-2">
          <div className="flex-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">
              Hora inicio
            </label>
            <input
              type="time"
              value={bookingData.startTime}
              onChange={(event) => setBookingData({ ...bookingData, startTime: event.target.value })}
              className="w-full bg-white border-[3px] border-black rounded-xl px-4 py-2 font-black text-xs"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">
              Hora fin (calc)
            </label>
            <input
              type="time"
              disabled
              value={calculateEndTime()}
              className="w-full bg-slate-200 border-[3px] border-slate-300 rounded-xl px-4 py-2 font-black text-xs text-slate-500 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-6">
          <div className="bg-white border-[3px] border-black p-5 rounded-3xl shadow-[4px_4px_0px_0px_black] relative">
            <div className="absolute -top-3 left-4 bg-[var(--primary)] text-white px-3 py-1 rounded-lg border-2 border-black font-black text-[8px] uppercase tracking-widest">
              Datos del humano
            </div>
            <div className="space-y-4 pt-2">
              <BrutalInput
                label="Nombre del dueño"
                icon={User}
                placeholder="Ej. Juan Pérez"
                value={bookingData.ownerName}
                onChange={(event) => setBookingData({ ...bookingData, ownerName: event.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <BrutalInput
                  label="Teléfono"
                  icon={Phone}
                  placeholder="Ej. 555-0192"
                  value={bookingData.phone}
                  onChange={(event) => setBookingData({ ...bookingData, phone: event.target.value })}
                />
                <BrutalInput
                  label="CI / Documento"
                  icon={AlertCircle}
                  placeholder="Ej. 12345678"
                  value={bookingData.ci}
                  onChange={(event) => setBookingData({ ...bookingData, ci: event.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="bg-white border-[3px] border-black p-5 rounded-3xl shadow-[4px_4px_0px_0px_black] relative">
            <div className="absolute -top-3 left-4 bg-[var(--secondary)] text-black px-3 py-1 rounded-lg border-2 border-black font-black text-[8px] uppercase tracking-widest">
              Datos de la mascota
            </div>
            <div className="space-y-4 pt-2">
              <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl border-2 border-black">
                <button
                  onClick={() => setBookingData({ ...bookingData, petType: 'perro' })}
                  className={`flex-1 py-2 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all ${
                    bookingData.petType === 'perro' ? 'bg-black text-white shadow-md' : 'text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  🐶 Perro
                </button>
                <button
                  onClick={() => setBookingData({ ...bookingData, petType: 'gato' })}
                  className={`flex-1 py-2 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all ${
                    bookingData.petType === 'gato' ? 'bg-black text-white shadow-md' : 'text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  🐱 Gato
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <BrutalInput
                  label="Nombre mascota"
                  placeholder="Ej. Max"
                  value={bookingData.petName}
                  onChange={(event) => setBookingData({ ...bookingData, petName: event.target.value })}
                />
                <BrutalInput
                  label="Raza"
                  placeholder="Ej. Poodle"
                  value={bookingData.breed}
                  onChange={(event) => setBookingData({ ...bookingData, breed: event.target.value })}
                />
              </div>
              <div className="mt-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">
                  Notas / Observaciones
                </label>
                <textarea
                  placeholder="Ej. Tiene un raspón en la pata derecha..."
                  value={bookingData.notes}
                  onChange={(event) => setBookingData({ ...bookingData, notes: event.target.value })}
                  className="w-full bg-slate-50 border-[3px] border-black rounded-2xl px-4 py-3 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-[var(--primary)] resize-none h-20"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border-[3px] border-black p-5 rounded-3xl shadow-[4px_4px_0px_0px_black] relative">
            <div className="absolute -top-3 left-4 bg-indigo-500 text-white px-3 py-1 rounded-lg border-2 border-black font-black text-[8px] uppercase tracking-widest">
              Selección de servicio
            </div>
            <div className="space-y-3 pt-2">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => setBookingData({ ...bookingData, serviceId: service.id })}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border-[3px] transition-all ${
                    bookingData.serviceId === service.id
                      ? 'border-indigo-500 bg-indigo-50 shadow-[4px_4px_0px_0px_#6366f1]'
                      : 'border-slate-200 bg-white hover:border-black'
                  }`}
                >
                  <div className="text-left">
                    <h4 className="font-black text-sm uppercase italic">{service.nombre}</h4>
                    <p className="text-[10px] font-bold text-slate-400">{service.duracion_base_minutos} min</p>
                  </div>
                  <div className="font-black text-lg">${service.precio_base}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 border-[3px] border-dashed border-slate-300 p-5 rounded-3xl relative">
            <div className="absolute -top-3 left-4 bg-slate-700 text-white px-3 py-1 rounded-lg border-2 border-black font-black text-[8px] uppercase tracking-widest flex items-center gap-1">
              <Activity size={10} /> Perfil clínico / modificadores
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase mb-3 pt-2">
              Selecciona condiciones especiales (afecta tiempo/precio).
            </p>
            <div className="grid grid-cols-2 gap-3">
              {modifiers.map((modifier) => {
                const isSelected = bookingData.modifiers.includes(modifier.id);
                const Icon = ICON_BY_NAME[modifier.icon_name] || AlertCircle;
                return (
                  <button
                    key={modifier.id}
                    onClick={() => toggleModifier(modifier.id)}
                    className={`flex flex-col p-3 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-black shadow-[3px_3px_0px_0px_black] bg-amber-50'
                        : 'border-slate-200 bg-white hover:border-black'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon size={16} className={isSelected ? 'text-black' : 'text-slate-400'} />
                      <span className="font-black text-[10px] uppercase leading-tight">
                        {modifier.criterio || modifier.valor || 'Modificador'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-bold">
                      <span className="text-slate-500">+{modifier.tiempo_extra_minutos || 0}m</span>
                      <span className="text-emerald-600">+${modifier.precio_adicional || 0}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <button
        disabled={actionKey === 'reservation-create'}
        onClick={submitQuickBooking}
        className="w-full bg-black text-white py-5 rounded-2xl border-[3px] border-black font-black text-lg uppercase tracking-widest italic shadow-[6px_6px_0px_0px_var(--primary)] hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-60"
      >
        Confirmar reserva <CheckCircle2 size={24} />
      </button>
    </PopModal>
  );
};

ReceptionQuickBookModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  defaultGroomerId: PropTypes.string,
  defaultStartTime: PropTypes.string,
  services: PropTypes.array.isRequired,
  groomers: PropTypes.array.isRequired,
  modifiers: PropTypes.array.isRequired,
  selectedDate: PropTypes.string.isRequired,
  onRefresh: PropTypes.func.isRequired,
};

export default ReceptionQuickBookModal;
