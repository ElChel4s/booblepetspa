import React from 'react';
import PropTypes from 'prop-types';
import { BarChart3, PieChart } from 'lucide-react';

const FinanceCharts = ({ totalIncome, totalExpense, expenseByCategory }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Gráfico Comparativo CSS Neo-Brutalist */}
      <div className="bg-white border-[4px] border-black rounded-[2rem] shadow-[6px_6px_0px_0px_black] p-6">
        <h2 className="text-lg font-black uppercase italic tracking-tight mb-6 flex items-center gap-2 border-b-4 border-slate-100 pb-2">
          <BarChart3 size={20} className="text-teal-500" />
          Ingresos vs Egresos
        </h2>
        
        <div className="flex h-48 items-end gap-8 justify-center mt-8">
          {/* Barra Ingresos */}
          <div className="flex flex-col items-center gap-2 group">
            <span className="font-mono font-bold text-sm text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
              {totalIncome.toFixed(0)}
            </span>
            <div 
              className="w-24 bg-emerald-400 border-[3px] border-black rounded-t-xl transition-all duration-700 ease-out origin-bottom shadow-[4px_0px_0px_0px_black]"
              style={{ height: `${totalIncome > 0 ? (totalIncome / (totalIncome + totalExpense)) * 100 : 0}%`, minHeight: '20px' }}
            />
            <span className="text-[10px] font-black uppercase tracking-widest text-black">Ingresos</span>
          </div>

          {/* Barra Egresos */}
          <div className="flex flex-col items-center gap-2 group">
            <span className="font-mono font-bold text-sm text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
              {totalExpense.toFixed(0)}
            </span>
            <div 
              className="w-24 bg-rose-400 border-[3px] border-black rounded-t-xl transition-all duration-700 ease-out origin-bottom shadow-[4px_0px_0px_0px_black]"
              style={{ height: `${totalExpense > 0 ? (totalExpense / (totalIncome + totalExpense)) * 100 : 0}%`, minHeight: '20px' }}
            />
            <span className="text-[10px] font-black uppercase tracking-widest text-black">Egresos</span>
          </div>
        </div>
      </div>

      {/* Distribución de Egresos */}
      <div className="bg-white border-[4px] border-black rounded-[2rem] shadow-[6px_6px_0px_0px_black] p-6">
        <h2 className="text-lg font-black uppercase italic tracking-tight mb-6 flex items-center gap-2 border-b-4 border-slate-100 pb-2">
          <PieChart size={20} className="text-amber-500" />
          Distribución de Gastos
        </h2>
        
        <div className="flex flex-col gap-4 mt-4 h-48 overflow-y-auto pr-2 custom-scrollbar">
          {Object.entries(expenseByCategory).length > 0 ? (
            Object.entries(expenseByCategory)
              .sort((a, b) => b[1] - a[1]) // Mayor a menor
              .map(([cat, amount], idx) => {
                const percent = ((amount / totalExpense) * 100).toFixed(1);
                const colors = ['bg-rose-400', 'bg-amber-400', 'bg-sky-400', 'bg-purple-400', 'bg-slate-400'];
                const color = colors[idx % colors.length];

                return (
                  <div key={cat} className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-black uppercase text-slate-800">
                      <span>{cat.replace('_', ' ')}</span>
                      <span>{percent}% (Bs. {amount.toFixed(2)})</span>
                    </div>
                    <div className="w-full h-4 bg-slate-100 border-2 border-black rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${color} border-r-2 border-black transition-all duration-1000`} 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
          ) : (
            <div className="text-center py-10 text-slate-400 text-sm font-bold uppercase tracking-widest">
              No hay egresos registrados aún.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

FinanceCharts.propTypes = {
  totalIncome: PropTypes.number.isRequired,
  totalExpense: PropTypes.number.isRequired,
  expenseByCategory: PropTypes.object.isRequired,
};

export default FinanceCharts;
