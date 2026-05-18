import { DollarSign, Calendar, Users, TrendingUp } from 'lucide-react';

const stats = [
  { label: 'Facturación Hoy', value: '$1,420.50', icon: <DollarSign />, color: 'bg-emerald-100', text: 'text-emerald-600' },
  { label: 'Citas Activas', value: '12', icon: <Calendar />, color: 'bg-blue-100', text: 'text-blue-600' },
  { label: 'Nuevos Clientes', value: '5', icon: <Users />, color: 'bg-purple-100', text: 'text-purple-600' },
  { label: 'Consumo Insumos', value: '85%', icon: <TrendingUp />, color: 'bg-amber-100', text: 'text-amber-600' },
];

/**
 * AdminDashboardView — Vista de panel de control para el rol Admin.
 * Muestra tarjetas de KPIs con estilo Neo-Brutalismo y efecto de rotación alternada.
 */
const AdminDashboardView = () => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`p-8 rounded-[2.5rem] border-[4px] border-black bg-white shadow-[6px_6px_0px_0px_var(--shadow)] transition-all hover:scale-105 ${i % 2 === 0 ? 'rotate-1' : '-rotate-1'}`}
          >
            <div className={`w-14 h-14 ${stat.color} ${stat.text} rounded-2xl flex items-center justify-center mb-5 border-4 border-black`}>
              {stat.icon}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              {stat.label}
            </p>
            <h4 className="text-3xl font-black text-slate-800">{stat.value}</h4>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboardView;
