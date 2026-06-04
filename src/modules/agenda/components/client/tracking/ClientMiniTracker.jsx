import React from 'react';
import { ChevronDown, AlertTriangle } from 'lucide-react';
import { useClientLiveTracking } from '../../../../../store/ClientTrackingContext';

export default function ClientMiniTracker() {
  const {
    activeCita,
    checklist,
    showLiveTrackingOverlay,
    setShowLiveTrackingOverlay,
    alertaExtra,
    setShowCheckoutModal
  } = useClientLiveTracking();

  // Ocultar si no hay cita o si ya estamos en la pantalla completa de tracking
  if (!activeCita || showLiveTrackingOverlay) return null;

  const totalPasos = checklist.length;
  const pasosCompletados = checklist.filter((p) => p.completado).length;
  const progresoPorcentaje = totalPasos > 0 ? Math.round((pasosCompletados / totalPasos) * 100) : 0;
  const pasoActualIndex = checklist.findIndex((p) => !p.completado);
  const pasoActual = pasoActualIndex !== -1 ? checklist[pasoActualIndex] : null;

  const petPhoto = activeCita.mascota?.foto_perfil_url || `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${activeCita.mascota?.nombre || 'Max'}&backgroundColor=fbbf24`;
  const petName = activeCita.mascota?.nombre || 'Mascota';

  // Lógica del texto principal
  const getStatusText = () => {
    if (alertaExtra) return 'Revisar incidencia del estilista';
    if (activeCita.estado === 'completada') return `¡${petName} terminó y está listo!`;
    if (pasosCompletados === 0 && !pasoActual?.completado) return `${petName} inició su sesión de spa`;
    if (pasoActual) return `${petName} en: Paso ${pasoActual.orden} de ${totalPasos} (${pasoActual.nombre})`;
    return 'Preparando entrega...';
  };

  const handleWidgetClick = () => {
    if (alertaExtra) {
      // El modal de alerta se abre automáticamente cuando hay alertaExtra, pero por si acaso nos aseguramos de que esté a la vista
      return; 
    }
    if (activeCita.estado === 'completada') {
      setShowCheckoutModal(true);
    } else {
      setShowLiveTrackingOverlay(true);
    }
  };

  return (
    <div className="fixed bottom-[90px] md:bottom-6 left-4 right-4 md:left-auto md:right-8 md:w-96 z-50 animate-in slide-in-from-bottom-10">
      <div
        onClick={handleWidgetClick}
        className={`cursor-pointer border-[3.5px] border-black rounded-[2rem] p-4 shadow-[6px_6px_0px_0px_black] flex items-center justify-between transition-all active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_black] hover:-translate-y-0.5 ${
          alertaExtra
            ? 'bg-rose-500 text-white animate-pulse shadow-[6px_6px_0px_0px_#9f1239]'
            : 'bg-white text-slate-800'
        }`}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative shrink-0">
            <img
              src={petPhoto}
              className={`w-14 h-14 rounded-full border-[2.5px] border-black bg-white object-cover ${
                alertaExtra ? 'bg-rose-400' : 'bg-yellow-100'
              }`}
              alt="Mascota en spa"
            />
            <span
              className={`absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white animate-ping ${
                alertaExtra ? 'bg-yellow-400' : 'bg-emerald-400'
              }`}
            ></span>
          </div>
          
          <div className="min-w-0">
            <p
              className={`font-black text-[9px] uppercase tracking-widest leading-none mb-1 opacity-80 ${
                alertaExtra ? 'text-rose-100' : 'text-slate-400'
              }`}
            >
              {alertaExtra ? 'Atención Requerida' : 'Spa en Progreso'}
            </p>
            <p className="font-black text-xs sm:text-xs truncate max-w-[200px] sm:max-w-none">
              {getStatusText()}
            </p>
            {!alertaExtra && activeCita.estado !== 'completada' && (
              <div className="w-32 sm:w-40 h-1.5 bg-slate-100 mt-2 rounded-full overflow-hidden border border-black/10">
                <div
                  className="h-full bg-[var(--primary)] transition-all duration-500"
                  style={{ width: `${progresoPorcentaje}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>

        <ChevronDown className="rotate-[-90deg] opacity-50 shrink-0 ml-2" size={20} strokeWidth={3} />
      </div>
    </div>
  );
}
