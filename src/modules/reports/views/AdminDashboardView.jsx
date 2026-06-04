import React, { useMemo } from 'react';
import { DollarSign, Calendar, Users, Activity, AlertOctagon, TrendingUp } from 'lucide-react';
import { useAuth } from '../../../store/AuthContext';
import { useAgendaData } from '../../agenda/hooks/useAgendaData';

/**
 * AdminDashboardView — Vista de panel de control principal consolidado para el rol Admin.
 * Muestra métricas clave en tiempo real, alertas operativas y la carga del staff.
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

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-8 pb-10">
      <div>
        <h2 className="text-4xl font-black italic uppercase tracking-tighter">
          Centro de <span className="text-[var(--primary)]">Comando</span>
        </h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
          Visión global de operaciones y agenda en tiempo real
        </p>
      </div>

      {loading && (
        <div className="bg-white border-[3px] border-black rounded-2xl px-4 py-3 font-black uppercase text-[10px] tracking-widest shadow-[4px_4px_0px_0px_black] animate-pulse">
          Sincronizando operaciones...
        </div>
      )}

      {/* Alertas dinámicas */}
      {!loading && (
        <div className="flex flex-col gap-4">
          {appointments.length > 5 && (
            <div className="bg-amber-300 border-[4px] border-black p-5 rounded-[2rem] shadow-[6px_6px_0px_0px_black] flex items-center gap-4 -rotate-1">
              <div className="bg-black text-amber-300 p-3 rounded-2xl border-[3px] border-black/20">
                <AlertOctagon size={24} strokeWidth={3} />
              </div>
              <div>
                <h4 className="font-black uppercase italic leading-none text-lg">Carga Operativa Alta</h4>
                <p className="text-xs font-bold mt-1">Hay un flujo considerable de citas registradas para hoy. Monitorea el estado de las asignaciones.</p>
              </div>
            </div>
          )}

          {staffList.length === 0 && (
            <div className="bg-rose-300 border-[4px] border-black p-5 rounded-[2rem] shadow-[6px_6px_0px_0px_black] flex items-center gap-4 rotate-1">
              <div className="bg-black text-rose-300 p-3 rounded-2xl border-[3px] border-black/20">
                <Users size={24} strokeWidth={3} />
              </div>
              <div>
                <h4 className="font-black uppercase italic leading-none text-lg">Sin Personal Asignado</h4>
                <p className="text-xs font-bold mt-1">No hay groomers activos registrados en el sistema para la fecha de hoy.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grid de KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1 */}
        <div className="p-8 rounded-[2.5rem] border-[4px] border-black bg-white shadow-[6px_6px_0px_0px_black] transition-all hover:scale-105 rotate-1">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-5 border-4 border-black">
            <DollarSign size={24} strokeWidth={3} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Ingresos Proyectados
          </p>
          <h4 className="text-3xl font-black text-slate-800">${totalRevenue}</h4>
        </div>

        {/* KPI 2 */}
        <div className="p-8 rounded-[2.5rem] border-[4px] border-black bg-white shadow-[6px_6px_0px_0px_black] transition-all hover:scale-105 -rotate-1">
          <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-5 border-4 border-black">
            <Activity size={24} strokeWidth={3} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Ocupación Global
          </p>
          <h4 className="text-3xl font-black text-slate-800">{completionRate}%</h4>
        </div>

        {/* KPI 3 */}
        <div className="p-8 rounded-[2.5rem] border-[4px] border-black bg-white shadow-[6px_6px_0px_0px_black] transition-all hover:scale-105 rotate-1">
          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-5 border-4 border-black">
            <Calendar size={24} strokeWidth={3} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Citas de Hoy
          </p>
          <h4 className="text-3xl font-black text-slate-800">{appointments.length}</h4>
        </div>

        {/* KPI 4 */}
        <div className="p-8 rounded-[2.5rem] border-[4px] border-black bg-white shadow-[6px_6px_0px_0px_black] transition-all hover:scale-105 -rotate-1">
          <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-5 border-4 border-black">
            <Users size={24} strokeWidth={3} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Groomers Activos
          </p>
          <h4 className="text-3xl font-black text-slate-800">{staffList.length}</h4>
        </div>
      </div>

      {/* Grid de Estado de Groomers */}
      {!loading && staffList.length > 0 && (
        <div className="bg-white border-[4px] border-black p-6 rounded-[2.5rem] shadow-[8px_8px_0px_0px_black]">
          <h3 className="text-xl font-black uppercase italic mb-4 flex items-center gap-2">
            <Users size={20} className="text-indigo-500" /> Estado y Carga del Staff
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffList.map((staff) => {
              const staffAppointments = appointments.filter(a => a.groomer_id === staff.id);
              const completed = staffAppointments.filter(a => a.estado === 'completada').length;
              return (
                <div key={staff.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border-2 border-black">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full border-2 border-black overflow-hidden ${staff.color}`}>
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${staff.avatar}`} alt={staff.nombre} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase">{staff.nombre}</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{staffAppointments.length} citas hoy</p>
                    </div>
                  </div>
                  <span className={`text-[9px] px-2 py-1 rounded font-black italic uppercase ${completed === staffAppointments.length && staffAppointments.length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                    {staffAppointments.length > 0 ? `${completed}/${staffAppointments.length} Completadas` : 'Sin Citas'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardView;
