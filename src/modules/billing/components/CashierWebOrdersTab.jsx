import React from 'react';
import PropTypes from 'prop-types';
import { ClipboardCheck, CheckCircle2, Search, RefreshCw } from 'lucide-react';

const CashierWebOrdersTab = ({ webOrders, isLoading, onValidateOrder, onRefresh }) => {
  return (
    <div className="bg-white border-[4px] border-black rounded-[2rem] shadow-[8px_8px_0px_0px_black] p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex justify-between items-center mb-4 border-b-4 border-slate-100 pb-2">
        <h2 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-2">
          <ClipboardCheck size={20} className="text-amber-500" />
          Pedidos Web Pendientes de Validación
        </h2>
        <button 
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 border-2 border-black rounded-lg hover:bg-slate-100 disabled:opacity-50"
          title="Recargar Pedidos"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>
      
      {isLoading && webOrders.length === 0 ? (
        <div className="flex justify-center items-center h-48">
          <RefreshCw className="animate-spin text-slate-400" size={32} />
        </div>
      ) : webOrders.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 border-[4px] border-black rounded-[2rem] flex items-center justify-center mb-6 shadow-[6px_6px_0px_0px_black]">
            <CheckCircle2 size={40} strokeWidth={3} />
          </div>
          <h3 className="text-2xl font-black italic uppercase tracking-tighter">Todo al día</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 max-w-sm">
            No hay pedidos web con comprobantes pendientes de validación en este momento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {webOrders.map(order => (
            <div key={order.id} className="border-[4px] border-black rounded-[1.5rem] p-5 bg-amber-50 flex flex-col gap-4 shadow-[4px_4px_0px_0px_black] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_black] transition-all">
              
              {/* Info Cliente */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-black text-sm uppercase text-black">{order.cliente}</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">{order.codigo_pedido} • {order.fecha_hora}</p>
                </div>
                <span className="text-lg font-black text-amber-600 bg-amber-100 px-2 py-1 rounded-lg border-2 border-amber-200">
                  Bs. {order.total.toFixed(2)}
                </span>
              </div>
              
              {/* Lista Productos */}
              <div className="bg-white border-2 border-black rounded-xl p-3">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-2 border-b-2 border-slate-100 pb-1">Productos:</p>
                <ul className="text-xs font-mono text-slate-700 flex flex-col gap-1 max-h-24 overflow-y-auto pr-1">
                  {order.productos.map((p, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="font-bold text-black">{p.cantidad}x</span> 
                      <span className="truncate">{p.nombre}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Vista Previa Comprobante */}
              <a 
                href={order.comprobante_url}
                target="_blank"
                rel="noopener noreferrer"
                className="border-[3px] border-dashed border-black bg-slate-200 hover:bg-slate-300 rounded-xl p-4 flex flex-col items-center justify-center relative group cursor-pointer overflow-hidden h-32 transition-colors block"
              >
                 <span className="font-black text-[10px] uppercase z-10 bg-white text-black px-3 py-1.5 border-[3px] border-black rounded-xl shadow-[2px_2px_0px_0px_black] group-hover:scale-105 transition-transform flex items-center gap-2">
                   <Search size={14} strokeWidth={3} />
                   Ver Comprobante
                 </span>
                 <div 
                   className="absolute inset-0 bg-cover bg-center opacity-40 blur-[2px]"
                   style={{ backgroundImage: `url(${order.comprobante_url})` }}
                 />
              </a>

              {/* Acciones */}
              <div className="flex gap-3 mt-auto pt-2 border-t-2 border-black/10">
                <button 
                  onClick={() => {
                    if(window.confirm('¿Estás seguro de rechazar este pago?')) {
                      onValidateOrder(order.id, order.pedido_id, 'reject');
                    }
                  }}
                  className="flex-1 bg-rose-400 hover:bg-rose-300 border-[3px] border-black py-2 rounded-xl text-[10px] font-black uppercase shadow-[3px_3px_0px_0px_black] active:translate-y-[1px] active:translate-x-[1px] active:shadow-[1px_1px_0px_0px_black] transition-all text-black"
                >
                  Rechazar
                </button>
                <button 
                  onClick={() => {
                    if(window.confirm('¿Confirmas que el monto ingresó a la cuenta correctamente?')) {
                      onValidateOrder(order.id, order.pedido_id, 'approve');
                    }
                  }}
                  className="flex-1 bg-emerald-400 hover:bg-emerald-300 border-[3px] border-black py-2 rounded-xl text-[10px] font-black uppercase shadow-[3px_3px_0px_0px_black] active:translate-y-[1px] active:translate-x-[1px] active:shadow-[1px_1px_0px_0px_black] transition-all text-black flex items-center justify-center gap-1"
                >
                  <CheckCircle2 size={14} strokeWidth={3} />
                  Aprobar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

CashierWebOrdersTab.propTypes = {
  webOrders: PropTypes.array.isRequired,
  isLoading: PropTypes.bool.isRequired,
  onValidateOrder: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired
};

export default CashierWebOrdersTab;
