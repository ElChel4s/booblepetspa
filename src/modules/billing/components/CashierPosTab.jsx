import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Search, ShoppingBag, User, ClipboardCheck, 
  Trash2, Plus, Minus, CheckCircle2, Ticket, QrCode 
} from 'lucide-react';
import PopModal from '../../../components/common/organisms/PopModal';

const CashierPosTab = ({ 
  pendingBookings, 
  productsCatalog,
  isLoading,
  onProcessPayment,
  onShowReceipt 
}) => {
  const [activeBooking, setActiveBooking] = useState(null);
  const [addedProducts, setAddedProducts] = useState([]);
  
  // Datos de Facturación
  const [nitCi, setNitCi] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  
  // Puntos de lealtad
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [availablePoints, setAvailablePoints] = useState(0);

  // Formas de pago
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [cashReceived, setCashReceived] = useState('');
  const [changeDue, setChangeDue] = useState(0);

  // Modales
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrSimulatingStatus, setQrSimulatingStatus] = useState('waiting');

  const selectBooking = (booking) => {
    setActiveBooking(booking);
    setNitCi(booking.nitCi || '');
    setRazonSocial(booking.razonSocial || '');
    setAvailablePoints(booking.puntos_lealtad || 0);
    setAddedProducts([]);
    setUseLoyaltyPoints(false);
    setCashReceived('');
    setChangeDue(0);
    setPaymentMethod('efectivo');
  };

  const addProductToTicket = (product) => {
    const existing = addedProducts.find(p => p.id === product.id);
    if (existing) {
      if (existing.cantidad >= product.stock_actual) return;
      setAddedProducts(addedProducts.map(p => 
        p.id === product.id ? { ...p, cantidad: p.cantidad + 1 } : p
      ));
    } else {
      setAddedProducts([...addedProducts, { ...product, cantidad: 1 }]);
    }
  };

  const removeProductQty = (productId) => {
    const existing = addedProducts.find(p => p.id === productId);
    if (!existing) return;
    if (existing.cantidad === 1) {
      setAddedProducts(addedProducts.filter(p => p.id !== productId));
    } else {
      setAddedProducts(addedProducts.map(p => 
        p.id === productId ? { ...p, cantidad: p.cantidad - 1 } : p
      ));
    }
  };

  const removeProductCompletely = (productId) => {
    setAddedProducts(addedProducts.filter(p => p.id !== productId));
  };

  // Cálculos Financieros
  const subtotalServicios = activeBooking ? activeBooking.servicios.reduce((acc, s) => acc + s.precio, 0) : 0;
  const subtotalProductos = addedProducts.reduce((acc, p) => acc + (p.precio_base * p.cantidad), 0);
  const subtotalGeneral = subtotalServicios + subtotalProductos;
  
  const descuentoPuntos = useLoyaltyPoints ? Math.min(availablePoints / 10, subtotalGeneral) : 0;
  const totalCobrar = Math.max(subtotalGeneral - descuentoPuntos, 0);

  useEffect(() => {
    if (paymentMethod === 'efectivo' && cashReceived) {
      const received = parseFloat(cashReceived) || 0;
      setChangeDue(Math.max(received - totalCobrar, 0));
    } else {
      setChangeDue(0);
    }
  }, [cashReceived, totalCobrar, paymentMethod]);

  const triggerQrSimulate = () => {
    setQrSimulatingStatus('waiting');
    setIsQrModalOpen(true);
    setTimeout(() => {
      setQrSimulatingStatus('success');
    }, 2500);
  };

  const processCheckout = async () => {
    if (!activeBooking) return;
    
    if (paymentMethod === 'efectivo') {
      const received = parseFloat(cashReceived) || 0;
      if (received < totalCobrar) {
        alert('El monto en efectivo recibido es menor al total a cobrar.');
        return;
      }
    }

    const ticketId = 'FAC-' + Math.floor(100000 + Math.random() * 900000);
    const invoice = {
      id: ticketId,
      reserva_id: activeBooking.id,
      fecha: new Date().toLocaleString(),
      cliente: activeBooking.cliente,
      nitCi: nitCi || '0',
      razonSocial: razonSocial || activeBooking.cliente,
      mascota: activeBooking.mascota,
      servicios: activeBooking.servicios,
      productos: addedProducts,
      subtotal: subtotalGeneral,
      descuento: descuentoPuntos,
      total: totalCobrar,
      metodoPago: paymentMethod,
      montoRecibido: paymentMethod === 'efectivo' ? parseFloat(cashReceived) : totalCobrar,
      cambio: changeDue
    };

    // Usar la función real de procesamiento
    const success = await onProcessPayment(invoice);
    
    if (success) {
      setActiveBooking(null);
      setAddedProducts([]);
      // Muestra recibo usando función del padre
      onShowReceipt(invoice);
    }
  };

  const filteredProducts = (productsCatalog || []).filter(p => 
    p.nombre.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="grid grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* PANEL IZQUIERDO: Reservas Listas para Cobrar */}
      <div className="col-span-12 lg:col-span-5 flex flex-col gap-5">
        <div className="bg-white border-[4px] border-black rounded-[2rem] shadow-[8px_8px_0px_0px_black] p-6">
          <h2 className="text-xl font-black italic uppercase tracking-tight mb-4 flex items-center gap-2 border-b-4 border-slate-100 pb-2">
            <ClipboardCheck size={20} className="text-teal-500" />
            Citas Finalizadas
          </h2>
          
          {pendingBookings.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-100 border-[3px] border-black rounded-full flex items-center justify-center text-slate-400 mb-3 shadow-[3px_3px_0px_0px_black]">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="font-bold text-slate-600">¡Al día!</h3>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1">
                No hay reservas finalizadas pendientes de facturar.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-1">
              {pendingBookings.map((booking) => {
                const isActive = activeBooking?.id === booking.id;
                const totalServs = booking.servicios.reduce((a, s) => a + s.precio, 0);
                return (
                  <div 
                    key={booking.id}
                    onClick={() => selectBooking(booking)}
                    className={`border-[3px] border-black p-4 rounded-2xl cursor-pointer transition-all hover:-translate-y-1 active:translate-y-0 ${
                      isActive 
                        ? 'bg-amber-300 shadow-[4px_4px_0px_0px_black]' 
                        : 'bg-white hover:shadow-[5px_5px_0px_0px_black]'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-black text-sm text-black uppercase">{booking.cliente}</h3>
                        <div className="flex gap-2 mt-1">
                          <span className="text-[9px] font-black uppercase bg-black text-white px-2 py-0.5 rounded-md">
                            🐾 {booking.mascota}
                          </span>
                          <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {booking.raza}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-slate-800 bg-black/5 px-2 py-1 rounded-lg">
                          {booking.id}
                        </span>
                      </div>
                    </div>
                    
                    {/* Servicios Realizados */}
                    <div className="border-t border-black/10 pt-2 mt-2">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Servicios de Spa:</p>
                      <ul className="text-xs text-slate-700 flex flex-col gap-1">
                        {booking.servicios.map((s, idx) => (
                          <li key={idx} className="flex justify-between font-mono text-[11px]">
                            <span>• {s.nombre}</span>
                            <span className="font-bold">Bs. {s.precio.toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="flex justify-between items-center mt-3 pt-2 border-t-2 border-dashed border-black/20">
                      <span className="text-[10px] font-black text-slate-500 uppercase">Total Servicios:</span>
                      <span className="text-sm font-black text-black">Bs. {totalServs.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* PANEL DERECHO: Consola de Cobro Activa */}
      <div className="col-span-12 lg:col-span-7">
        {!activeBooking ? (
          <div className="bg-white border-[4px] border-black rounded-[2rem] shadow-[8px_8px_0px_0px_black] p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-20 h-20 bg-amber-50 text-amber-500 border-[4px] border-black rounded-[2.5rem] flex items-center justify-center mb-6 shadow-[6px_6px_0px_0px_black] rotate-6">
              <ShoppingBag size={40} strokeWidth={3} />
            </div>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter">Consola de Cobro Vacía</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 max-w-sm">
              Selecciona una de las citas finalizadas a la izquierda para cargar los servicios, añadir productos y procesar el cobro.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            
            {/* Información del Cliente Cargado */}
            <div className="bg-teal-300 border-[4px] border-black rounded-[2rem] shadow-[8px_8px_0px_0px_black] p-6 relative overflow-hidden">
              <div className="absolute right-4 top-4 text-black/10 pointer-events-none">
                <User size={100} strokeWidth={1} />
              </div>
              
              <h2 className="text-[10px] font-black uppercase tracking-widest text-teal-800 mb-1">
                Cliente Seleccionado para Cobro
              </h2>
              <h3 className="text-2xl font-black uppercase text-black italic">
                {activeBooking.cliente}
              </h3>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="bg-black text-white text-[10px] font-black uppercase px-3 py-1 rounded-xl">
                  Mascota: {activeBooking.mascota} ({activeBooking.especie} - {activeBooking.raza})
                </span>
                <span className="bg-white text-black border-2 border-black text-[10px] font-black uppercase px-3 py-1 rounded-xl">
                  Cel: {activeBooking.telefono}
                </span>
                {availablePoints > 0 && (
                  <span className="bg-amber-400 text-black border-2 border-black text-[10px] font-black uppercase px-3 py-1 rounded-xl flex items-center gap-1">
                    <Ticket size={12} strokeWidth={3} />
                    {availablePoints} pts
                  </span>
                )}
              </div>
            </div>

            {/* Detalle del Cobro / Ticket */}
            <div className="bg-white border-[4px] border-black rounded-[2rem] shadow-[8px_8px_0px_0px_black] p-6">
              <div className="flex justify-between items-center mb-4 border-b-4 border-slate-100 pb-2">
                <h3 className="text-lg font-black italic uppercase tracking-tight flex items-center gap-2">
                  <ShoppingBag size={18} />
                  Conceptos a Cobrar
                </h3>
                
                <button 
                  onClick={() => {
                    setProductSearch('');
                    setIsProductModalOpen(true);
                  }}
                  className="bg-amber-400 hover:bg-amber-300 border-[3px] border-black px-3 py-1.5 rounded-xl text-[10px] font-black uppercase shadow-[3px_3px_0px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_black] cursor-pointer transition-all flex items-center gap-1"
                >
                  <Plus size={12} strokeWidth={4} />
                  Añadir Productos
                </button>
              </div>

              <div className="flex flex-col gap-2 mb-6">
                {activeBooking.servicios.map((s, idx) => (
                  <div key={'s-' + idx} className="flex justify-between items-center border-2 border-black bg-slate-50 p-3 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-slate-200 border border-black font-black px-1.5 py-0.5 rounded uppercase">
                        Servicio
                      </span>
                      <span className="font-bold text-xs uppercase text-slate-800">{s.nombre}</span>
                    </div>
                    <span className="font-mono font-black text-sm text-black">Bs. {s.precio.toFixed(2)}</span>
                  </div>
                ))}

                {addedProducts.map((p) => (
                  <div key={p.id} className="flex justify-between items-center border-2 border-black bg-amber-50 p-3 rounded-xl animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{p.emoji}</span>
                      <div className="flex flex-col">
                        <span className="font-black text-xs uppercase text-black">{p.nombre}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          P.Unit: Bs. {p.precio_base.toFixed(2)} | Stock: {p.stock_actual}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border-2 border-black rounded-lg overflow-hidden bg-white">
                        <button 
                          onClick={() => removeProductQty(p.id)}
                          className="p-1 hover:bg-slate-100 border-r-2 border-black cursor-pointer"
                        >
                          <Minus size={12} strokeWidth={4} />
                        </button>
                        <span className="px-3 font-mono font-bold text-xs">{p.cantidad}</span>
                        <button 
                          onClick={() => addProductToTicket(p)}
                          disabled={p.cantidad >= p.stock_actual}
                          className={`p-1 hover:bg-slate-100 border-l-2 border-black cursor-pointer ${p.cantidad >= p.stock_actual ? 'opacity-30 cursor-not-allowed' : ''}`}
                        >
                          <Plus size={12} strokeWidth={4} />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-sm text-black">
                          Bs. {(p.precio_base * p.cantidad).toFixed(2)}
                        </span>
                        <button 
                          onClick={() => removeProductCompletely(p.id)}
                          className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                        >
                          <Trash2 size={16} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {addedProducts.length === 0 && (
                  <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-wider py-2">
                    Sin productos adicionales. Usa el botón "Añadir Productos" si el cliente compra algo extra.
                  </p>
                )}
              </div>

              {/* Formulario NIT/Razón Social */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t-2 border-dashed border-black/20 pt-4 mb-6">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                    NIT / C.I. del Cliente
                  </label>
                  <input 
                    type="text"
                    value={nitCi}
                    onChange={(e) => setNitCi(e.target.value)}
                    placeholder="NIT o CI para factura"
                    className="w-full bg-white border-[3px] border-black rounded-xl px-3 py-2 text-xs font-bold shadow-[3px_3px_0px_0px_black] focus:outline-none focus:translate-y-0.5 focus:shadow-[2px_2px_0px_0px_black] transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                    Razón Social
                  </label>
                  <input 
                    type="text"
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                    placeholder="Nombre de facturación"
                    className="w-full bg-white border-[3px] border-black rounded-xl px-3 py-2 text-xs font-bold shadow-[3px_3px_0px_0px_black] focus:outline-none focus:translate-y-0.5 focus:shadow-[2px_2px_0px_0px_black] transition-all"
                  />
                </div>
              </div>

              {/* Integración Puntos Lealtad */}
              {availablePoints > 0 && (
                <div className="border-2 border-black bg-amber-50/50 p-3 rounded-2xl flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Ticket size={20} className="text-amber-500" />
                    <div className="flex flex-col">
                      <span className="font-black text-xs uppercase text-black">Redimir Puntos de Lealtad</span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase">
                        Disponibles: {availablePoints} pts = Máx Bs. {(availablePoints / 10).toFixed(2)} desc.
                      </span>
                    </div>
                  </div>
                  <label className="relative flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={useLoyaltyPoints} 
                      onChange={(e) => setUseLoyaltyPoints(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500 border-2 border-black"></div>
                  </label>
                </div>
              )}

              {/* Formas de Pago Selector */}
              <div className="border-t-2 border-dashed border-black/20 pt-4 mb-6">
                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2">
                  Método de Pago
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { id: 'efectivo', label: '💸 Efectivo' },
                    { id: 'tarjeta', label: '💳 Tarjeta' },
                    { id: 'qr', label: '📱 Pago QR' },
                    { id: 'transferencia', label: '🏦 Transf.' }
                  ].map((method) => {
                    const isSel = paymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`p-3 border-2 border-black rounded-xl font-black text-xs uppercase text-center transition-all cursor-pointer ${
                          isSel
                            ? 'bg-[var(--primary)] text-white shadow-[3px_3px_0px_0px_black]'
                            : 'bg-white hover:bg-slate-100 text-slate-800'
                        }`}
                      >
                        {method.label}
                      </button>
                    );
                  })}
                </div>

                {paymentMethod === 'efectivo' && (
                  <div className="bg-slate-50 border-2 border-black p-4 rounded-2xl mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex-1">
                      <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                        Efectivo Recibido (Bs.)
                      </label>
                      <input 
                        type="number"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-white border-2 border-black rounded-xl px-3 py-2 font-mono font-bold text-sm focus:outline-none"
                      />
                    </div>
                    
                    {parseFloat(cashReceived) > 0 && (
                      <div className="bg-emerald-100 border-2 border-black px-4 py-2 rounded-xl text-right">
                        <span className="block text-[9px] font-black uppercase text-emerald-800">Cambio a Entregar:</span>
                        <span className="font-mono font-black text-lg text-emerald-600">
                          Bs. {changeDue.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === 'qr' && (
                  <div className="mt-4 flex gap-3 animate-in slide-in-from-top-2 duration-200">
                    <button
                      onClick={triggerQrSimulate}
                      className="flex-1 bg-amber-400 hover:bg-amber-300 text-black border-[3px] border-black px-4 py-3 rounded-xl shadow-[4px_4px_0px_0px_black] font-black uppercase text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:translate-x-[2px] active:translate-y-[2px]"
                    >
                      <QrCode size={16} strokeWidth={3} />
                      Desplegar QR del Spa
                    </button>
                  </div>
                )}
              </div>

              {/* Desglose de Totales */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 border-[3px] border-black mb-6">
                <div className="flex flex-col gap-2 font-mono text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>SUBTOTAL SERVICIOS:</span>
                    <span>Bs. {subtotalServicios.toFixed(2)}</span>
                  </div>
                  {subtotalProductos > 0 && (
                    <div className="flex justify-between text-slate-400">
                      <span>SUBTOTAL PRODUCTOS:</span>
                      <span>Bs. {subtotalProductos.toFixed(2)}</span>
                    </div>
                  )}
                  {descuentoPuntos > 0 && (
                    <div className="flex justify-between text-rose-400">
                      <span>DESCUENTO LEALTAD:</span>
                      <span>-Bs. {descuentoPuntos.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-800 my-1" />
                  <div className="flex justify-between items-center text-sm font-black tracking-tight text-white">
                    <span className="font-black italic uppercase tracking-tighter">TOTAL A PAGAR:</span>
                    <span className="text-xl text-[var(--primary)] font-black">Bs. {totalCobrar.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Botón de Checkout Final */}
              <button
                onClick={processCheckout}
                className="w-full bg-[var(--primary)] hover:bg-teal-400 text-white border-[4px] border-black px-6 py-4 rounded-[1.2rem] shadow-[6px_6px_0px_0px_black] font-black uppercase text-sm tracking-widest text-center cursor-pointer transition-all active:translate-x-[3px] active:translate-y-[3px] active:shadow-[3px_3px_0px_0px_black]"
              >
                Confirmar Cobro y Facturar
              </button>
            </div>

          </div>
        )}
      </div>

      {/* MODAL: Búsqueda y Selección de Productos */}
      <PopModal 
        isOpen={isProductModalOpen} 
        onClose={() => setIsProductModalOpen(false)}
        title="🛒 Seleccionar Productos"
        maxWidth="max-w-xl"
      >
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Buscar producto por nombre..."
              className="w-full bg-white border-[3px] border-black rounded-xl pl-10 pr-4 py-3 font-bold text-sm shadow-[4px_4px_0px_0px_black] focus:outline-none focus:translate-y-1 focus:shadow-[2px_2px_0px_0px_black] transition-all"
            />
          </div>
          <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1">
            {filteredProducts.map(p => (
              <div key={p.id} className="flex justify-between items-center border-[3px] border-black rounded-xl p-3 bg-white hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{p.emoji}</span>
                  <div className="flex flex-col">
                    <span className="font-black text-xs uppercase">{p.nombre}</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">
                      Precio: Bs. {p.precio_base.toFixed(2)} | Stock: {p.stock_actual}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => addProductToTicket(p)}
                  disabled={p.stock_actual <= 0}
                  className="bg-amber-300 hover:bg-amber-200 disabled:bg-slate-200 disabled:opacity-50 border-[3px] border-black px-3 py-1.5 rounded-lg font-black uppercase text-[10px] shadow-[3px_3px_0px_0px_black] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_black] transition-all"
                >
                  Agregar
                </button>
              </div>
            ))}
          </div>
        </div>
      </PopModal>

      {/* MODAL: QR Dinámico */}
      <PopModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title="📱 Pago Móvil con QR"
        maxWidth="max-w-xs"
      >
        <div className="flex flex-col items-center justify-center text-center py-4">
          {qrSimulatingStatus === 'waiting' ? (
            <>
              <div className="w-48 h-48 bg-white border-[4px] border-black rounded-2xl shadow-[6px_6px_0px_0px_black] p-4 flex items-center justify-center relative overflow-hidden mb-4">
                <QrCode className="text-slate-300 w-full h-full" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-400/30 to-transparent animate-pulse-vertical"></div>
              </div>
              <h3 className="font-black italic uppercase text-lg">Esperando Pago</h3>
              <p className="text-xs text-slate-500 font-bold uppercase mt-1">Por favor escanee con su banco móvil</p>
              <div className="mt-4 flex gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce delay-100"></span>
                <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce delay-200"></span>
              </div>
            </>
          ) : (
            <>
              <div className="w-32 h-32 bg-emerald-100 border-[4px] border-black rounded-full shadow-[6px_6px_0px_0px_black] flex items-center justify-center mb-4 animate-in zoom-in">
                <CheckCircle2 size={64} className="text-emerald-500" strokeWidth={3} />
              </div>
              <h3 className="font-black italic uppercase text-xl text-emerald-600">¡Pago Exitoso!</h3>
              <p className="text-xs text-slate-500 font-bold uppercase mt-1">Transacción procesada correctamente.</p>
              <button 
                onClick={() => setIsQrModalOpen(false)}
                className="mt-6 bg-black text-white font-black uppercase text-xs px-6 py-3 rounded-xl hover:bg-slate-800 transition-colors"
              >
                Continuar
              </button>
            </>
          )}
        </div>
      </PopModal>
    </div>
  );
};

CashierPosTab.propTypes = {
  pendingBookings: PropTypes.array.isRequired,
  productsCatalog: PropTypes.array.isRequired,
  isLoading: PropTypes.bool,
  onProcessPayment: PropTypes.func.isRequired,
  onShowReceipt: PropTypes.func.isRequired
};

export default CashierPosTab;
