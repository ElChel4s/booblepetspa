import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Package, CheckCircle2, Search, RefreshCw, Phone, User, ShoppingBag } from 'lucide-react';

const CashierDeliveriesTab = ({ orders, isLoading, onDeliverOrder, onRefresh }) => {
  const [subTab, setSubTab] = useState('pendientes'); // 'pendientes' | 'historial'
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrar pedidos según el tab seleccionado y la búsqueda
  const filteredOrders = useMemo(() => {
    return orders
      .filter(order => {
        const matchesSearch = 
          order.cliente.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.codigo_seguimiento.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (!matchesSearch) return false;

        if (subTab === 'pendientes') {
          // Pendientes de entrega: Pago completado y estado NO entregado
          return order.estado_pago === 'completado' && order.estado_pedido !== 'entregado';
        }
        
        // Historial completo
        return true;
      });
  }, [orders, subTab, searchQuery]);

  // Estados visuales de pedidos
  const getPedidoStatusBadge = (status) => {
    switch (status) {
      case 'entregado':
        return <span className="bg-emerald-100 text-emerald-800 border-2 border-emerald-300 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase">Entregado 📦</span>;
      case 'en_preparacion':
        return <span className="bg-orange-100 text-orange-800 border-2 border-orange-300 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase">En Preparación 🧴</span>;
      case 'pendiente':
        return <span className="bg-amber-100 text-amber-800 border-2 border-amber-300 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase">Pendiente ⌛</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 border-2 border-slate-300 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase">{status}</span>;
    }
  };

  // Estados visuales de pago
  const getPagoStatusBadge = (status) => {
    switch (status) {
      case 'completado':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Pagado ✔️</span>;
      case 'pendiente':
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Pago Pendiente</span>;
      case 'rechazado':
        return <span className="bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Pago Rechazado ❌</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 border border-slate-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{status}</span>;
    }
  };

  return (
    <div className="bg-white border-[4px] border-black rounded-[2rem] shadow-[8px_8px_0px_0px_black] p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Cabecera Interna */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b-4 border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-2">
            <Package size={20} className="text-emerald-500" />
            Entrega de Productos Web
          </h2>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Entrega pedidos de productos pagados con QR y mantén el historial de ventas
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Sub-Tabs de Entrega */}
          <div className="flex bg-slate-100 border-2 border-black p-1 rounded-xl shrink-0">
            <button 
              onClick={() => setSubTab('pendientes')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${subTab === 'pendientes' ? 'bg-black text-white' : 'text-slate-600 hover:text-black'}`}
            >
              Pendientes ({orders.filter(o => o.estado_pago === 'completado' && o.estado_pedido !== 'entregado').length})
            </button>
            <button 
              onClick={() => setSubTab('historial')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${subTab === 'historial' ? 'bg-black text-white' : 'text-slate-600 hover:text-black'}`}
            >
              Historial ({orders.length})
            </button>
          </div>

          <button 
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 border-2 border-black rounded-xl hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
            title="Sincronizar Pedidos"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Buscar por cliente o código de pedido..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-50 border-[3px] border-black rounded-xl py-3 pl-12 pr-4 text-xs font-black uppercase tracking-wider focus:outline-none focus:bg-white shadow-[2px_2px_0px_0px_black] focus:shadow-[4px_4px_0px_0px_black] transition-all"
        />
      </div>

      {/* Lista de Pedidos */}
      {isLoading && filteredOrders.length === 0 ? (
        <div className="flex justify-center items-center h-48">
          <RefreshCw className="animate-spin text-slate-400" size={32} />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center">
          <div className="w-20 h-20 bg-indigo-50 text-indigo-500 border-[4px] border-black rounded-[2rem] flex items-center justify-center mb-6 shadow-[6px_6px_0px_0px_black]">
            <Package size={40} strokeWidth={2.5} />
          </div>
          <h3 className="text-2xl font-black italic uppercase tracking-tighter">No hay pedidos</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 max-w-sm">
            {subTab === 'pendientes' 
              ? 'No hay ningún pedido pagado pendiente de entrega en este momento.' 
              : 'No se encontraron pedidos en el historial.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map(order => (
            <div key={order.id} className={`border-[4px] border-black rounded-[1.5rem] p-5 flex flex-col gap-4 shadow-[4px_4px_0px_0px_black] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_black] transition-all ${order.estado_pedido === 'entregado' ? 'bg-slate-50 opacity-80' : 'bg-emerald-50/40'}`}>
              
              {/* Info General Pedido */}
              <div className="flex justify-between items-start border-b-2 border-dashed border-black/10 pb-3">
                <div>
                  <h3 className="font-black text-sm uppercase text-black flex items-center gap-1">
                    <User size={14} className="text-slate-400 shrink-0"/> {order.cliente}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-[9px] font-bold bg-white border border-black px-1.5 py-0.5 rounded shadow-[1px_1px_0px_0px_black] text-black">
                      {order.codigo_seguimiento}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                      <Phone size={10}/> {order.telefono}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-emerald-600 bg-white px-2 py-0.5 rounded-lg border-2 border-black">
                    Bs. {order.monto_total.toFixed(2)}
                  </div>
                </div>
              </div>
              
              {/* Badges de Estado */}
              <div className="flex flex-wrap gap-2">
                {getPagoStatusBadge(order.estado_pago)}
                {getPedidoStatusBadge(order.estado_pedido)}
              </div>

              {/* Lista Productos */}
              <div className="bg-white border-2 border-black rounded-xl p-3 flex-1">
                <p className="text-[9px] font-black uppercase text-slate-400 mb-2 border-b-2 border-slate-100 pb-1 flex items-center gap-1">
                  <ShoppingBag size={12}/> Productos:
                </p>
                <ul className="text-xs font-mono text-slate-700 flex flex-col gap-1 max-h-24 overflow-y-auto pr-1">
                  {order.productos.map((p, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="font-bold text-black">{p.cantidad}x</span> 
                      <span className="truncate">{p.nombre}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Botón de Entrega (solo si el pago está completado y no está entregado) */}
              {order.estado_pago === 'completado' && order.estado_pedido !== 'entregado' && (
                <button 
                  onClick={() => {
                    if (window.confirm(`¿Confirmas la entrega de los productos del pedido ${order.codigo_seguimiento} a ${order.cliente}?`)) {
                      onDeliverOrder(order.id);
                    }
                  }}
                  className="w-full bg-emerald-400 hover:bg-emerald-300 border-[3.5px] border-black py-3 rounded-xl text-xs font-black uppercase shadow-[4px_4px_0px_0px_black] active:translate-y-[1px] active:translate-x-[1px] active:shadow-[2px_2px_0px_0px_black] hover:rotate-[-1deg] transition-all text-black flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <Package size={16} strokeWidth={3}/>
                  Entregar Pedido
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

CashierDeliveriesTab.propTypes = {
  orders: PropTypes.array.isRequired,
  isLoading: PropTypes.bool.isRequired,
  onDeliverOrder: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired
};

export default CashierDeliveriesTab;
