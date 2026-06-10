import React from 'react';
import PropTypes from 'prop-types';
import { Search, Filter, Download, FileText } from 'lucide-react';

const FinanceTransactionsTable = ({
  allTransactions,
  filterType,
  setFilterType,
  searchTerm,
  setSearchTerm
}) => {
  return (
    <div className="bg-white border-[4px] border-black rounded-[2rem] shadow-[6px_6px_0px_0px_black] overflow-hidden mb-8">
      {/* Header Tabla */}
      <div className="bg-slate-100 p-6 border-b-[4px] border-black flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-black uppercase italic tracking-tight flex items-center gap-2">
          <FileText size={24} />
          Auditoría de Transacciones
        </h2>
        
        <div className="flex flex-wrap gap-3">
          {/* Buscador */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border-[3px] border-black rounded-xl text-xs font-bold w-48 shadow-[2px_2px_0px_0px_black] focus:outline-none focus:translate-y-[1px] focus:shadow-[1px_1px_0px_0px_black] transition-all"
            />
          </div>
          
          {/* Filtro */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-9 pr-8 py-2 border-[3px] border-black rounded-xl text-xs font-black uppercase w-40 shadow-[2px_2px_0px_0px_black] focus:outline-none focus:translate-y-[1px] focus:shadow-[1px_1px_0px_0px_black] transition-all appearance-none bg-white cursor-pointer"
            >
              <option value="todos">Todos</option>
              <option value="ingreso">Ingresos</option>
              <option value="egreso">Egresos</option>
            </select>
          </div>
          
          <button className="bg-amber-300 hover:bg-amber-200 border-[3px] border-black px-4 py-2 rounded-xl shadow-[2px_2px_0px_0px_black] active:translate-y-[1px] transition-all cursor-pointer flex items-center gap-2 text-xs font-black uppercase">
            <Download size={16} strokeWidth={3} />
            Exportar
          </button>
        </div>
      </div>

      {/* Cuerpo Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black text-white text-[10px] font-black uppercase tracking-widest">
              <th className="p-4 whitespace-nowrap">Fecha / Hora</th>
              <th className="p-4">Tipo</th>
              <th className="p-4">Concepto / Detalle</th>
              <th className="p-4 text-right">Monto</th>
              <th className="p-4 text-center">Referencia</th>
            </tr>
          </thead>
          <tbody>
            {allTransactions.length > 0 ? (
              allTransactions.map((tx) => {
                const isIngreso = tx.tipo === 'ingreso';
                const dateObj = new Date(tx.fecha);
                return (
                  <tr key={tx.id} className="border-b-2 border-black/10 hover:bg-slate-50 transition-colors text-sm font-bold text-slate-800">
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span>{dateObj.toLocaleDateString()}</span>
                        <span className="text-[10px] text-slate-400 font-black">{dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded border-2 border-black text-[9px] font-black uppercase tracking-widest ${isIngreso ? 'bg-emerald-300 text-emerald-900' : 'bg-rose-300 text-rose-900'}`}>
                        {tx.tipo}
                      </span>
                    </td>
                    <td className="p-4 max-w-md">
                      <div className="flex flex-col truncate">
                        <span>{tx.concepto}</span>
                        {tx.categoria && <span className="text-[10px] uppercase text-slate-400 mt-0.5">Categoría: {tx.categoria.replace('_', ' ')}</span>}
                      </div>
                    </td>
                    <td className={`p-4 text-right font-mono font-black text-base ${isIngreso ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isIngreso ? '+' : '-'} Bs. {tx.monto.toFixed(2)}
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-[10px] font-mono bg-slate-100 border border-black/20 px-2 py-1 rounded text-slate-500 uppercase">
                        {tx.id.split('-')[1]}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-400 font-black uppercase tracking-widest">
                  No se encontraron transacciones.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

FinanceTransactionsTable.propTypes = {
  allTransactions: PropTypes.array.isRequired,
  filterType: PropTypes.string.isRequired,
  setFilterType: PropTypes.func.isRequired,
  searchTerm: PropTypes.string.isRequired,
  setSearchTerm: PropTypes.func.isRequired,
};

export default FinanceTransactionsTable;
