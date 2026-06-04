import { useState } from 'react';
import PropTypes from 'prop-types';
import { BarChart3, ShieldAlert, History, CheckCircle2, Search, RefreshCcw } from 'lucide-react';
import { useGroomingMonitor } from '../hooks/useGroomingMonitor';
import GroomerColumn from '../components/dashboard/GroomerColumn';
import TriageAlertCard from '../components/triage/TriageAlertCard';
import QualityCheckCard from '../components/triage/QualityCheckCard';
import HistoryStats from '../components/history/HistoryStats';
import AuditModal from '../components/modal/AuditModal';
import PopBadge from '../components/shared/PopBadge';

const TABS = [
  { id: 'dashboard', label: 'En Vivo', icon: BarChart3 },
  { id: 'triage', label: 'Triage', icon: ShieldAlert, alertKey: 'triage' },
  { id: 'history', label: 'Historial', icon: History },
];

// ── Vistas por pestaña ──────────────────────────────────────────────────────

const DashboardTab = ({ groomers, citas, onOpenFicha, onDrop }) => (
  <div className="flex gap-6 pb-8 overflow-x-auto snap-x min-h-[500px]">
    {groomers.length === 0 && (
      <div className="flex-1 flex items-center justify-center text-slate-400 font-black uppercase">
        No hay groomers activos hoy
      </div>
    )}
    {groomers.map((groomer, index) => (
      <GroomerColumn
        key={groomer.id}
        groomer={groomer}
        index={index}
        citas={citas.filter((c) => c.groomer_id === groomer.id)}
        onOpenFicha={onOpenFicha}
        onDrop={onDrop}
      />
    ))}
  </div>
);

DashboardTab.propTypes = {
  groomers: PropTypes.array.isRequired,
  citas: PropTypes.array.isRequired,
  onOpenFicha: PropTypes.func.isRequired,
  onDrop: PropTypes.func.isRequired,
};

// ─────────────────────────────────────────────────────────────────────────────

