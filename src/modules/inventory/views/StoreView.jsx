import { useState, useMemo } from 'react';
import { 
  Heart, Calendar, Search, RefreshCw, Info, ShoppingCart, 
  X, CheckCircle2, Ticket, Camera, CalendarDays, User, Plus, Minus,
  ShieldCheck, ArrowUpRight, QrCode, Upload, Clock
} from 'lucide-react';

import { useClientStore } from '../hooks/useClientStore';
import { useAuth } from '../../../store/AuthContext';
import { useToast } from '../../../store/ToastContext';

import FilterPanel from '../components/FilterPanel';
import ProductCard from '../components/ProductCard';
import PopModal from '../../../components/common/organisms/PopModal';
import BrutalInput from '../../../components/common/atoms/BrutalInput';
import StoreSchedulePicker from '../components/StoreSchedulePicker';

const StoreView = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  
  const {
    catalog, userPets, selectedPet, setSelectedPet,
    isLoading, cart, favorites, toggleFavorite,
    addToCart, updateCartQty, calcularPrecio, handleCheckout, clearCart
  } = useClientStore(currentUser?.id);

  const [activeCategory, setActiveCategory] = useState('Todos');
  const [petType, setPetType] = useState('Ambos');
  const [onlyStock, setOnlyStock] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estado de modo de vista (Productos vs Servicios)
  const [viewMode, setViewMode] = useState('productos');
  
  // Filtros visibles en mobile
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Estados de UI Modales
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  
  // Checkout
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('form');
  const [guestData, setGuestData] = useState({ nombre: '', ci: '', telefono: '' });
  const [scheduleData, setScheduleData] = useState({ fecha: '', hora: '' });
  const [orderCode, setOrderCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Archivo comprobante QR
  const [fileName, setFileName] = useState('');
  const [fileObject, setFileObject] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFileName(file.name);
      setFileObject(file);
    }
  };

  // Calcular las categorías dinámicas
  const dynamicCategories = useMemo(() => {
    const items = catalog.filter(p => viewMode === 'productos' ? p.tipo === 'producto' : p.tipo === 'servicio');
    const uniqueCats = [...new Set(items.map(p => p.categoria).filter(Boolean))];
    const formatted = uniqueCats.map(c => c.charAt(0).toUpperCase() + c.slice(1).toLowerCase());
    return ['Todos', ...new Set(formatted)];
  }, [catalog, viewMode]);

  // Filtrado de catalogo
  const filteredCatalog = useMemo(() => {
    return catalog
      .filter((p) => viewMode === 'productos' ? p.tipo === 'producto' : p.tipo === 'servicio')
      .filter((p) => activeCategory === 'Todos' || p.categoria.toLowerCase() === activeCategory.toLowerCase())
      .filter((p) => {
        if (petType === 'Ambos') return true;
        return !p.especie || p.especie === 'todos' || p.especie.toLowerCase() === petType.toLowerCase();
      })
      .filter((p) => (onlyStock && p.tipo === 'producto' ? p.stock > 0 : true))
      .filter((p) => p.nombre.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        const precioA = calcularPrecio(a);
        const precioB = calcularPrecio(b);
        if (sortBy === 'price-asc') return precioA - precioB;
        if (sortBy === 'price-desc') return precioB - precioA;
        if (sortBy === 'rating') return favorites.includes(b.id) ? 1 : -1;
        return 0;
      });
  }, [catalog, activeCategory, petType, onlyStock, searchQuery, sortBy, favorites, calcularPrecio, viewMode]);

  const cartTotal = cart.reduce((acc, item) => acc + (item.precio_final * item.qty), 0);

  const handleClearFilters = () => {
    setActiveCategory('Todos');
    setPetType('Ambos');
    setOnlyStock(false);
    setSortBy('default');
    setSearchQuery('');
  };

  const onToast = (msg, isError) => showToast(msg, isError ? 'error' : 'success');

  const onOpenCheckout = () => {
    setIsCartOpen(false);
    const hasServices = cart.some(i => i.tipo === 'servicio');
    setFileName('');
    setFileObject(null);
    
    if (!currentUser) {
      setCheckoutStep('form');
    } else if (hasServices) {
      setCheckoutStep('schedule');
    } else {
      setCheckoutStep('payment'); // Jump to payment if only products
    }
    setIsCheckoutOpen(true);
  };

  const submitCheckout = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const code = await handleCheckout(guestData, scheduleData, fileObject);
      setOrderCode(code);
      setCheckoutStep('success');
      clearCart();
    } catch (err) {
      onToast("Error al procesar el pago", true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="min-h-[50vh] flex items-center justify-center font-black text-2xl uppercase italic">Cargando Tienda...</div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 relative pb-24">
      
      {/* TABS DE VISTA ESTILO PILL (SLIDING) */}
      <div className="flex bg-white border-[3.5px] border-black p-1.5 rounded-[1.5rem] md:rounded-[2rem] shadow-[4px_4px_0px_0px_black] max-w-sm mx-auto mb-8 relative">
        <div 
          className={`absolute top-1.5 bottom-1.5 w-[calc(50%-0.375rem)] rounded-xl md:rounded-[1.5rem] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${viewMode === 'productos' ? 'left-1.5 bg-[var(--primary)]' : 'left-[calc(50%+0.1875rem)] bg-[var(--secondary)]'}`} 
        />
        <button 
          onClick={() => { setViewMode('productos'); setActiveCategory('Todos'); }} 
          className={`flex-1 py-3 md:py-3 rounded-xl md:rounded-[1.5rem] font-black uppercase text-[10px] md:text-xs tracking-widest relative z-10 transition-colors duration-300 flex items-center justify-center gap-2 ${viewMode === 'productos' ? 'text-black' : 'text-slate-400 hover:text-black'}`}
        >
          <span>🛒</span> Productos
        </button>
        <button 
          onClick={() => { setViewMode('servicios'); setActiveCategory('Todos'); }} 
          className={`flex-1 py-3 md:py-3 rounded-xl md:rounded-[1.5rem] font-black uppercase text-[10px] md:text-xs tracking-widest relative z-10 transition-colors duration-300 flex items-center justify-center gap-2 ${viewMode === 'servicios' ? 'text-black' : 'text-slate-400 hover:text-black'}`}
        >
          <span>✂️</span> Servicios
        </button>
      </div>

      <div className="md:hidden mb-6">
        <button 
          onClick={() => setShowFiltersMobile(!showFiltersMobile)}
          className="w-full bg-white border-[3.5px] border-black py-4 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_black] active:translate-y-1 active:shadow-none transition-all"
        >
          <Search size={16} /> Buscar y Filtrar
        </button>
      </div>

      <div className={`transition-all duration-500 overflow-hidden ${showFiltersMobile ? 'max-h-[800px] opacity-100 mb-8' : 'max-h-0 opacity-0 md:max-h-[800px] md:opacity-100 md:mb-12'}`}>
        <FilterPanel
          activeCategory={activeCategory} setActiveCategory={setActiveCategory}
          petType={petType} setPetType={setPetType}
          sortBy={sortBy} setSortBy={setSortBy}
          onlyStock={onlyStock} setOnlyStock={setOnlyStock}
          searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          onClearFilters={handleClearFilters}
          viewMode={viewMode}
          categoriesList={dynamicCategories}
        />
      </div>

      {/* BARRA DE MIS MASCOTAS (Solo si hay logueo y mascotas) */}
      {currentUser && userPets.length > 0 && (
        <div className="mb-10 bg-white border-[4px] border-black p-5 rounded-[2rem] shadow-[6px_6px_0px_0px_black] animate-in fade-in">
          <h3 className="font-black text-[10px] uppercase text-slate-500 tracking-widest mb-4 pl-2 flex items-center gap-2">
            <Heart size={14} className="text-rose-500"/> Personalizar tarifas para:
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
            <button 
              onClick={() => setSelectedPet(null)}
              className={`flex items-center gap-3 px-5 py-3 rounded-full border-[3px] border-black font-black text-xs uppercase transition-all whitespace-nowrap shrink-0 ${selectedPet === null ? 'bg-black text-white shadow-[3px_3px_0px_0px_var(--primary)] translate-y-0.5' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 shadow-[4px_4px_0px_0px_black]'}`}
            >
              🌍 Tarifario General
            </button>
            {userPets.map(pet => (
              <button 
                key={pet.id} onClick={() => setSelectedPet(pet)}
                className={`flex items-center gap-3 px-5 py-3 rounded-full border-[3px] border-black font-black text-xs uppercase transition-all whitespace-nowrap shrink-0 ${selectedPet?.id === pet.id ? 'bg-[var(--secondary)] text-black shadow-[3px_3px_0px_0px_black] translate-y-0.5' : 'bg-white text-slate-600 hover:bg-slate-100 shadow-[4px_4px_0px_0px_black]'}`}
              >
                <span className="text-xl leading-none bg-white/50 rounded-full p-1 border-2 border-black/20">{pet.avatar}</span> 
                <div className="text-left">
                  <span className="block leading-none">{pet.nombre}</span>
                  <span className="text-[8px] tracking-widest opacity-70 block mt-0.5">{pet.tamano} • {pet.temperamento}</span>
                </div>
              </button>
            ))}
          </div>
          {selectedPet && (
            <div className="mt-4 bg-indigo-50 border-2 border-indigo-400 text-indigo-800 px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 w-fit shadow-sm">
              <Info size={14}/> Tarifas personalizadas para {selectedPet.nombre} activas (Recargos por tamaño/temperamento).
            </div>
          )}
        </div>
      )}

      {/* GRID DE RESULTADOS */}
      {filteredCatalog.length > 0 ? (
        <div className="mb-12">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-6 flex items-center gap-3">
            <span className={`p-2 rounded-xl border-2 border-black ${viewMode === 'productos' ? 'bg-[var(--primary)] rotate-[3deg]' : 'bg-[var(--secondary)] rotate-[-5deg]'}`}>
              {viewMode === 'productos' ? '🛒' : '✂️'}
            </span>
            {viewMode === 'productos' ? 'Productos' : 'Servicios Spa'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 auto-rows-auto gap-4 md:gap-12 grid-flow-dense px-2">
            {filteredCatalog.map((item, index) => {
              item.precio_calculado = calcularPrecio(item);
              return (
                <ProductCard
                  key={item.id}
                  item={item}
                  index={index}
                  onAddToCart={(i) => addToCart(i, onToast)}
                  isAdded={cart.some(c => c.id === item.id)}
                  onOpenDetail={setDetailItem}
                  toggleFavorite={toggleFavorite}
                  isFav={favorites.includes(item.id)}
                  readOnly={viewMode === 'servicios'}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center p-12 bg-white border-[4px] border-black rounded-[2rem] shadow-[8px_8px_0px_0px_black] mt-8">
          <Search size={48} className="mx-auto mb-4 text-slate-300" strokeWidth={2}/>
          <h3 className="font-black text-xl uppercase italic">No encontramos lo que buscas</h3>
          <p className="text-slate-500 font-bold mt-2">Prueba cambiando los filtros de búsqueda</p>
          <button onClick={handleClearFilters} className="mt-6 px-6 py-3 bg-[var(--primary)] border-[3px] border-black rounded-xl font-black uppercase text-xs shadow-[4px_4px_0px_0px_black] hover:translate-y-1 hover:shadow-none transition-all">Limpiar Filtros</button>
        </div>
      )}

      {/* WIDGET DEL CARRITO FLOTANTE */}
      <button 
        onClick={() => setIsCartOpen(true)} 
        className="fixed bottom-8 right-8 z-[100] bg-black text-white p-5 rounded-[2rem] border-[4px] border-[var(--secondary)] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:scale-105 hover:-rotate-6 transition-all group"
      >
        <ShoppingCart size={32} strokeWidth={2.5} />
        {cart.length > 0 && (
          <span className="absolute -top-3 -right-3 bg-rose-500 text-white w-8 h-8 rounded-full border-[3px] border-black flex items-center justify-center text-sm font-black shadow-[2px_2px_0px_0px_black] animate-bounce">
            {cart.reduce((a,c) => a + c.qty, 0)}
          </span>
        )}
      </button>

      {/* DRAWER DEL CARRITO */}
      <div className={`fixed inset-0 z-[400] pointer-events-none ${isCartOpen ? 'visible' : 'invisible'}`}>
        <div className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm pointer-events-auto transition-opacity duration-300 ${isCartOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsCartOpen(false)}></div>
        <div className={`absolute right-0 top-0 bottom-0 w-full md:w-[450px] bg-white border-l-[6px] border-black shadow-2xl pointer-events-auto flex flex-col transform transition-transform duration-300 ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-6 bg-[var(--secondary)] border-b-[4px] border-black flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-white text-black p-3 rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_0px_black] rotate-[-5deg]">
                <ShoppingCart size={24} strokeWidth={3}/>
              </div>
              <h2 className="text-3xl font-black italic uppercase tracking-tighter">Bolsa</h2>
            </div>
            <button onClick={() => setIsCartOpen(false)} className="p-2 bg-white rounded-full border-[3px] border-black shadow-[2px_2px_0px_0px_black] hover:translate-y-0.5 hover:shadow-none transition-all"><X size={20} strokeWidth={4}/></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 relative">
            {cart.length === 0 ? (
              <div className="absolute inset-8 flex flex-col items-center justify-center text-center p-6 border-[3px] border-slate-300 border-dashed rounded-3xl text-slate-400 bg-white">
                <ShoppingCart size={48} strokeWidth={2} className="mb-4 text-slate-300"/>
                <p className="font-black text-sm uppercase">Tu bolsa está vacía</p>
              </div>
            ) : (
              cart.map((item, index) => (
                <div key={index} className="flex gap-4 p-4 border-[3px] border-black rounded-2xl shadow-[4px_4px_0px_0px_black] bg-white relative">
                  <div className={`w-16 h-16 ${item.color || 'bg-slate-100'} border-[3px] border-black rounded-xl flex items-center justify-center text-3xl shrink-0`}>
                    {item.emoji}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border-2 border-black mb-1 inline-block ${item.tipo === 'producto' ? 'bg-cyan-100' : 'bg-purple-100'}`}>
                        {item.tipo === 'producto' ? '🛒 Producto' : `✂️ Spa ${item.pet_asignado ? `para ${item.pet_asignado.nombre}` : ''}`}
                      </span>
                      <h4 className="font-black text-xs uppercase leading-tight pr-6 line-clamp-2">{item.nombre}</h4>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-black text-sm bg-black text-white px-2 py-1 rounded-lg border-2 border-black -rotate-1">${(item.precio_final * item.qty).toFixed(2)}</span>
                      {item.tipo === 'producto' ? (
                        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 border-2 border-black">
                          <button onClick={()=>updateCartQty(item.cartItemId, -1, onToast)} className="p-1 hover:bg-white border border-transparent hover:border-black rounded"><Minus size={12} strokeWidth={4}/></button>
                          <span className="font-black text-xs w-5 text-center">{item.qty}</span>
                          <button onClick={()=>updateCartQty(item.cartItemId, 1, onToast)} className="p-1 hover:bg-white border border-transparent hover:border-black rounded text-[var(--primary)]"><Plus size={12} strokeWidth={4}/></button>
                        </div>
                      ) : (
                        <button onClick={()=>updateCartQty(item.cartItemId, -1, onToast)} className="text-[10px] font-black uppercase bg-rose-50 text-rose-600 px-2 py-1 rounded-md border-2 border-rose-600 hover:bg-rose-600 hover:text-white transition-colors">Quitar</button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t-[4px] border-black p-6 bg-white space-y-4">
            <div className="flex justify-between items-end bg-slate-100 p-4 rounded-2xl border-[3px] border-black shadow-inner">
              <span className="font-black text-xs uppercase tracking-widest text-slate-500">Total</span>
              <span className="font-black text-4xl italic">${cartTotal.toFixed(2)}</span>
            </div>
            
            <button 
              disabled={cart.length === 0} 
              onClick={onOpenCheckout} 
              className="w-full bg-black text-white py-5 rounded-2xl border-[4px] border-black font-black text-sm md:text-md uppercase tracking-wider shadow-[6px_6px_0px_0px_var(--primary)] hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cart.some(i => i.tipo === 'servicio') ? 'Reservar y Comprar' : 'Confirmar Pedido'} <ArrowUpRight size={20}/>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DETALLE EXPANDIDO */}
      <PopModal isOpen={!!detailItem} onClose={() => setDetailItem(null)} title={detailItem?.nombre || ''} maxWidth="max-w-5xl">
        {detailItem && (
          <div className="flex flex-col md:flex-row gap-8 md:gap-12 pb-6">
            <div className={`w-full md:w-1/3 flex flex-col items-center justify-center ${detailItem.color || 'bg-slate-100'} rounded-[3rem] border-[4px] border-black p-10 shadow-inner relative`}>
               <div className="absolute top-4 left-4 bg-white border-[3px] border-black px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_black] -rotate-6">{detailItem.categoria}</div>
               <span className="text-[8rem] drop-shadow-2xl hover:scale-110 transition-transform duration-500 mt-6">{detailItem.emoji}</span>
            </div>

            <div className="flex-1 space-y-8">
               <div className="flex justify-between items-end border-b-[4px] border-black pb-6">
                  <div className="bg-black text-white px-6 py-3 rounded-2xl border-[3px] border-black font-black text-4xl shadow-[6px_6px_0px_0px_var(--secondary)] -rotate-2">
                    ${detailItem.precio_calculado?.toFixed(2) || detailItem.precio_base.toFixed(2)}
                  </div>
                  <button 
                    disabled={detailItem.stock === 0 && detailItem.tipo === 'producto'}
                    onClick={() => { addToCart(detailItem, onToast); setDetailItem(null); }}
                    className="bg-[var(--primary)] text-black px-8 py-5 rounded-2xl border-[4px] border-black font-black text-sm md:text-lg uppercase tracking-wider shadow-[6px_6px_0px_0px_black] hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50 flex gap-3"
                  >
                     {detailItem.stock === 0 && detailItem.tipo === 'producto' ? 'Agotado' : (detailItem.tipo === 'servicio' ? 'Añadir Cita' : 'Al Carrito')} 
                     {detailItem.stock !== 0 && (detailItem.tipo === 'servicio' ? <Calendar size={24}/> : <Plus size={24}/>)}
                  </button>
               </div>

               <div className="space-y-4">
                  <h4 className="font-black text-xs uppercase text-slate-400 tracking-widest flex items-center gap-2"><Info size={16}/> Descripción</h4>
                  <p className="font-bold text-slate-700 text-xl leading-snug">{detailItem.descripcion}</p>
               </div>

               {detailItem.tipo === 'servicio' && (
                 <div className="space-y-8 pt-6 border-t-[4px] border-black border-dashed">
                    <div className="bg-amber-100 border-[3px] border-amber-400 p-5 rounded-3xl flex items-center gap-4 shadow-[4px_4px_0px_0px_black]">
                       <div className="bg-amber-400 p-3 rounded-full border-[3px] border-black shrink-0"><CheckCircle2 size={24} strokeWidth={3}/></div>
                       <div>
                         <h4 className="font-black text-xs uppercase text-amber-900 tracking-widest mb-1">Precios Dinámicos</h4>
                         <p className="text-[11px] font-bold text-amber-800 leading-tight">El precio final puede ajustarse en el carrito según el tamaño y temperamento de la mascota seleccionada.</p>
                       </div>
                    </div>

                    <div>
                      <h4 className="font-black text-2xl italic uppercase text-slate-800 tracking-tight mb-6">El Proceso</h4>
                      <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-[19px] before:w-1.5 before:bg-black before:rounded-full">
                         {detailItem.pasos?.map((paso, idx) => (
                           <div key={idx} className="relative pl-12 group">
                              <div className="absolute left-0 top-1 w-11 h-11 bg-white text-black rounded-full border-[3px] border-black flex items-center justify-center font-black shadow-[2px_2px_0px_0px_black] z-10 group-hover:bg-black group-hover:text-white transition-colors">{idx + 1}</div>
                              <div className="bg-white border-[3px] border-black p-5 rounded-2xl shadow-[4px_4px_0px_0px_black] group-hover:-translate-y-1 transition-transform">
                                <h5 className="font-black text-md uppercase text-slate-800 mb-1">{paso.titulo}</h5>
                                <p className="font-bold text-xs text-slate-500">{paso.desc}</p>
                              </div>
                           </div>
                         ))}
                      </div>
                    </div>
                 </div>
               )}
            </div>
          </div>
        )}
      </PopModal>

      {/* MODAL CHECKOUT MULTI-PASO */}
      <PopModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} title="Finalizar Orden" maxWidth="max-w-md">
        <div className="pb-6">
        {checkoutStep === 'form' && (
           <form onSubmit={(e) => { 
             e.preventDefault(); 
             if (cart.some(i => i.tipo === 'servicio')) {
               setCheckoutStep('schedule');
             } else {
               setCheckoutStep('payment');
             }
           }} className="space-y-5">
              <div className="bg-amber-100 border-[3px] border-amber-400 p-5 rounded-2xl mb-8 shadow-inner">
                <p className="text-sm font-black text-amber-900 uppercase">Comprando como Invitado</p>
                <p className="text-[11px] font-bold text-amber-700 mt-1">Ingresa para asociar tus mascotas o déjanos tus datos si es rápido.</p>
              </div>
              <BrutalInput required label="Nombre Completo" placeholder="Ej. Juan Pérez" value={guestData.nombre} onChange={e=>setGuestData({...guestData, nombre: e.target.value})} icon={User} />
              <BrutalInput required label="Carnet (CI/NIT)" placeholder="Ej. 1234567" value={guestData.ci} onChange={e=>setGuestData({...guestData, ci: e.target.value})} icon={Info} />
              <BrutalInput required type="tel" label="Teléfono / WhatsApp" placeholder="Ej. 70012345" value={guestData.telefono} onChange={e=>setGuestData({...guestData, telefono: e.target.value})} />

              <button type="submit" className="w-full bg-[var(--primary)] text-black py-5 rounded-2xl font-black uppercase tracking-widest border-[4px] border-black shadow-[6px_6px_0px_0px_black] hover:translate-y-1 hover:shadow-none transition-all mt-6 text-lg">
                Continuar {cart.some(i => i.tipo === 'servicio') ? 'a Fecha 📅' : 'a Pago 💳'}
              </button>
           </form>
        )}

        {checkoutStep === 'schedule' && (
           <form onSubmit={submitCheckout} className="space-y-5">
              <div className="bg-blue-100 border-[3px] border-blue-500 p-5 rounded-2xl mb-8 shadow-inner">
                <p className="text-sm font-black text-blue-900 uppercase flex items-center gap-2"><CalendarDays size={18}/> Agendar Servicios</p>
                <p className="text-[11px] font-bold text-blue-700 mt-1">Selecciona el día y hora para los servicios de Spa de tu mascota.</p>
              </div>
              
              <StoreSchedulePicker 
                totalTimeMinutes={cart.filter(i => i.tipo === 'servicio').reduce((acc, s) => acc + (s.duracion || 60) * s.qty, 0)}
                value={scheduleData}
                onChange={setScheduleData}
              />

              <button 
                type="submit" 
                disabled={isSubmitting || !scheduleData.fecha || !scheduleData.hora}
                className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-widest border-[4px] border-black shadow-[6px_6px_0px_0px_var(--secondary)] hover:translate-y-1 hover:shadow-none transition-all mt-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmitting ? 'Procesando... ⌛' : 'Confirmar Reserva ✔️'}
              </button>
           </form>
        )}

        {checkoutStep === 'payment' && (
           <form onSubmit={submitCheckout} className="space-y-5">
              <div className="bg-amber-100 border-[3px] border-amber-400 p-5 rounded-2xl mb-6 shadow-inner">
                <p className="text-sm font-black text-amber-900 uppercase flex items-center gap-2">
                   <QrCode size={18}/> Pago Móvil (QR)
                </p>
                <p className="text-[11px] font-bold text-amber-700 mt-1">
                  Escanea el código QR desde tu app bancaria y sube el comprobante de pago para validar tu pedido de productos.
                </p>
              </div>
              
              <div className="flex flex-col items-center">
                 <div className="bg-white border-[4px] border-black p-4 rounded-3xl shadow-[5px_5px_0px_0px_black] mb-4">
                   <div className="w-40 h-40 bg-slate-100 flex items-center justify-center border-2 border-slate-300">
                     <QrCode size={120} strokeWidth={1.5} className="text-slate-800" />
                   </div>
                 </div>
                 <span className="font-black text-xl italic mb-4 text-black">Total: Bs. {cartTotal.toFixed(2)}</span>
              </div>

              {/* Carga de Comprobante/Factura */}
              <div className="relative w-full border-[3px] border-dashed border-black bg-slate-50 hover:bg-slate-100 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group">
                <input 
                  type="file" 
                  accept="image/*,.pdf" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                  required
                />
                {fileName ? (
                  <>
                    <CheckCircle2 className="text-emerald-500 mb-2" size={24} strokeWidth={3} />
                    <span className="font-bold text-sm text-slate-800 truncate max-w-[200px]">{fileName}</span>
                    <span className="text-[10px] uppercase font-black text-slate-400 mt-1">Haz clic para cambiar archivo</span>
                  </>
                ) : (
                  <>
                    <Upload className="text-slate-400 group-hover:text-black mb-2 transition-colors" size={24} strokeWidth={3} />
                    <span className="font-bold text-sm text-slate-600">Subir Comprobante (Requerido)</span>
                    <span className="text-[10px] uppercase font-black text-slate-400 mt-1">Max 5MB (PDF/JPG/PNG)</span>
                  </>
                )}
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting || !fileName} 
                className="w-full bg-[var(--primary)] text-black py-5 rounded-2xl font-black uppercase tracking-widest border-[4px] border-black shadow-[6px_6px_0px_0px_black] hover:translate-y-1 hover:shadow-none transition-all mt-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmitting ? 'Procesando... ⌛' : 'Confirmar Pago y Pedido ✔️'}
              </button>
           </form>
        )}

        {checkoutStep === 'success' && (
           <div className="text-center space-y-6 pt-4">
              <div className="bg-[var(--secondary)] border-[4px] border-black rounded-[2.5rem] p-10 shadow-[8px_8px_0px_0px_black] relative overflow-hidden -rotate-2">
                 <Ticket size={64} className="mx-auto mb-4" strokeWidth={1.5} />
                 <h3 className="font-black text-3xl uppercase mb-2 leading-none">¡Orden Recibida!</h3>
                 <p className="text-xs font-bold mb-8">
                   {fileName ? 'Tu comprobante de pago está pendiente de validación por recepción. Te notificaremos pronto.' : 'Muestra este código en recepción para confirmar tu asistencia.'}
                 </p>
                 <div className="bg-white border-[4px] border-black py-5 px-8 rounded-2xl font-black text-4xl tracking-widest shadow-inner inline-block rotate-2">
                   {orderCode}
                 </div>
              </div>

              {!fileName && (
                <div className="bg-blue-50 border-[3px] border-blue-300 text-blue-800 p-5 rounded-2xl flex items-center justify-center gap-4 rotate-1">
                  <Camera size={28} className="animate-pulse shrink-0"/>
                  <span className="font-black text-xs uppercase tracking-wider text-left">¡Tómale una captura para no olvidarlo!</span>
                </div>
              )}

              <button onClick={() => setIsCheckoutOpen(false)} className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase tracking-widest border-[4px] border-black shadow-[6px_6px_0px_0px_black] hover:translate-y-1 hover:shadow-none transition-all mt-6">
                Volver a la Tienda
              </button>
           </div>
        )}
        </div>
      </PopModal>

    </div>
  );
};

export default StoreView;
