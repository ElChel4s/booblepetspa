import React, { useMemo } from 'react';
import { 
  DollarSign, Calendar, Users, Activity, AlertOctagon, TrendingUp,
  PlusCircle, ShoppingCart, FileText, ArrowRight
} from 'lucide-react';
import { useAuth } from '../../../store/AuthContext';
import { useAgendaData } from '../../agenda/hooks/useAgendaData';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

/**
 * AdminDashboardView — Vista de panel de control principal consolidado para el rol Admin.
 * Rediseñado con estilo Neubrutalism, Recharts, Quick Actions y Feed de actividad.
 */
const AdminDashboardView = () => {
  const { currentUser } = useAuth();
  const { data: agendaData, loading } = useAgendaData({
    role: 'admin',
    userId: currentUser?.id,
  });

  const appointments = agendaData?.appointments || [];
  const reservations = agendaData?.reservations || [];
  const groomers = agendaData?.groomers || [];

  const totalRevenue = useMemo(() => {
    return Math.round(reservations.reduce((acc, cur) => acc + Number(cur.total_reserva || 0), 0));
  }, [reservations]);

  const completionRate = useMemo(() => {
    if (!appointments.length) return 0;
    const completed = appointments.filter((a) => a.estado === 'completada').length;
    return Math.round((completed / appointments.length) * 100);
  }, [appointments]);

  const staffList = useMemo(() => {
    return groomers.map((groomer, idx) => ({
      id: groomer.id,
      nombre: groomer.nombre_completo,
      rol: 'Groomer',
      color: idx % 2 === 0 ? 'bg-indigo-100' : 'bg-emerald-100',
      avatar: groomer.nombre_completo,
    }));
  }, [groomers]);

  // Datos mockeados para el gráfico (se podrían derivar de un fetch real de la última semana)
  const chartData = useMemo(() => {
    return [
      { name: 'Lun', ingresos: 350 },
      { name: 'Mar', ingresos: 420 },
      { name: 'Mié', ingresos: 280 },
      { name: 'Jue', ingresos: 510 },
      { name: 'Vie', ingresos: 680 },
      { name: 'Sáb', ingresos: 950 },
      { name: 'Hoy', ingresos: totalRevenue || 120 },
    ];
  }, [totalRevenue]);

  const upcomingAppointments = useMemo(() => {
    return appointments
      .filter(a => ['programada', 'en_proceso'].includes(a.estado))
      .sort((a, b) => new Date(a.fecha_hora_inicio) - new Date(b.fecha_hora_inicio))
      .slice(0, 5); // top 5
  }, [appointments]);

  // Saludo según la hora
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }, []);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-8 pb-10 max-w-7xl mx-auto">
      
      {/* HEADER / BIENVENIDA */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[14px] font-black text-slate-400 uppercase tracking-widest mt-1">
            {greeting}, {currentUser?.user_metadata?.nombre_completo?.split(' ')[0] || 'Administrador'} 👋
          </p>
          <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter mt-1">
            Centro de <span className="text-indigo-600">Comando</span>
          </h2>
        </div>
        <div className="flex gap-2">
           <button className="flex items-center gap-2 bg-black text-white px-4 py-3 rounded-xl border-4 border-black font-black uppercase text-xs hover:-translate-y-1 transition-transform shadow-[4px_4px_0px_0px_#4f46e5]">
             <PlusCircle size={16} /> Nueva Cita
           </button>
           <button className="flex items-center gap-2 bg-emerald-300 text-black px-4 py-3 rounded-xl border-4 border-black font-black uppercase text-xs hover:-translate-y-1 transition-transform shadow-[4px_4px_0px_0px_black]">
             <ShoppingCart size={16} /> Venta Rápida
           </button>
        </div>
      </div>

      {loading && (
        <div className="bg-white border-[3px] border-black rounded-2xl px-4 py-3 font-black uppercase text-[10px] tracking-widest shadow-[4px_4px_0px_0px_black] animate-pulse">
          Sincronizando operaciones...
        </div>
      )}

      {/* ALERTAS */}
      {!loading && appointments.length > 5 && (
        <div className="bg-amber-300 border-[4px] border-black p-5 rounded-[1.5rem] shadow-[6px_6px_0px_0px_black] flex items-center gap-4 -rotate-1 hover:rotate-0 transition-transform">
          <div className="bg-black text-amber-300 p-3 rounded-2xl border-[3px] border-black/20">
            <AlertOctagon size={24} strokeWidth={3} />
          </div>
          <div>
            <h4 className="font-black uppercase italic leading-none text-lg">Carga Operativa Alta</h4>
            <p className="text-xs font-bold mt-1">Hay un flujo considerable de citas registradas para hoy. Monitorea el estado de las asignaciones.</p>
          </div>
        </div>
      )}

      {/* Grid de KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="p-6 rounded-[2rem] border-[4px] border-black bg-white shadow-[6px_6px_0px_0px_black] transition-all hover:-translate-y-1">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4 border-4 border-black">
            <DollarSign size={20} strokeWidth={3} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Ingresos Proyectados
          </p>
          <h4 className="text-3xl font-black text-slate-800">${totalRevenue}</h4>
        </div>

        <div className="p-6 rounded-[2rem] border-[4px] border-black bg-white shadow-[6px_6px_0px_0px_black] transition-all hover:-translate-y-1">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4 border-4 border-black">
            <Activity size={20} strokeWidth={3} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Ocupación Global
          </p>
          <div className="flex items-baseline gap-2">
            <h4 className="text-3xl font-black text-slate-800">{completionRate}%</h4>
            <span className="text-xs font-bold text-slate-400">({appointments.filter(a => a.estado === 'completada').length}/{appointments.length})</span>
          </div>
        </div>

        <div className="p-6 rounded-[2rem] border-[4px] border-black bg-white shadow-[6px_6px_0px_0px_black] transition-all hover:-translate-y-1">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 border-4 border-black">
            <Calendar size={20} strokeWidth={3} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Citas de Hoy
          </p>
          <h4 className="text-3xl font-black text-slate-800">{appointments.length}</h4>
        </div>

        <div className="p-6 rounded-[2rem] border-[4px] border-black bg-white shadow-[6px_6px_0px_0px_black] transition-all hover:-translate-y-1 bg-indigo-50">
          <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center mb-4 border-4 border-black">
            <Users size={20} strokeWidth={3} />
          </div>
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">
            Groomers Activos
          </p>
          <h4 className="text-3xl font-black text-indigo-900">{staffList.length}</h4>
        </div>
      </div>

      {/* DASHBOARD MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* GRÁFICO DE ACTIVIDAD Y STAFF (Ocupa 2/3) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Chart Section */}
          <div className="bg-white border-[4px] border-black rounded-[2.5rem] shadow-[8px_8px_0px_0px_black] p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black uppercase italic flex items-center gap-2">
                <TrendingUp size={20} className="text-emerald-500" /> Rendimiento Semanal
              </h3>
              <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-3 py-1 rounded-full uppercase border-2 border-black">
                Últimos 7 Días
              </span>
            </div>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#94a3b8' }} />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '16px', border: '4px solid black', boxShadow: '4px 4px 0px 0px black', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="ingresos" fill="#4f46e5" radius={[8, 8, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Staff Workload */}
          {!loading && staffList.length > 0 && (
            <div className="bg-amber-100 border-[4px] border-black p-6 md:p-8 rounded-[2.5rem] shadow-[8px_8px_0px_0px_black]">
              <h3 className="text-xl font-black uppercase italic mb-6 flex items-center gap-2">
                <Users size={20} className="text-indigo-600" /> Carga Laboral del Staff
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {staffList.map((staff) => {
                  const staffAppointments = appointments.filter(a => a.groomer_id === staff.id);
                  const completed = staffAppointments.filter(a => a.estado === 'completada').length;
                  const progress = staffAppointments.length > 0 ? (completed / staffAppointments.length) * 100 : 0;
                  
                  return (
                    <div key={staff.id} className="bg-white p-4 rounded-2xl border-[3px] border-black relative overflow-hidden group hover:scale-[1.02] transition-transform">
                      {/* Progress bar background */}
                      <div 
                        className="absolute inset-0 bg-emerald-100/50 transition-all duration-1000 ease-out z-0" 
                        style={{ width: `${progress}%` }} 
                      />
                      
                      <div className="relative z-10 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full border-[3px] border-black overflow-hidden bg-slate-200`}>
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${staff.avatar}`} alt={staff.nombre} />
                          </div>
                          <div>
                            <h4 className="text-sm font-black uppercase leading-tight">{staff.nombre}</h4>
                            <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">
                              {staffAppointments.length > 0 ? `${completed} de ${staffAppointments.length} completadas` : 'Día Libre'}
                            </p>
                          </div>
                        </div>
                        {staffAppointments.length > 0 && (
                          <div className="text-right">
                            <span className="text-xl font-black">{Math.round(progress)}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* FEED DE CITAS (Ocupa 1/3) */}
        <div className="bg-slate-800 text-white border-[4px] border-black p-6 md:p-8 rounded-[2.5rem] shadow-[8px_8px_0px_0px_black] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black uppercase italic flex items-center gap-2">
              <Calendar size={20} className="text-blue-400" /> Próximas Citas
            </h3>
          </div>

          <div className="flex-1 space-y-4">
            {upcomingAppointments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60 min-h-[200px]">
                <Calendar size={48} strokeWidth={1.5} className="mb-4" />
                <p className="text-sm font-black uppercase tracking-widest text-center">No hay citas<br/>pendientes hoy</p>
              </div>
            ) : (
              upcomingAppointments.map((cita) => (
                <div key={cita.id} className="bg-slate-700/50 border-2 border-slate-600 rounded-2xl p-4 hover:border-blue-400 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-2 items-center">
                      <span className={`w-2 h-2 rounded-full animate-pulse ${cita.estado === 'en_proceso' ? 'bg-amber-400' : 'bg-blue-400'}`}></span>
                      <span className="text-xs font-black uppercase text-slate-300">
                        {new Date(cita.fecha_hora_inicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase ${
                      cita.estado === 'en_proceso' ? 'bg-amber-400/20 text-amber-400' : 'bg-blue-400/20 text-blue-400'
                    }`}>
                      {cita.estado.replace('_', ' ')}
                    </span>
                  </div>
                  <h4 className="font-bold text-lg leading-tight mb-1">
                    {cita.mascotas?.nombre || 'Mascota'} 
                    <span className="text-sm font-normal text-slate-400 ml-1">
                      ({cita.servicios?.nombre || 'Servicio'})
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Users size={12} /> {cita.perfiles_groomer?.nombre_completo || 'Sin asignar'}
                  </p>
                </div>
              ))
            )}
          </div>

          <button className="mt-6 w-full flex justify-center items-center gap-2 bg-transparent text-blue-400 hover:text-blue-300 font-black uppercase text-xs tracking-widest py-3 border-2 border-slate-600 rounded-xl hover:border-blue-400 transition-all">
            Ver Agenda Completa <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardView;
