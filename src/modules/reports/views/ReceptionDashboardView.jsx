import React, { useEffect, useState, useMemo } from 'react';
import { 
  Calendar, Users, Activity, ShoppingCart, 
  Wallet, ShieldAlert, CheckCircle, Clock, 
  ArrowRight, Inbox, PlusCircle, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../../store/AuthContext';
import { useNavigation } from '../../../store/NavigationContext';
import { useAgendaData } from '../../agenda/hooks/useAgendaData';
import { supabase } from '../../../api/supabase';

/**
 * ReceptionDashboardView — Vista de panel de control principal consolidado para el rol de Recepción.
 * Diseñado bajo la estética Neubrutalism de Moopsic, interactivo y con datos reales integrados.
 */
const ReceptionDashboardView = () => {
  const { currentUser } = useAuth();
  const { setActiveModule } = useNavigation();
  const { data: agendaData, loading: agendaLoading, refresh: refreshAgenda } = useAgendaData({
    role: 'recepcion',
    userId: currentUser?.id,
  });

  const [webReservationsCount, setWebReservationsCount] = useState(0);
  const [criticalProducts, setCriticalProducts] = useState([]);
  const [activeArqueo, setActiveArqueo] = useState(null);
  const [extraLoading, setExtraLoading] = useState(true);

  const appointments = agendaData?.appointments || [];
  const groomers = agendaData?.groomers || [];

  // Saludo según la hora
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }, []);

  const loadExtraData = async () => {
    if (!supabase) return;
    setExtraLoading(true);
    try {
      // 1. Contar reservas web pendientes de aprobación
      const { count } = await supabase
        .from('reservas')
        .select('*', { count: 'exact', head: true })
        .eq('estado_general', 'pendiente');
      setWebReservationsCount(count || 0);

      // 2. Obtener productos con stock crítico
      const { data: products } = await supabase
        .from('productos')
        .select('id, nombre, stock_actual, stock_minimo_alerta, es_insumo');
      
      const lowStock = (products || []).filter(p => p.stock_actual <= p.stock_minimo_alerta);
      setCriticalProducts(lowStock);

      // 3. Buscar arqueo de caja abierto
      const { data: arqueos } = await supabase
        .from('arqueos_caja')
        .select('*')
        .eq('estado', 'abierta')
        .limit(1);
      
      setActiveArqueo(arqueos?.[0] || null);
    } catch (e) {
      console.error('Error al cargar datos adicionales del dashboard de recepción:', e);
    } finally {
      setExtraLoading(false);
    }
  };

  useEffect(() => {
    loadExtraData();
  }, []);

  const handleRefreshAll = () => {
    refreshAgenda();
    loadExtraData();
  };

  // Métricas rápidas calculadas
  const agendaStats = useMemo(() => {
    const total = appointments.length;
    const completed = appointments.filter(a => a.estado === 'completada').length;
    const inProgress = appointments.filter(a => a.estado === 'en_proceso').length;
    const waiting = appointments.filter(a => a.estado === 'en_espera').length;
    const pending = appointments.filter(a => a.estado === 'programada').length;
    
    return { total, completed, inProgress, waiting, pending };
  }, [appointments]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-8 pb-10 max-w-7xl mx-auto">
      
      {/* HEADER / BIENVENIDA */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[14px] font-black text-slate-400 uppercase tracking-widest mt-1">
            {greeting}, {currentUser?.user_metadata?.nombre_completo?.split(' ')[0] || 'Recepcionista'} 👋
          </p>
          <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter mt-1">
            Panel de <span className="text-[var(--primary)]">Recepción</span>
          </h2>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={handleRefreshAll}
             className="p-3 bg-white border-4 border-black rounded-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-none hover:shadow-[2px_2px_0px_0px_black] transition-all shadow-[4px_4px_0px_0px_black]"
             title="Sincronizar Datos"
           >
             <RefreshCw size={18} className={(agendaLoading || extraLoading) ? "animate-spin" : ""} />
           </button>
           <button 
             onClick={() => setActiveModule('agenda')}
             className="flex items-center gap-2 bg-black text-white px-4 py-3 rounded-xl border-4 border-black font-black uppercase text-xs hover:-translate-y-1 transition-transform shadow-[4px_4px_0px_0px_var(--primary)]"
           >
             <PlusCircle size={16} /> Nueva Reserva
           </button>
        </div>
      </div>

      {/* INDICADORES CLAVE (KPIs GRID) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* CARD 1: Citas del Día */}
        <div className="bg-white border-4 border-black rounded-3xl p-5 shadow-[5px_5px_0px_0px_black] flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute right-[-10px] top-[-10px] text-slate-100 group-hover:scale-110 transition-transform -z-10">
            <Calendar size={100} strokeWidth={1} />
          </div>
          <div>
            <div className="bg-indigo-100 text-indigo-700 w-10 h-10 rounded-xl border-2 border-black flex items-center justify-center font-black">
              <Calendar size={20} />
            </div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-4">Citas Programadas</p>
            <h3 className="text-3xl font-black italic uppercase mt-1">
              {agendaStats.total} <span className="text-xs text-slate-400 font-bold">hoy</span>
            </h3>
          </div>
          <div className="mt-4 border-t-2 border-slate-100 pt-3 flex items-center justify-between text-[11px] font-black uppercase text-slate-500">
            <span>Completadas: {agendaStats.completed}</span>
            <span className="text-indigo-600">Activas: {agendaStats.inProgress + agendaStats.waiting}</span>
          </div>
        </div>

        {/* CARD 2: Bandeja Web */}
        <div 
          onClick={() => setActiveModule('agenda')}
          className="bg-white border-4 border-black rounded-3xl p-5 shadow-[5px_5px_0px_0px_black] flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:bg-amber-50 transition-colors"
        >
          <div className="absolute right-[-10px] top-[-10px] text-slate-100 group-hover:scale-110 transition-transform -z-10">
            <Inbox size={100} strokeWidth={1} />
          </div>
          <div>
            <div className="bg-amber-100 text-amber-700 w-10 h-10 rounded-xl border-2 border-black flex items-center justify-center font-black">
              <Inbox size={20} />
            </div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-4">Validación Web</p>
            <h3 className="text-3xl font-black italic uppercase mt-1">
              {webReservationsCount} <span className="text-xs text-slate-400 font-bold">pendientes</span>
            </h3>
          </div>
          <div className="mt-4 border-t-2 border-slate-100 pt-3 flex items-center justify-between text-[11px] font-black uppercase text-amber-600">
            <span>Revisar Bandeja</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* CARD 3: Estado de Caja */}
        <div 
          onClick={() => setActiveModule('cash')}
          className="bg-white border-4 border-black rounded-3xl p-5 shadow-[5px_5px_0px_0px_black] flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:bg-emerald-50 transition-colors"
        >
          <div className="absolute right-[-10px] top-[-10px] text-slate-100 group-hover:scale-110 transition-transform -z-10">
            <Wallet size={100} strokeWidth={1} />
          </div>
          <div>
            <div className={`w-10 h-10 rounded-xl border-2 border-black flex items-center justify-center font-black ${
              activeArqueo ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}>
              <Wallet size={20} />
            </div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-4">Estado de Caja</p>
            <h3 className="text-3xl font-black italic uppercase mt-1">
              {activeArqueo ? 'Abierta' : 'Cerrada'}
            </h3>
          </div>
          <div className="mt-4 border-t-2 border-slate-100 pt-3 flex items-center justify-between text-[11px] font-black uppercase text-slate-500">
            {activeArqueo ? (
              <span className="text-emerald-600">Fondo: ${activeArqueo.monto_inicial}</span>
            ) : (
              <span className="text-rose-600">Requiere apertura</span>
            )}
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* CARD 4: Stock Crítico */}
        <div 
          onClick={() => setActiveModule('inventory')}
          className="bg-white border-4 border-black rounded-3xl p-5 shadow-[5px_5px_0px_0px_black] flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:bg-rose-50 transition-colors"
        >
          <div className="absolute right-[-10px] top-[-10px] text-slate-100 group-hover:scale-110 transition-transform -z-10">
            <ShieldAlert size={100} strokeWidth={1} />
          </div>
          <div>
            <div className="bg-rose-100 text-rose-700 w-10 h-10 rounded-xl border-2 border-black flex items-center justify-center font-black">
              <ShieldAlert size={20} />
            </div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-4">Alertas de Inventario</p>
            <h3 className="text-3xl font-black italic uppercase mt-1">
              {criticalProducts.length} <span className="text-xs text-slate-400 font-bold">artículos</span>
            </h3>
          </div>
          <div className="mt-4 border-t-2 border-slate-100 pt-3 flex items-center justify-between text-[11px] font-black uppercase text-rose-600">
            <span>Ver Inventario</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

      </div>

      {/* QUICK ACTIONS ROW */}
      <div className="bg-slate-100 border-[4px] border-black p-5 rounded-3xl shadow-[5px_5px_0px_0px_black] grid grid-cols-2 md:grid-cols-4 gap-4">
        <button 
          onClick={() => setActiveModule('agenda')} 
          className="bg-white hover:bg-indigo-50 border-4 border-black p-4 rounded-2xl shadow-[3px_3px_0px_0px_black] font-black uppercase text-xs transition-all flex flex-col items-center justify-center gap-2 hover:-translate-y-1 active:translate-y-0 active:shadow-none"
        >
          <Calendar className="text-indigo-600" size={24} />
          <span>Ver Agenda Diaria</span>
        </button>
        <button 
          onClick={() => setActiveModule('inventory')} 
          className="bg-white hover:bg-emerald-50 border-4 border-black p-4 rounded-2xl shadow-[3px_3px_0px_0px_black] font-black uppercase text-xs transition-all flex flex-col items-center justify-center gap-2 hover:-translate-y-1 active:translate-y-0 active:shadow-none"
        >
          <ShoppingCart className="text-emerald-600" size={24} />
          <span>Cobros / POS</span>
        </button>
        <button 
          onClick={() => setActiveModule('cash')} 
          className="bg-white hover:bg-amber-50 border-4 border-black p-4 rounded-2xl shadow-[3px_3px_0px_0px_black] font-black uppercase text-xs transition-all flex flex-col items-center justify-center gap-2 hover:-translate-y-1 active:translate-y-0 active:shadow-none"
        >
          <Wallet className="text-amber-500" size={24} />
          <span>Control de Caja</span>
        </button>
        <button 
          onClick={() => setActiveModule('clients')} 
          className="bg-white hover:bg-purple-50 border-4 border-black p-4 rounded-2xl shadow-[3px_3px_0px_0px_black] font-black uppercase text-xs transition-all flex flex-col items-center justify-center gap-2 hover:-translate-y-1 active:translate-y-0 active:shadow-none"
        >
          <Users className="text-purple-600" size={24} />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* DOS COLUMNAS DE DETALLE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA 1 & 2: Citas en Curso y su Estado */}
        <div className="lg:col-span-2 bg-white border-[5px] border-black rounded-[2rem] p-6 shadow-[8px_8px_0px_0px_black]">
          <h3 className="text-xl font-black uppercase italic tracking-wider border-b-4 border-black pb-3 mb-5 flex items-center justify-between">
            <span>📋 Estado de Servicios hoy</span>
            <span className="text-[10px] not-italic font-bold bg-slate-100 px-3 py-1 border-2 border-black rounded-lg">
              {appointments.length} Total
            </span>
          </h3>

          {appointments.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-bold uppercase text-xs flex flex-col items-center justify-center gap-2">
              <Calendar size={36} className="text-slate-300" />
              <span>No hay citas programadas para hoy</span>
            </div>
          ) : (
            <div className="divide-y-4 divide-black border-4 border-black rounded-3xl overflow-hidden">
              {appointments.map((appt) => {
                const startTime = new Date(appt.fecha_hora_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                const isWaiting = appt.estado === 'en_espera';
                const isInProgress = appt.estado === 'en_proceso';
                const isCompleted = appt.estado === 'completada';

                let statusColor = "bg-slate-100 text-slate-700";
                if (isWaiting) statusColor = "bg-amber-100 text-amber-800 border-amber-400";
                if (isInProgress) statusColor = "bg-indigo-100 text-indigo-800 border-indigo-400";
                if (isCompleted) statusColor = "bg-emerald-100 text-emerald-800 border-emerald-400";

                return (
                  <div key={appt.id} className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 bg-slate-100 border-2 border-black rounded-full shrink-0 flex items-center justify-center font-black text-lg">
                        {appt.mascota?.especie === 'gato' ? '🐱' : '🐶'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-sm uppercase italic leading-tight truncate">
                          {appt.mascota?.nombre || appt.mascota_nombre || 'Paciente'}
                        </h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                          Estilista: {appt.groomer_nombre || 'Por asignar'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-2.5 py-1 border border-black rounded-lg flex items-center gap-1.5">
                        <Clock size={12} /> {startTime}
                      </span>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 border-2 border-black rounded-xl ${statusColor}`}>
                        {appt.estado}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* COLUMNA 3: Insumos Bajos / Alertas y Personal */}
        <div className="space-y-8">
          
          {/* Tarjeta de Stock Crítico */}
          <div className="bg-white border-[5px] border-black rounded-[2rem] p-6 shadow-[8px_8px_0px_0px_black] relative overflow-hidden">
            <h3 className="text-lg font-black uppercase italic tracking-wider border-b-4 border-black pb-3 mb-4">
              🚨 Stock Crítico
            </h3>
            
            {criticalProducts.length === 0 ? (
              <div className="py-6 text-center text-slate-400 font-bold uppercase text-xs flex items-center justify-center gap-2">
                <CheckCircle size={16} className="text-emerald-500" />
                <span>Todo el inventario al día</span>
              </div>
            ) : (
              <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                {criticalProducts.slice(0, 4).map((p) => (
                  <div key={p.id} className="flex justify-between items-center bg-slate-50 border-2 border-black p-3 rounded-2xl shadow-[2px_2px_0px_0px_black]">
                    <div className="min-w-0">
                      <p className="font-black text-xs uppercase leading-tight truncate">{p.nombre}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                        Mínimo Alerta: {p.stock_minimo_alerta}
                      </p>
                    </div>
                    <span className="bg-rose-100 text-rose-800 border border-rose-500 font-black text-xs px-2.5 py-1 rounded-xl shrink-0">
                      Stock: {p.stock_actual}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tarjeta de Staff Disponibles hoy */}
          <div className="bg-white border-[5px] border-black rounded-[2rem] p-6 shadow-[8px_8px_0px_0px_black]">
            <h3 className="text-lg font-black uppercase italic tracking-wider border-b-4 border-black pb-3 mb-4">
              ✂️ Staff de Turno
            </h3>
            <div className="space-y-4">
              {groomers.length === 0 ? (
                <p className="text-xs text-slate-400 font-bold text-center">No hay personal registrado hoy</p>
              ) : (
                groomers.map((g) => (
                  <div key={g.id} className="flex items-center gap-3 bg-slate-50 border-2 border-black p-3 rounded-2xl shadow-[2px_2px_0px_0px_black]">
                    <div className="w-10 h-10 border-2 border-black rounded-full overflow-hidden shrink-0">
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${g.nombre_completo || g.id}`} 
                        alt={g.nombre_completo} 
                      />
                    </div>
                    <div>
                      <p className="font-black text-xs uppercase leading-tight">{g.nombre_completo}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                        Estatus: Activo · Turno Hoy
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default ReceptionDashboardView;
