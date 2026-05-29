import React from 'react';
import PropTypes from 'prop-types';
import { Activity, ArrowRight, AlertTriangle, XCircle, CalendarPlus } from 'lucide-react';
import { useClientLiveTracking } from '../../../../store/ClientTrackingContext';
import DashboardHeader from './DashboardHeader';
import DashboardUpcomingAppointments from './DashboardUpcomingAppointments';
import DashboardSidebar from './DashboardSidebar';

const ClientDashboardView = ({
  currentUser,
  pets = [],
  appointments = [],
  onStartNewBooking,
  onQuickRebook,
  onCancelAppointment,
  saving = false,
  onOpenProposal
}) => {
  const {
    activeCita,
    checklist,
    puntosLealtad,
    setShowLiveTrackingOverlay
  } = useClientLiveTracking();

  const userName = currentUser?.nombre_completo || 'Cliente';

  const pendingProposal = appointments.find((app) => app.estado_propuesta === 'pendiente');

  // pastAppointments still needed for sidebar history
  const now = new Date();
  const pastAppointments = appointments.filter(
    (app) => new Date(app.fecha_hora_inicio) < now && app.estado !== 'programada' && app.estado !== 'agendada'
  );

  const totalPasos = checklist.length;
  const pasosCompletados = checklist.filter((p) => p.completado).length;
  const progresoPorcentaje = totalPasos > 0 ? Math.round((pasosCompletados / totalPasos) * 100) : 0;

  return (
    <div className="pb-24 h-full">
      {/* 1. Header con puntos de lealtad */}
      <DashboardHeader
        userName={userName}
        puntosLealtad={puntosLealtad}
        currentUser={currentUser}
        onStartNewBooking={onStartNewBooking}
      />

      {/* 2. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left column: Active visit + Upcoming appointments */}
        <section className="lg:col-span-8 space-y-8">
          {/* Banner de propuesta de cambio */}
          {pendingProposal && (
            <div 
              onClick={() => onOpenProposal(pendingProposal)}
              className="bg-yellow-100 border-[3.5px] border-yellow-500 rounded-2xl p-4 flex items-center justify-between shadow-[4px_4px_0px_0px_#eab308] cursor-pointer hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#eab308] active:translate-y-0 active:shadow-[2px_2px_0px_0px_#eab308] transition-all animate-pulse"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-yellow-600 shrink-0" size={20} strokeWidth={3} />
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase text-yellow-800">Propuesta de Cambio Pendiente</p>
                  <p className="text-xs font-bold text-slate-700">Recepción propone un cambio para {pendingProposal.mascota?.nombre}. Toca aquí para ver detalles.</p>
                </div>
              </div>
              <ArrowRight className="text-yellow-600 shrink-0" size={16} strokeWidth={3} />
            </div>
          )}


          {/* Tarjeta de Visita Activa */}
          {activeCita && (
            <div className="space-y-4 animate-in fade-in duration-500">
              <h2 className="text-[15px] font-black uppercase italic flex items-center gap-2 text-slate-800 border-l-[4px] border-blue-500 pl-3">
                <Activity size={20} className="text-blue-500" strokeWidth={3} /> Visita Activa
              </h2>
              <div 
                onClick={() => setShowLiveTrackingOverlay(true)}
                className="bg-white border-[4px] border-black rounded-[2rem] p-6 md:p-8 shadow-[8px_8px_0px_0px_black] cursor-pointer hover:-translate-y-0.5 hover:shadow-[10px_10px_0px_0px_black] transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-bl-full z-0 opacity-40 transition-transform group-hover:scale-105"></div>
                <div className="relative z-10 flex flex-col sm:flex-row justify-between sm:items-center gap-6 mb-6">
                  <div className="flex items-center gap-4">
                    <img
                      src={
                        activeCita.mascota?.foto_perfil_url ||
                        `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${activeCita.mascota?.nombre || 'Max'}&backgroundColor=fbbf24`
                      }
                      alt="Pet"
                      className="w-16 h-16 md:w-20 md:h-20 rounded-full border-[3px] border-black bg-yellow-100 shadow-[4px_4px_0px_0px_black] object-cover shrink-0"
                    />
                    <div>
                      <h3 className="font-black text-2xl md:text-3xl uppercase leading-none text-slate-900">
                        {activeCita.mascota?.nombre}
                      </h3>
                      <span className="text-[10px] md:text-xs bg-emerald-100 text-emerald-800 border-2 border-black px-2.5 py-0.5 rounded font-black uppercase tracking-widest flex items-center w-max mt-2 gap-1.5 shadow-sm">
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span>Spa en Progreso</span>
                      </span>
                    </div>
                  </div>
                  <div className="hidden sm:flex bg-black text-white px-5 py-2.5 rounded-xl border-[3.5px] border-black font-black text-xs items-center gap-2 hover:scale-105 transition-transform shadow-[3px_3px_0px_0px_var(--primary)]">
                    <span>Tracker en Vivo</span>
                    <ArrowRight size={16} strokeWidth={3} />
                  </div>
                </div>

                <div className="relative z-10">
                  <p className="font-bold text-slate-600 mb-2 uppercase text-xs flex justify-between tracking-wider">
                    <span>{activeCita.servicio?.nombre}</span>
                    <span>{pasosCompletados}/{totalPasos} Pasos</span>
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-5 bg-slate-100 border-[3px] border-black rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--primary)] relative transition-all duration-700"
                        style={{ width: `${progresoPorcentaje}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 w-full animate-pulse"></div>
                      </div>
                    </div>
                    <span className="font-black text-lg text-[var(--primary)]">{progresoPorcentaje}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DashboardUpcomingAppointments
            appointments={appointments}
            onCancelAppointment={onCancelAppointment}
            onStartNewBooking={onStartNewBooking}
            onQuickRebook={onQuickRebook}
            saving={saving}
          />
        </section>

        {/* Right column: Pets list and History */}
        <section className="lg:col-span-4">
          <DashboardSidebar
            pets={pets}
            pastAppointments={pastAppointments}
            onQuickRebook={onQuickRebook}
          />
        </section>
      </div>
    </div>
  );
};

ClientDashboardView.propTypes = {
  currentUser: PropTypes.object,
  pets: PropTypes.array,
  appointments: PropTypes.array,
  onStartNewBooking: PropTypes.func.isRequired,
  onQuickRebook: PropTypes.func.isRequired,
  onCancelAppointment: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  onOpenProposal: PropTypes.func.isRequired,
};

export default ClientDashboardView;
