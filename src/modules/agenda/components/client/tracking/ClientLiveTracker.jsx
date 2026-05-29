import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Activity, ShieldCheck, Sparkles, AlertTriangle, ArrowRight } from 'lucide-react';
import { useClientLiveTracking } from '../../../../../store/ClientTrackingContext';

export default function ClientLiveTracker() {
  const {
    activeCita,
    checklist,
    eventos,
    showLiveTrackingOverlay,
    setShowLiveTrackingOverlay,
    setShowCheckoutModal
  } = useClientLiveTracking();

  const [timeRemaining, setTimeRemaining] = useState(0);

  // Efecto para calcular el tiempo restante en minutos
  useEffect(() => {
    if (!activeCita) return;

    const calculateRemaining = () => {
      if (activeCita.estado === 'completada') {
        setTimeRemaining(0);
        return;
      }
      const fin = new Date(activeCita.fecha_hora_fin);
      const now = new Date();
      const diffMin = Math.max(0, Math.ceil((fin - now) / 60000));
      setTimeRemaining(diffMin);
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 10000); // Refrescar cada 10 segundos
    return () => clearInterval(interval);
  }, [activeCita]);

  if (!showLiveTrackingOverlay || !activeCita) return null;

  // Encontrar el paso actual
  const pasoActualIndex = checklist.findIndex((p) => !p.completado);
  const pasoActual = pasoActualIndex !== -1 ? checklist[pasoActualIndex] : null;

  // Progreso en porcentaje
  const totalPasos = checklist.length;
  const pasosCompletados = checklist.filter((p) => p.completado).length;
  const progresoPorcentaje = totalPasos > 0 ? Math.round((pasosCompletados / totalPasos) * 100) : 0;

  const petPhoto = activeCita.mascota?.foto_perfil_url || `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${activeCita.mascota?.nombre || 'Max'}&backgroundColor=fbbf24`;
  const groomerPhoto = activeCita.groomer?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeCita.groomer?.nombre_completo || 'Groomer'}`;

  return (
    <div className="fixed inset-0 z-[100] bg-[#f8fafc] flex flex-col overflow-y-auto animate-in slide-in-from-right-10 duration-300">
      
      {/* Cabecera pegajosa */}
      <div className="p-4 md:p-6 flex items-center justify-between border-b-[4px] border-black bg-white sticky top-0 z-20 shadow-sm">
        <button
          onClick={() => setShowLiveTrackingOverlay(false)}
          className="bg-slate-100 border-[3px] border-black p-2.5 rounded-xl shadow-[4px_4px_0px_0px_black] hover:-translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-transform flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft size={18} strokeWidth={3} />
          <span className="hidden sm:inline font-black uppercase text-xs">Volver</span>
        </button>

        <span className="font-black uppercase tracking-widest text-xs sm:text-sm bg-black text-white px-5 py-2.5 rounded-full border-[3px] border-black shadow-[4px_4px_0px_0px_var(--primary)] flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></span> Seguimiento en Vivo
        </span>
        <div className="w-10 sm:w-20"></div>
      </div>

      {/* Grid del Dashboard */}
      <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8">
        
        {/* Columna Izquierda: Información de la mascota, groomer y tiempo */}
        <div className="w-full lg:w-1/3 space-y-6">
          
          {/* Card de Mascota */}
          <div className="bg-cyan-100 border-[4px] border-black rounded-[2.5rem] p-6 shadow-[8px_8px_0px_0px_black] relative overflow-hidden text-center">
            <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-200 rounded-bl-full z-0 opacity-40"></div>
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-28 h-28 bg-white rounded-full border-[4px] border-black shadow-[5px_5px_0px_0px_black] overflow-hidden mb-4">
                <img src={petPhoto} alt="Pet" className="w-full h-full object-cover scale-110" />
              </div>
              <h2 className="text-3xl font-black uppercase italic leading-none mb-2 text-slate-900">
                {activeCita.mascota?.nombre}
              </h2>
              <span className="font-black text-[10px] text-cyan-900 uppercase bg-cyan-200 border-[2.5px] border-black px-3.5 py-1 rounded-full shadow-sm">
                {activeCita.mascota?.raza || 'Mascota'}
              </span>
            </div>
            
            {/* Ficha del Groomer */}
            <div className="bg-white border-[3px] border-black rounded-2xl p-4 flex items-center justify-between shadow-inner relative z-10 mt-6">
              <div className="flex items-center gap-3">
                <img src={groomerPhoto} alt="Stylist" className="w-12 h-12 rounded-full border-2 border-black bg-slate-100" />
                <div className="text-left">
                  <p className="text-[9px] font-black uppercase text-slate-400 leading-none mb-1">Estilista Asignado</p>
                  <p className="font-black uppercase text-xs sm:text-sm text-slate-800">{activeCita.groomer?.nombre_completo || 'Estilista Profesional'}</p>
                </div>
              </div>
              <ShieldCheck className="text-emerald-500 shrink-0" size={24} strokeWidth={3} />
            </div>
          </div>

          {/* Card de Tiempo Restante */}
          <div className="bg-yellow-300 border-[4px] border-black rounded-[2rem] p-6 shadow-[6px_6px_0px_0px_black] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white p-3 rounded-full border-[3px] border-black shadow-sm">
                <Clock size={20} strokeWidth={3} />
              </div>
              <span className="font-black uppercase text-xs leading-tight text-yellow-950">
                Tiempo<br />Estimado
              </span>
            </div>
            <div className="bg-black text-white border-[3px] border-black px-5 py-2.5 rounded-xl shadow-[3px_3px_0px_0px_white]">
              <span className="font-black text-3xl font-mono tracking-tighter">
                {activeCita.estado === 'pausada' ? 'PAUSA' : timeRemaining}
              </span>
              {activeCita.estado !== 'pausada' && (
                <span className="text-[9px] font-black uppercase ml-1 tracking-wider">min</span>
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Timeline de pasos y logs de eventos */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          
          {/* Panel de Tareas */}
          <div className="bg-white border-[4px] border-black rounded-[2.5rem] p-6 md:p-8 shadow-[8px_8px_0px_0px_black] overflow-x-auto">
            <h3 className="font-black uppercase text-base text-slate-800 mb-8 flex items-center gap-2">
              Progreso del Servicio
            </h3>

            {/* Timeline Horizontal */}
            {totalPasos > 0 ? (
              <div className="relative mt-6 mb-4 min-w-[500px] px-4">
                {/* Línea de fondo */}
                <div className="absolute top-1/2 left-0 w-full h-2.5 bg-slate-100 border-y-[2.5px] border-black -translate-y-1/2 z-0"></div>
                {/* Línea de progreso */}
                <div
                  className="absolute top-1/2 left-0 h-2.5 bg-[var(--primary)] border-y-[2.5px] border-black -translate-y-1/2 z-0 transition-all duration-1000 ease-in-out"
                  style={{ width: `${progresoPorcentaje}%` }}
                ></div>
                
                {/* Nodos de tareas */}
                <div className="relative z-10 flex justify-between">
                  {checklist.map((paso) => {
                    const isCompleted = paso.completado;
                    const isCurrent = pasoActual && pasoActual.id === paso.id;
                    return (
                      <div key={paso.id} className="flex flex-col items-center gap-2.5 w-20">
                        <div
                          className={`w-11 h-11 rounded-full border-[3px] border-black flex items-center justify-center transition-all duration-500 z-10 shadow-sm ${
                            isCompleted
                              ? 'bg-emerald-400 text-black'
                              : isCurrent
                              ? 'bg-[var(--secondary)] text-black scale-110 shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-pulse'
                              : 'bg-white text-slate-300'
                          }`}
                        >
                          <span className="font-black text-xs">{paso.icon || paso.orden}</span>
                        </div>
                        <span
                          className={`text-[9px] font-black uppercase tracking-wider text-center leading-tight ${
                            isCurrent ? 'text-black' : 'text-slate-400'
                          }`}
                        >
                          {paso.nombre}
                        </span>
                      </div>
                    );
                  })}
                  
                  {/* Nodo final de Listo */}
                  <div className="flex flex-col items-center gap-2.5 w-20">
                    <div
                      className={`w-11 h-11 rounded-full border-[3px] border-black flex items-center justify-center transition-all duration-500 z-10 shadow-sm ${
                        activeCita.estado === 'completada'
                          ? 'bg-emerald-400 text-black shadow-[0_0_15px_rgba(52,211,153,0.6)] animate-bounce'
                          : 'bg-white text-slate-300'
                      }`}
                    >
                      <Sparkles size={16} strokeWidth={3} />
                    </div>
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider text-center leading-tight ${
                        activeCita.estado === 'completada' ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    >
                      Listo
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs font-black uppercase text-slate-400 tracking-widest">
                Cargando secuencia de tareas...
              </div>
            )}
          </div>

          {/* Feed de Eventos */}
          <div className="bg-slate-50 border-[4px] border-black rounded-[2.5rem] p-6 md:p-8 flex-1">
            <h3 className="font-black uppercase text-sm text-slate-800 mb-6 flex items-center gap-2 border-b-[2.5px] border-black pb-4">
              <Activity size={18} className="text-blue-500" strokeWidth={3} /> Historial del Servicio
            </h3>
            
            <div className="space-y-5 max-h-[30vh] overflow-y-auto pr-2">
              {eventos.length > 0 ? (
                eventos.map((ev) => (
                  <div key={ev.id} className="flex gap-4 animate-in slide-in-from-left-8 duration-500">
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-3.5 h-3.5 rounded-full bg-black border-[2.5px] border-white shadow-[0_0_0_1.5px_black] mt-1 z-10"></div>
                      <div className="w-0.5 flex-1 bg-slate-300 my-1 rounded-full"></div>
                    </div>
                    <div className="pb-2">
                      <span className="bg-black text-white px-2.5 py-0.5 rounded text-[8px] font-black tracking-widest shadow-sm">
                        {ev.hora}
                      </span>
                      <p className="font-bold text-xs sm:text-sm text-slate-700 mt-2">{ev.texto}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[10px] font-black uppercase text-slate-400 py-4 text-center">
                  Preparando el reporte de estética...
                </p>
              )}
            </div>
          </div>

          {/* Botón de Checkout */}
          {activeCita.estado === 'completada' && (
            <button
              onClick={() => setShowCheckoutModal(true)}
              className="w-full py-5 bg-emerald-400 text-black border-[4px] border-black rounded-2xl font-black uppercase text-sm tracking-wider shadow-[6px_6px_0px_0px_black] hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_black] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer animate-bounce"
            >
              <span>¡Ir al Check-Out!</span>
              <ArrowRight size={20} strokeWidth={3} />
            </button>
          )}

        </div>
      </div>
    </div>
  );
}
