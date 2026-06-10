import { useState } from 'react';
import { useToast } from '../../../store/ToastContext';
import { useAdminInventory } from '../hooks/useAdminInventory';
import ProductAbmModal from '../components/organisms/ProductAbmModal';
import MovementModal from '../components/organisms/MovementModal';
import { CATEGORIAS_MOVIMIENTO } from '../services/adminInventoryService';

import { 
  Plus, Search, ShoppingBag, AlertTriangle, 
  Activity, Edit, Zap, Layers,
  ArrowDownRight, ArrowUpRight, Filter, Minus, Package, User, Clock
} from 'lucide-react';

const AdminInventoryView = () => {
  const { showToast } = useToast();
  const { 
    productos, categorias, perfiles, movimientos, isLoading, 
    saveProduct, registerMovement 
  } = useAdminInventory();

  // Navigation & Filters
  const [activeTab, setActiveTab] = useState('almacen');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [historialFilter, setHistorialFilter] = useState('todos');

  // Modals
  const [abmModal, setAbmModal] = useState({ isOpen: false, product: null });
  const [movementModal, setMovementModal] = useState({ isOpen: false, data: null });

  const filteredProducts = productos.filter(p => {
    const catName = categorias.find(c => c.id === p.categoria_id)?.nombre || '';
    const matchSearch = p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || catName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCritical = onlyLowStock ? p.stock_actual <= p.stock_minimo_alerta : true;
    return matchSearch && matchCritical;
  });

  const filteredMovimientos = movimientos.filter(m => {
    if (historialFilter === 'todos') return true;
    if (historialFilter === 'ingresos') return m.tipo === 'ingreso';
    if (historialFilter === 'salidas') return m.tipo === 'salida';
    return m.categoria_motivo === historialFilter;
  });

  const handleSaveProduct = async (form) => {
    const success = await saveProduct(form, (msg) => showToast(msg, msg.includes('Error') ? 'error' : 'success'));
    if (success) setAbmModal({ isOpen: false, product: null });
  };

  const handleConfirmMovement = async (form) => {
    const success = await registerMovement(form, (msg) => showToast(msg, msg.includes('Error') ? 'error' : 'success'));
    if (success) setMovementModal({ isOpen: false, data: null });
  };

  const getLabelMotivo = (tipo, catId) => CATEGORIAS_MOVIMIENTO[tipo]?.find(c => c.id === catId)?.label || catId;
  
  const formatDate = (isoStr) => {
    const d = new Date(isoStr);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  };

  if (isLoading) return <div className="min-h-[50vh] flex items-center justify-center font-black text-2xl uppercase italic">Cargando Inventario...</div>;

  return (
    <div className="animate-in fade-in duration-300 pb-12">
      {/* Dash/Header Section */}
      <div className="bg-black text-white p-6 rounded-[2.5rem] md:rounded-[3rem] border-[4px] border-black shadow-[8px_8px_0px_0px_black] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-[var(--primary)] text-black p-4 rounded-2xl border-2 border-black">
            <Layers size={26} strokeWidth={3}/>
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Gestión Global de Almacén</h2>
            <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Todos los productos son aptos para venta, algunos con uso interno habilitado.</p>
          </div>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="flex-1 md:flex-initial bg-rose-500 text-white px-4 py-2 border-2 border-black rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-1">
            <span className="text-sm">🔴</span> {productos.filter(p=>p.stock_actual===0).length} Sin Stock
          </div>
          <div className="flex-1 md:flex-initial bg-amber-400 text-black px-4 py-2 border-2 border-black rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-1">
            <span className="text-sm">🟡</span> {productos.filter(p=>p.stock_actual>0 && p.stock_actual<=p.stock_minimo_alerta).length} Alertas
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mt-8">
        <div className="flex bg-slate-200 p-1.5 rounded-2xl border-2 border-black gap-1">
          <button onClick={() => setActiveTab('almacen')} className={`px-6 py-3 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all ${activeTab === 'almacen' ? 'bg-black text-white shadow-md' : 'text-slate-600 hover:bg-slate-300'}`}>
            <ShoppingBag size={14} /> Inventario Vivo
          </button>
          <button onClick={() => setActiveTab('historial')} className={`px-6 py-3 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all ${activeTab === 'historial' ? 'bg-black text-white shadow-md' : 'text-slate-600 hover:bg-slate-300'}`}>
            <Activity size={14} /> Historial de Movs.
          </button>
        </div>

        {activeTab === 'almacen' && (
          <button onClick={() => setAbmModal({ isOpen: true, product: null })} className="bg-[var(--primary)] text-white px-5 py-3 rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black text-xs uppercase hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center gap-2">
            <Plus size={16} strokeWidth={3} /> Nuevo Producto
          </button>
        )}
      </div>

      {/* ALMACEN TAB */}
      {activeTab === 'almacen' && (
        <div className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-white border-[3px] border-black p-4 rounded-3xl shadow-[5px_5px_0px_0px_black] flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            <div className="relative flex-1">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Search size={18} strokeWidth={3} /></div>
              <input 
                type="text" placeholder="Buscar producto o categoría..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border-[3px] border-black rounded-xl px-12 py-3 font-bold text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            <button onClick={() => setOnlyLowStock(!onlyLowStock)} className={`px-5 py-3 rounded-xl border-[3px] border-black font-black text-[11px] uppercase flex items-center justify-center gap-2 transition-all ${onlyLowStock ? 'bg-rose-500 text-white shadow-inner' : 'bg-amber-400 text-black shadow-[4px_4px_0px_0px_black] hover:bg-amber-300'}`}>
              <AlertTriangle size={14} /> {onlyLowStock ? 'Ver Todo' : '⚠️ Filtrar Críticos'}
            </button>
          </div>

          <div className="bg-white border-[4px] border-black rounded-[2rem] shadow-[8px_8px_0px_0px_black] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 border-b-[4px] border-black">
                    <th className="p-4 font-black text-[10px] uppercase text-slate-400 tracking-wider">Producto</th>
                    <th className="p-4 font-black text-[10px] uppercase text-slate-400 tracking-wider">Precio</th>
                    <th className="p-4 font-black text-[10px] uppercase text-slate-400 tracking-wider text-center">Stock Actual</th>
                    <th className="p-4 font-black text-[10px] uppercase text-slate-400 tracking-wider text-center">Acciones Rápidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-100">
                  {filteredProducts.map(p => {
                    let stockBg = "bg-emerald-100 text-emerald-600 border-emerald-500";
                    let stockText = "STOCK SEGURO";
                    if (p.stock_actual === 0) { stockBg = "bg-rose-100 text-rose-600 border-rose-500"; stockText = "SIN STOCK"; } 
                    else if (p.stock_actual <= p.stock_minimo_alerta) { stockBg = "bg-amber-100 text-amber-600 border-amber-500"; stockText = "ALERTA (REPOSICIÓN)"; }

                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 border-2 border-black flex items-center justify-center text-lg shadow-[2px_2px_0px_0px_black] shrink-0">
                              {p.es_insumo ? '🧴' : '📦'}
                            </div>
                            <div>
                              <span className="font-black text-sm text-slate-800 uppercase block">{p.nombre}</span>
                              <div className="flex gap-2 mt-1">
                                <span className="bg-slate-200 border border-slate-300 text-[8px] px-2 py-0.5 rounded font-black uppercase text-slate-600 tracking-widest">{categorias.find(c=>c.id===p.categoria_id)?.nombre}</span>
                                {p.es_insumo && <span className="bg-[var(--primary)] text-white border border-black text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-widest flex items-center gap-1">Dual (Venta/Spa)</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-black text-sm text-slate-800">${p.precio_base.toFixed(2)}</td>
                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`px-4 py-1 rounded-full border-2 text-sm font-black ${stockBg}`}>{p.stock_actual}</span>
                            <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase">{stockText} (Min: {p.stock_minimo_alerta})</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-center items-center gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setMovementModal({ isOpen: true, data: { producto: p, tipo: 'ingreso' }})} className="bg-emerald-400 text-black px-3 py-2 rounded-xl border-[2px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-1 font-black text-[10px] uppercase">
                              <Plus size={14}/> Ingreso
                            </button>
                            <button onClick={() => setMovementModal({ isOpen: true, data: { producto: p, tipo: 'salida' }})} className="bg-rose-500 text-white px-3 py-2 rounded-xl border-[2px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-1 font-black text-[10px] uppercase">
                              <Minus size={14}/> Salida
                            </button>
                            <button onClick={() => setAbmModal({ isOpen: true, product: p })} className="bg-white text-slate-600 hover:text-black p-2 rounded-xl border-[2px] border-transparent hover:border-black transition-all">
                              <Edit size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <tr><td colSpan="4" className="p-10 text-center font-bold text-slate-400">No se encontraron productos.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* HISTORIAL TAB */}
      {activeTab === 'historial' && (
        <div className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-white border-[3px] border-black p-4 rounded-3xl shadow-[5px_5px_0px_0px_black] overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 min-w-max">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mr-2 flex items-center gap-1"><Filter size={14}/> Filtros:</span>
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'ingresos', label: 'Todos los Ingresos', icon: ArrowUpRight, color: 'emerald' },
                { id: 'salidas', label: 'Todas las Salidas', icon: ArrowDownRight, color: 'rose' },
                { id: 'uso_interno', label: 'Uso Interno Spa' },
                { id: 'venta_mostrador', label: 'Ventas Directas' },
              ].map(f => (
                <button key={f.id} onClick={()=>setHistorialFilter(f.id)} className={`px-4 py-2 rounded-xl border-2 border-black font-black text-[10px] uppercase transition-all flex items-center gap-1 ${historialFilter === f.id ? (f.color === 'emerald' ? 'bg-emerald-400 text-black shadow-inner' : f.color === 'rose' ? 'bg-rose-500 text-white shadow-inner' : 'bg-black text-white shadow-inner') : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                  {f.icon && <f.icon size={12}/>} {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border-[4px] border-black rounded-[2rem] shadow-[8px_8px_0px_0px_black] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 border-b-[4px] border-black">
                    <th className="p-4 font-black text-[10px] uppercase text-slate-400 w-10">#</th>
                    <th className="p-4 font-black text-[10px] uppercase text-slate-400">Fecha y Hora</th>
                    <th className="p-4 font-black text-[10px] uppercase text-slate-400">Producto</th>
                    <th className="p-4 font-black text-[10px] uppercase text-slate-400 text-center">Tipo y Cantidad</th>
                    <th className="p-4 font-black text-[10px] uppercase text-slate-400">Clasificación de Movimiento</th>
                    <th className="p-4 font-black text-[10px] uppercase text-slate-400">Usuario y Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-100">
                  {filteredMovimientos.map((m, idx) => {
                    const prod = productos.find(p => p.id === m.producto_id);
                    const user = perfiles.find(u => u.id === m.usuario_id);
                    const isIngreso = m.tipo === 'ingreso';

                    return (
                      <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-xs font-bold text-slate-400 text-center">{filteredMovimientos.length - idx}</td>
                        <td className="p-4">
                          <span className="font-bold text-xs text-slate-600 block whitespace-nowrap"><Clock size={12} className="inline mr-1 mb-0.5 text-slate-400"/> {formatDate(m.fecha).split(' ')[0]}</span>
                          <span className="font-black text-xs text-slate-800">{formatDate(m.fecha).split(' ')[1]}</span>
                        </td>
                        <td className="p-4 font-black text-sm uppercase text-slate-800">{prod ? prod.nombre : 'Producto Eliminado'}</td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border-2 font-black text-xs shadow-sm ${isIngreso ? 'bg-emerald-100 text-emerald-700 border-emerald-400' : 'bg-rose-100 text-rose-700 border-rose-400'}`}>
                            {isIngreso ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>} {isIngreso ? '+' : '-'}{m.cantidad}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="bg-slate-200 border border-slate-300 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase text-slate-700">
                            {getLabelMotivo(m.tipo, m.categoria_motivo)}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-black text-xs uppercase text-slate-700 flex items-center gap-1"><User size={12}/> {user ? user.nombre_completo : 'Sistema'}</span>
                          {m.detalle && <span className="block text-xs font-bold text-slate-500 italic mt-1 bg-slate-50 p-2 rounded-lg border border-slate-200">{m.detalle}</span>}
                        </td>
                      </tr>
                    )
                  })}
                  {filteredMovimientos.length === 0 && <tr><td colSpan="6" className="p-10 text-center font-bold text-slate-400">No hay movimientos registrados bajo estos filtros.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <ProductAbmModal 
        isOpen={abmModal.isOpen} 
        onClose={() => setAbmModal({ isOpen: false, product: null })}
        onSave={handleSaveProduct}
        product={abmModal.product}
        categorias={categorias}
      />

      <MovementModal 
        isOpen={movementModal.isOpen}
        onClose={() => setMovementModal({ isOpen: false, data: null })}
        onConfirm={handleConfirmMovement}
        initialData={movementModal.data}
        perfiles={perfiles}
      />
    </div>
  );
};

export default AdminInventoryView;
