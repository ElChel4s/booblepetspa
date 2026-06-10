import { useState } from 'react';
import { useAuth } from '../../../store/AuthContext';
import { useToast } from '../../../store/ToastContext';
import { useReceptionPos } from '../hooks/useReceptionPos';
import PopModal from '../../../components/common/organisms/PopModal';
import BrutalInput from '../../../components/common/atoms/BrutalInput';

import { 
  Search, ShoppingBag, X, CheckCircle2, 
  Minus, Plus, Package, DollarSign, FileText, Zap, 
  ArrowUpRight, ArrowDownRight, Settings2, ShoppingCart, 
  User
} from 'lucide-react';

const MOTIVOS_AJUSTE = {
  ingreso: ['devolucion_cliente', 'ajuste_positivo'],
  salida: ['uso_interno', 'merma_dano', 'ajuste_negativo']
};

const ReceptionPosView = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  
  // recepcionistaId es el id del usuario logueado
  const recepcionistaId = currentUser?.id || null;

  const {
    productos, categorias, isLoading,
    carritoVenta, metodoPago, setMetodoPago,
    addToCarrito, updateCarritoQty, calcularTotal,
    handleCheckout, handleManualAjuste
  } = useReceptionPos(recepcionistaId);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCat, setActiveCat] = useState('todas');
  
  const [isAjusteOpen, setIsAjusteOpen] = useState(false);
  const [ajusteData, setAjusteData] = useState({
    producto: null, tipo: 'salida', motivo: MOTIVOS_AJUSTE.salida[0], cantidad: 1, notas: ''
  });

  const onToast = (msg, isAlert = false) => {
    showToast(msg, isAlert ? 'error' : 'success');
  };

  const handleOpenAjuste = (prod) => {
    setAjusteData({ 
      producto: prod, tipo: 'salida', motivo: MOTIVOS_AJUSTE.salida[0], cantidad: 1, notas: '' 
    });
    setIsAjusteOpen(true);
  };

  const handleConfirmAjuste = async () => {
    const qty = parseInt(ajusteData.cantidad);
    if (isNaN(qty) || qty <= 0) return onToast("⚠️ Cantidad inválida.", true);
    if (ajusteData.tipo === 'salida' && qty > ajusteData.producto.stock_actual) {
      return onToast("❌ Error: Stock insuficiente.", true);
    }

    const success = await handleManualAjuste(ajusteData, onToast);
    if (success) setIsAjusteOpen(false);
  };

  const onCheckoutClick = async () => {
    // Usamos null como clienteId para ventas a publico general al paso (mostrador)
    await handleCheckout(null, onToast);
  };

  // Helper para diseño visual de categorías
  const getCatDesign = (catId, index = 0) => {
    if (catId === 'todas') return { emoji: '🌟', color: 'bg-indigo-400' };
    const styles = [
      { emoji: '🧴', color: 'bg-cyan-400' },
      { emoji: '🎾', color: 'bg-rose-400' },
      { emoji: '🥫', color: 'bg-amber-400' },
      { emoji: '🦮', color: 'bg-emerald-400' },
      { emoji: '✨', color: 'bg-fuchsia-400' }
    ];
    return styles[index % styles.length];
  };

  const filteredProducts = productos.filter(p => {
    const matchCat = activeCat === 'todas' || p.categoria_id === activeCat;
    const matchSearch = p.nombre.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  if (isLoading) return <div className="min-h-[50vh] flex items-center justify-center font-black text-2xl uppercase italic">Iniciando TPV...</div>;

  return (
    <div className="animate-in fade-in duration-300 pb-12 flex flex-col xl:flex-row gap-6">
      {/* ÁREA IZQUIERDA: CATÁLOGO Y BUSCADOR */}
      <div className="flex-1 flex flex-col w-full z-10 p-0 md:p-2">
        
        {/* Cabecera Neo-Brutalista */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 bg-black text-white p-6 rounded-[2rem] border-[4px] border-black shadow-[8px_8px_0px_0px_var(--primary)]">
          <div className="flex items-center gap-4">
            <div className="bg-white text-black p-3 rounded-xl shadow-inner border-2 border-black">
              <ShoppingCart size={32} strokeWidth={3} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter leading-none italic uppercase">TPV <span className="text-[var(--primary)]">Express</span></h1>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mt-1 block">Mostrador Principal</span>
            </div>
          </div>
          
          <div className="w-full md:w-[400px]">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-black transition-colors"><Search size={20} strokeWidth={3} /></div>
              <input 
                type="text" placeholder="¿Qué busca el cliente hoy?" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white text-black border-[3px] border-black rounded-xl px-12 py-4 font-black text-sm focus:outline-none focus:ring-4 focus:ring-[var(--primary)] focus:translate-y-0.5 transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
              />
              {searchQuery && (
                <button onClick={()=>setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black bg-slate-100 rounded-full p-1 border-2 border-transparent hover:border-black transition-all">
                  <X size={14} strokeWidth={4}/>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Super Filtros (Chips con Flex Wrap) */}
        <div className="flex flex-wrap gap-3 md:gap-4 mb-8">
          <button 
            onClick={() => setActiveCat('todas')}
            className={`px-4 md:px-5 py-2.5 md:py-3 rounded-[1.5rem] border-[3px] border-black font-black text-xs md:text-sm uppercase transition-all flex items-center gap-3 shrink-0 focus:outline-none ${activeCat === 'todas' ? `bg-indigo-400 text-black translate-y-[4px] shadow-none` : 'bg-white text-slate-600 hover:bg-slate-50 shadow-[4px_4px_0px_0px_black] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_black]'}`}
          >
            <div className="bg-white/80 rounded-full p-1.5 border-2 border-black/20 leading-none shadow-sm flex items-center justify-center w-8 h-8 md:w-10 md:h-10 text-lg md:text-xl">🌟</div> Todo
          </button>
          {categorias.map((cat, idx) => {
            const isActive = activeCat === cat.id;
            const design = getCatDesign(cat.id, idx);
            return (
              <button 
                key={cat.id} onClick={() => setActiveCat(cat.id)}
                className={`px-4 md:px-5 py-2.5 md:py-3 rounded-[1.5rem] border-[3px] border-black font-black text-xs md:text-sm uppercase transition-all flex items-center gap-3 shrink-0 focus:outline-none ${isActive ? `${design.color} text-black translate-y-[4px] shadow-none` : 'bg-white text-slate-600 hover:bg-slate-50 shadow-[4px_4px_0px_0px_black] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_black]'}`}
              >
                <div className="bg-white/80 rounded-full p-1.5 border-2 border-black/20 leading-none shadow-sm flex items-center justify-center w-8 h-8 md:w-10 md:h-10 text-lg md:text-xl">
                  {design.emoji}
                </div> 
                {cat.nombre}
              </button>
            )
          })}
        </div>

        {/* Grid de Tarjetas Brutales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {filteredProducts.map(prod => {
            const isAgotado = prod.stock_actual === 0;
            const isAlerta = prod.stock_actual <= prod.stock_minimo_alerta && !isAgotado;
            const catIndex = categorias.findIndex(c => c.id === prod.categoria_id);
            const design = getCatDesign(prod.categoria_id, catIndex !== -1 ? catIndex : 0);
            const catName = categorias.find(c => c.id === prod.categoria_id)?.nombre || 'Sin categoría';
            const porcStock = Math.min((prod.stock_actual / (prod.stock_minimo_alerta * 3)) * 100, 100);

            return (
              <div 
                key={prod.id}
                className={`relative bg-white border-[4px] border-black rounded-[2rem] shadow-[6px_6px_0px_0px_black] overflow-hidden flex flex-col transition-all duration-300 ${isAgotado ? 'opacity-60 bg-slate-100 grayscale-[50%]' : 'hover:-translate-y-2 hover:shadow-[8px_8px_0px_0px_black]'}`}
              >
                {/* Visual Header */}
                <div className={`p-4 ${design.color} border-b-[4px] border-black flex justify-between items-center h-20 relative overflow-hidden`}>
                   <div className="absolute -bottom-4 -right-2 text-6xl opacity-30 drop-shadow-md">{design.emoji}</div>
                   
                   <div className="bg-white px-3 py-1.5 rounded-xl border-2 border-black font-black text-lg shadow-[2px_2px_0px_0px_black] z-10 flex items-center gap-1">
                     <DollarSign size={16} strokeWidth={4}/>{prod.precio_base.toFixed(2)}
                   </div>
                   
                   <div className="z-10">
                    <button onClick={(e) => {e.stopPropagation(); handleOpenAjuste(prod)}} className="bg-white/90 hover:bg-white text-black p-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_black] active:translate-y-0.5 active:shadow-none transition-all" title="Ajuste de Stock (Roturas, Devoluciones)">
                      <Settings2 size={16} strokeWidth={3} />
                    </button>
                   </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between z-10 bg-white">
                  <div>
                    <h3 className="font-black text-md xl:text-lg uppercase leading-tight text-slate-800 mb-2">{prod.nombre}</h3>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">{catName}</span>
                  </div>
                  
                  <div className="mt-6">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Stock Real</span>
                      <span className={`font-black text-sm px-2 py-0.5 rounded border-2 border-black ${isAgotado ? 'bg-rose-500 text-white' : isAlerta ? 'bg-amber-400 text-black' : 'bg-emerald-400 text-black'}`}>
                        {prod.stock_actual} ud
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                      <div className={`h-full transition-all ${isAgotado ? 'bg-rose-500' : isAlerta ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{width: `${isAgotado ? 100 : porcStock}%`}}></div>
                    </div>
                  </div>
                </div>

                {/* Add Button Area */}
                <div className="p-3 bg-slate-50 border-t-[4px] border-black z-10">
                  <button 
                    disabled={isAgotado}
                    onClick={() => addToCarrito(prod, onToast)} 
                    className="w-full bg-[var(--primary)] text-black py-3 rounded-xl border-[3px] border-black font-black text-xs uppercase shadow-[3px_3px_0px_0px_black] hover:translate-y-0.5 hover:shadow-none transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:bg-slate-300 disabled:shadow-none disabled:translate-y-0"
                  >
                    {isAgotado ? 'Agotado' : 'Añadir a Caja'} <Plus size={16} strokeWidth={4}/>
                  </button>
                </div>

                {/* Overlay Bloqueo visual si está agotado */}
                {isAgotado && <div className="absolute inset-0 z-20 pointer-events-none bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.1)_10px,rgba(0,0,0,0.1)_20px)]"></div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* SIDEBAR DERECHO: CARRITO Y CHECKOUT */}
      <aside className="w-full xl:w-[420px] bg-white border-[6px] border-black rounded-[2rem] shadow-[8px_8px_0px_0px_black] z-20 flex flex-col h-[calc(100vh-140px)] sticky top-6">
        
        {/* Cabecera del Carrito */}
        <div className="p-6 bg-slate-50 border-b-[4px] border-black rounded-t-[1.5rem]">
          <div className="flex justify-between items-center mb-4">
             <div className="flex items-center gap-3">
               <div className="bg-black text-white p-3 rounded-xl shadow-[2px_2px_0px_0px_var(--primary)] border-2 border-black"><ShoppingBag size={24} strokeWidth={3}/></div>
               <div>
                 <h2 className="font-black text-2xl italic uppercase leading-none">Caja <span className="text-[var(--primary)]">Actual</span></h2>
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mt-1">Ticket de Venta</span>
               </div>
             </div>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 text-blue-700 px-3 py-2 rounded-xl flex items-center gap-2">
             <User size={16} />
             <span className="font-bold text-[10px] uppercase">Facturación: Público General</span>
          </div>
        </div>

        {/* Lista de Items */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50 relative custom-scrollbar">
          {carritoVenta.length === 0 ? (
            <div className="absolute inset-6 flex flex-col items-center justify-center text-center p-6 border-[3px] border-slate-300 border-dashed rounded-3xl text-slate-400 bg-white">
              <Package size={48} strokeWidth={2} className="mb-4 text-slate-300" />
              <h4 className="font-black text-sm uppercase text-slate-500">Caja Vacía</h4>
              <p className="font-bold text-[10px] mt-2 uppercase tracking-wider">Añade productos del catálogo para empezar.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {carritoVenta.map(item => (
                <div key={item.id} className="bg-white border-[3px] border-black p-4 rounded-2xl shadow-[4px_4px_0px_0px_black] flex flex-col gap-3 relative animate-in slide-in-from-right-4">
                  
                  <div className="flex justify-between items-start pr-2">
                    <div className="flex-1">
                      <span className="font-black text-sm uppercase leading-tight text-slate-800 block mb-1 pr-4">{item.nombre}</span>
                      <span className="text-[10px] font-black uppercase text-slate-400">${item.precio_base.toFixed(2)} / ud</span>
                    </div>
                    <span className="font-black text-lg text-slate-800">${(item.precio_base * item.qty).toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t-2 border-slate-100">
                     <div className="flex items-center gap-1 bg-slate-100 border-2 border-black rounded-xl p-1 shadow-inner">
                        <button onClick={()=>updateCarritoQty(item.id, -1, onToast)} className="text-rose-500 p-1 hover:bg-white rounded-lg transition-colors border-2 border-transparent hover:border-black"><Minus size={16} strokeWidth={4}/></button>
                        <span className="font-black text-sm min-w-[24px] text-center">{item.qty}</span>
                        <button onClick={()=>updateCarritoQty(item.id, 1, onToast)} className="text-emerald-500 p-1 hover:bg-white rounded-lg transition-colors border-2 border-transparent hover:border-black"><Plus size={16} strokeWidth={4}/></button>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total y Checkout */}
        <div className="bg-white border-t-[4px] border-black p-6 space-y-5 rounded-b-[1.5rem] shadow-[0px_-10px_20px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-end bg-slate-100 p-5 rounded-2xl border-[3px] border-black shadow-inner">
            <span className="font-black text-xs uppercase text-slate-500 tracking-widest block mb-1">Subtotal</span>
            <span className="font-black text-4xl leading-none italic block text-emerald-500">${calcularTotal().toFixed(2)}</span>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Método de Pago</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'efectivo', label: 'Efectivo', color: 'bg-emerald-400' },
                { id: 'tarjeta', label: 'Tarjeta', color: 'bg-indigo-400' },
                { id: 'qr', label: 'QR Bank', color: 'bg-purple-400' }
              ].map(met => (
                <button 
                  key={met.id} onClick={()=>setMetodoPago(met.id)}
                  className={`py-3 rounded-xl border-[3px] border-black font-black text-[10px] uppercase transition-all ${metodoPago === met.id ? `${met.color} text-black shadow-[3px_3px_0px_0px_black] translate-y-0.5` : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                >
                  {met.label}
                </button>
              ))}
            </div>
          </div>

          <button 
            disabled={carritoVenta.length === 0}
            onClick={onCheckoutClick}
            className="w-full bg-black text-white py-5 rounded-2xl border-[4px] border-black font-black text-lg uppercase tracking-widest shadow-[6px_6px_0px_0px_var(--primary)] hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[6px_6px_0px_0px_black]"
          >
            Cobrar Venta <CheckCircle2 size={24} strokeWidth={3}/>
          </button>
        </div>
      </aside>

      <PopModal isOpen={isAjusteOpen} onClose={() => setIsAjusteOpen(false)} title="Ajuste de Stock Manual" icon={Settings2}>
        {ajusteData.producto && (
          <div className="space-y-6">
            <div className="bg-slate-100 border-[4px] border-black p-5 rounded-3xl flex justify-between items-center shadow-[4px_4px_0px_0px_black]">
               <div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Producto a modificar:</span>
                 <h4 className="font-black text-xl uppercase italic text-slate-800">{ajusteData.producto.nombre}</h4>
               </div>
               <div className="text-right">
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Stock Actual</span>
                 <span className="font-black text-2xl px-4 py-2 bg-white border-2 border-black rounded-xl block shadow-inner">{ajusteData.producto.stock_actual}</span>
               </div>
            </div>

            <div className="flex bg-slate-200 p-2 rounded-2xl border-[3px] border-black gap-2">
               <button 
                 type="button" onClick={() => setAjusteData({...ajusteData, tipo: 'ingreso', motivo: MOTIVOS_AJUSTE.ingreso[0]})}
                 className={`flex-1 py-4 rounded-xl font-black text-sm uppercase flex justify-center items-center gap-2 transition-all ${ajusteData.tipo === 'ingreso' ? 'bg-emerald-400 text-black shadow-[2px_2px_0px_0px_black] border-2 border-black' : 'text-slate-500 border-2 border-transparent hover:bg-white'}`}
               >
                 <ArrowUpRight size={20} strokeWidth={3}/> Ingresar (+)
               </button>
               <button 
                 type="button" onClick={() => setAjusteData({...ajusteData, tipo: 'salida', motivo: MOTIVOS_AJUSTE.salida[0]})}
                 className={`flex-1 py-4 rounded-xl font-black text-sm uppercase flex justify-center items-center gap-2 transition-all ${ajusteData.tipo === 'salida' ? 'bg-rose-500 text-white shadow-[2px_2px_0px_0px_black] border-2 border-black' : 'text-slate-500 border-2 border-transparent hover:bg-white'}`}
               >
                 <ArrowDownRight size={20} strokeWidth={3}/> Retirar (-)
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-3xl border-[3px] border-black border-dashed">
              <BrutalInput 
                label={`Cantidad a ${ajusteData.tipo === 'ingreso' ? 'Sumar' : 'Restar'}`} type="number" min="1" max={ajusteData.tipo === 'salida' ? ajusteData.producto.stock_actual : undefined} 
                value={ajusteData.cantidad} onChange={(e) => setAjusteData({...ajusteData, cantidad: e.target.value})} 
                icon={ajusteData.tipo === 'ingreso' ? Plus : Minus}
              />
              
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 block">Razón del Ajuste</label>
                <select 
                  value={ajusteData.motivo} onChange={(e) => setAjusteData({...ajusteData, motivo: e.target.value})}
                  className="w-full bg-slate-50 border-[3px] border-black rounded-xl px-4 py-3 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-slate-300 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] cursor-pointer"
                >
                  {MOTIVOS_AJUSTE[ajusteData.tipo].map(motivo => (
                    <option key={motivo} value={motivo}>{motivo.toUpperCase().replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <BrutalInput 
                  label="Notas Adicionales (Opcional)" type="text" placeholder="Ej. Frasco se cayó, Devolución de ticket #42..." 
                  value={ajusteData.notas} onChange={(e) => setAjusteData({...ajusteData, notas: e.target.value})} 
                  icon={FileText}
                />
              </div>
            </div>

            <button onClick={handleConfirmAjuste} className="w-full bg-black text-white py-5 rounded-2xl border-[3px] border-black font-black text-lg uppercase tracking-wider shadow-[6px_6px_0px_0px_var(--primary)] hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2 mt-4">
              Aplicar Ajuste en BD <CheckCircle2 size={24} strokeWidth={3}/>
            </button>
          </div>
        )}
      </PopModal>

    </div>
  );
};

export default ReceptionPosView;