const TriageTab = ({ fichasConAlertas, completedToday, onOpenFicha, onApproveAlert }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
      {/* Bandeja de Triage */}
      <div className="bg-white border-[4px] border-black p-6 md:p-8 rounded-[2.5rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 border-b-[4px] border-black pb-4 gap-4">
          <h2 className="text-2xl md:text-3xl font-black uppercase italic flex items-center gap-3">
            <ShieldAlert size={36} className="text-rose-500 shrink-0" />
            Bandeja de Triage{' '}
            <PopBadge color="bg-rose-500" textColor="text-white" className="ml-2 text-sm">
              {fichasConAlertas.length}
            </PopBadge>
          </h2>
          <p className="text-xs font-black text-slate-400 uppercase md:max-w-xs md:text-right">
            Aprueba recargos reportados por groomers antes de facturar.
          </p>
        </div>

        {fichasConAlertas.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 size={64} className="mx-auto text-emerald-400 mb-4" />
            <h3 className="font-black text-xl uppercase">Todo al día</h3>
            <p className="text-slate-500 font-bold text-sm">No hay reportes extra pendientes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {fichasConAlertas.map((alerta) => (
              <TriageAlertCard
                key={alerta.id}
                alerta={alerta}
                onApprove={() => onApproveAlert(alerta.id, alerta.tipo, alerta.recargo)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Control de Calidad */}
      <h3 className="font-black text-xl uppercase italic mb-4 mt-12 pl-2 border-l-8 border-black">
        Control de Calidad (Recientes)
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {completedToday.map((cita) => (
          <QualityCheckCard key={cita.id} cita={cita} onOpenFicha={onOpenFicha} />
        ))}
        {completedToday.length === 0 && (
          <p className="text-slate-400 font-black uppercase text-sm col-span-3 text-center py-8">
            No hay citas completadas hoy aún
          </p>
        )}
      </div>
    </div>
  );
};

TriageTab.propTypes = {
  fichasConAlertas: PropTypes.array.isRequired,
  completedToday: PropTypes.array.isRequired,
  onOpenFicha: PropTypes.func.isRequired,
  onApproveAlert: PropTypes.func.isRequired,
};

// ─────────────────────────────────────────────────────────────────────────────

const HistoryTab = ({ statsToday }) => (
  <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 flex flex-col gap-6">
    {/* Buscador */}
    <div className="bg-white border-[4px] border-black rounded-[2rem] p-6 shadow-[8px_8px_0px_0px_black] relative">
      <div className="absolute -top-3 left-8 bg-black text-white px-4 py-1 rounded-md text-[10px] font-black uppercase tracking-widest shadow-sm z-10">
        Buscador Maestro Clínico
      </div>
      <div className="relative flex items-center">
        <input
          type="text"
          placeholder="Buscar por nombre de mascota, dueño..."
          className="w-full bg-slate-50 border-[3px] border-black text-black font-black rounded-xl py-4 pl-6 pr-16 text-sm md:text-lg outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_var(--primary)] transition-all shadow-inner"
        />
        <div className="absolute right-3 bg-[var(--primary)] text-white w-10 h-10 md:w-12 md:h-12 rounded-lg border-[3px] border-black flex items-center justify-center shadow-[3px_3px_0px_0px_black] cursor-pointer hover:scale-105 active:scale-95 transition-transform">
          <Search size={20} strokeWidth={3} />
        </div>
      </div>
    </div>

    <HistoryStats
      completados={statsToday.completados}
      retrasados={statsToday.retrasados}
      recargos={0}
    />
  </div>
);

HistoryTab.propTypes = {
  statsToday: PropTypes.object.isRequired,
};

// ── Vista principal ──────────────────────────────────────────────────────────

const GroomingMonitorView = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const {
    groomers,
    citas,
    completedToday,
    loading,
    selectedFicha,
    loadingFicha,
    statsToday,
    openFicha,
    closeFicha,
    handleDrop,
    approveAlert,
    refresh,
  } = useGroomingMonitor();

  // Derivar alertas de triage a partir de citas activas con ficha que tiene flags
  // (en producción real vendrían de fichas con nudos/pulgas/heridas = true)
  // Por ahora: citas cuya ficha tenga algún flag activo
  const fichasConAlertas = citas
    .filter((c) => c.ficha?.estado_ingreso_nudos || c.ficha?.estado_ingreso_pulgas || c.ficha?.estado_ingreso_heridas)
    .map((c) => ({
      id: c.id,
      mascotaNombre: c.mascota?.nombre || 'Mascota',
      groomerNombre: c.groomer?.nombre_completo || 'Groomer',
      tipo: c.ficha?.estado_ingreso_nudos
        ? 'nudos'
        : c.ficha?.estado_ingreso_pulgas
        ? 'pulgas'
        : 'heridas',
      descripcion: c.ficha?.observaciones_groomer || 'Sin descripción',
      recargo: 50, // Placeholder — en producción vendría de un campo en BD
      foto: c.ficha?.fotos?.[0]?.url_foto || null,
    }));

  const hasTriageAlert = fichasConAlertas.length > 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <RefreshCcw size={48} className="animate-spin text-[var(--primary)]" strokeWidth={3} />
        <p className="font-black uppercase text-sm text-slate-400 tracking-widest">
          Cargando monitor de grooming...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[600px] flex flex-col relative">

      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Administración</p>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic flex items-center gap-3 leading-none">
            Monitor <span className="text-[var(--primary)]">Grooming</span>
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-black" />
            </span>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Operaciones en Vivo</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const showAlert = tab.alertKey === 'triage' && hasTriageAlert;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-[3px] border-black font-black text-xs uppercase tracking-wider transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-black text-white shadow-[4px_4px_0px_0px_var(--primary)]'
                    : 'bg-white text-slate-600 hover:bg-slate-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1'
                }`}
              >
                <Icon size={16} />
                {tab.label}
                {showAlert && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 bg-rose-500 border-2 border-black rounded-full animate-bounce" />
                )}
              </button>
            );
          })}

          {/* Refresh */}
          <button
            onClick={refresh}
            className="p-2.5 bg-white border-[3px] border-black rounded-xl shadow-[3px_3px_0px_0px_black] hover:-translate-y-0.5 transition-all active:translate-y-0.5 active:shadow-none"
            title="Actualizar datos"
          >
            <RefreshCcw size={16} strokeWidth={3} />
          </button>
        </div>
      </header>

      {/* Contenido */}
      <div className="flex-1">
        {activeTab === 'dashboard' && (
          <DashboardTab
            groomers={groomers}
            citas={citas}
            onOpenFicha={openFicha}
            onDrop={handleDrop}
          />
        )}
        {activeTab === 'triage' && (
          <TriageTab
            fichasConAlertas={fichasConAlertas}
            completedToday={completedToday}
            onOpenFicha={openFicha}
            onApproveAlert={approveAlert}
          />
        )}
        {activeTab === 'history' && <HistoryTab statsToday={statsToday} />}
      </div>

      {/* Modal de Auditoría */}
      <AuditModal
        selectedFicha={selectedFicha}
        loadingFicha={loadingFicha}
        onClose={closeFicha}
      />
    </div>
  );
};

export default GroomingMonitorView;
