import React from 'react';
import PropTypes from 'prop-types';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

const FinanceKpiCards = ({ 
  totalIncome, 
  totalExpense, 
  netProfit, 
  isProfitPositive, 
  incomesCount, 
  expensesCount 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Ingresos Brutos */}
      <div className="bg-emerald-300 border-[4px] border-black p-6 rounded-[2rem] shadow-[6px_6px_0px_0px_black] relative overflow-hidden transition-transform hover:-translate-y-1">
        <TrendingUp className="absolute right-[-20px] bottom-[-20px] text-emerald-400/50" size={120} strokeWidth={4} />
        <div className="relative z-10">
          <h3 className="text-xs font-black uppercase tracking-widest text-emerald-900 mb-1">Ingresos Brutos</h3>
          <span className="text-4xl font-black text-black">Bs. {totalIncome.toFixed(2)}</span>
          <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-white/40 px-2 py-1 rounded-lg w-max border border-black/10">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            {incomesCount} cobros registrados
          </div>
        </div>
      </div>

      {/* Egresos Operativos */}
      <div className="bg-rose-300 border-[4px] border-black p-6 rounded-[2rem] shadow-[6px_6px_0px_0px_black] relative overflow-hidden transition-transform hover:-translate-y-1">
        <TrendingDown className="absolute right-[-20px] bottom-[-20px] text-rose-400/50" size={120} strokeWidth={4} />
        <div className="relative z-10">
          <h3 className="text-xs font-black uppercase tracking-widest text-rose-900 mb-1">Egresos Operativos</h3>
          <span className="text-4xl font-black text-black">Bs. {totalExpense.toFixed(2)}</span>
          <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-rose-900 bg-white/40 px-2 py-1 rounded-lg w-max border border-black/10">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            {expensesCount} gastos reportados
          </div>
        </div>
      </div>

      {/* Flujo Neto */}
      <div className={`border-[4px] border-black p-6 rounded-[2rem] shadow-[6px_6px_0px_0px_black] relative overflow-hidden transition-transform hover:-translate-y-1 ${isProfitPositive ? 'bg-black text-white' : 'bg-red-600 text-white'}`}>
        <Wallet className="absolute right-[-20px] bottom-[-20px] opacity-20" size={120} strokeWidth={4} />
        <div className="relative z-10">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-300 mb-1">Flujo Neto (Utilidad)</h3>
          <span className="text-4xl font-black">Bs. {netProfit.toFixed(2)}</span>
          <div className={`mt-4 flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg w-max border ${isProfitPositive ? 'bg-emerald-400 text-black border-emerald-500' : 'bg-rose-400 text-black border-rose-500'}`}>
            {isProfitPositive ? 'Rentable 📈' : 'Déficit 📉'}
          </div>
        </div>
      </div>
    </div>
  );
};

FinanceKpiCards.propTypes = {
  totalIncome: PropTypes.number.isRequired,
  totalExpense: PropTypes.number.isRequired,
  netProfit: PropTypes.number.isRequired,
  isProfitPositive: PropTypes.bool.isRequired,
  incomesCount: PropTypes.number.isRequired,
  expensesCount: PropTypes.number.isRequired,
};

export default FinanceKpiCards;
