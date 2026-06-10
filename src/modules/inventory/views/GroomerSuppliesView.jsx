import { useState, useEffect } from 'react';
import { fetchInsumos, registrarRetiroInsumo } from '../services/groomerSuppliesService';
import { useAuth } from '../../../store/AuthContext';
import { useToast } from '../../../store/ToastContext';
import { Package, Plus, Minus, AlertCircle, Droplets, ShieldAlert, Loader } from 'lucide-react';

const GroomerSuppliesView = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInsumo, setSelectedInsumo] = useState(null);

  // Form state
  const [cantidad, setCantidad] = useState(1);
  const [motivo, setMotivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadInsumos();
  }, []);

  const loadInsumos = async () => {
    setLoading(true);
    try {
      const data = await fetchInsumos();
      setInsumos(data || []);
    } catch (error) {
      showToast('Error al cargar insumos: ' + error.message, 'error');
    }
    setLoading(false);
  };

  const handleRetiro = async (e) => {
    e.preventDefault();
    if (!selectedInsumo || !currentUser) return;
    
    if (cantidad <= 0 || cantidad > selectedInsumo.stock_actual) {
      showToast('Cantidad inválida', 'warning');
      return;
    }

    if (!motivo.trim()) {
      showToast('Debe ingresar un motivo', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await registrarRetiroInsumo(selectedInsumo.id, currentUser.id, cantidad, motivo);
      showToast('Retiro registrado correctamente', 'success');
      
      // Update local state
      setInsumos(prev => prev.map(item => 
        item.id === selectedInsumo.id 
          ? { ...item, stock_actual: item.stock_actual - cantidad }
          : item
      ));
      
      setSelectedInsumo(null);
      setCantidad(1);
      setMotivo('');
    } catch (error) {
      showToast('Error al registrar el retiro: ' + error.message, 'error');
    }
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <Loader size={48} className="text-[var(--primary)] animate-spin mb-4" />
        <p className="text-sm font-black uppercase text-slate-500 tracking-widest">Cargando Insumos...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 md:p-8 rounded-[2rem] border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-[var(--primary)] rounded-2xl flex items-center justify-center border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-3">
              <Droplets size={24} className="text-black fill-current" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter">Insumos</h1>
          </div>
          <p className="text-sm font-bold text-slate-500">Registra el uso de consumibles, shampoo y productos químicos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Listado de Insumos */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-black uppercase italic border-b-4 border-black pb-2">Catálogo de Insumos</h2>
          
          {insumos.length === 0 ? (
            <div className="p-10 bg-slate-100 rounded-3xl border-4 border-dashed border-slate-300 text-center">
              <Package size={48} className="text-slate-400 mx-auto mb-4" />
              <h3 className="font-black text-slate-500 text-lg uppercase">Sin insumos</h3>
              <p className="text-sm font-bold text-slate-400">No hay productos marcados como insumo.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {insumos.map((insumo) => (
                <div 
                  key={insumo.id} 
                  onClick={() => {
                    setSelectedInsumo(insumo);
                    setCantidad(1);
                    setMotivo('Uso en turno actual');
                  }}
                  className={`cursor-pointer p-4 rounded-3xl border-4 transition-all duration-300 ${selectedInsumo?.id === insumo.id ? 'border-[var(--primary)] bg-[var(--primary)]/10 shadow-[6px_6px_0px_0px_var(--primary)] -translate-y-1' : 'border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black uppercase text-sm leading-tight pr-4">{insumo.nombre}</h3>
                    {insumo.stock_actual <= insumo.stock_minimo_alerta && (
                      <ShieldAlert size={18} className="text-rose-500 flex-shrink-0 animate-pulse" />
                    )}
                  </div>
                  <div className="flex items-end justify-between mt-4">
                    <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-100 px-2 py-1 rounded-lg border-2 border-slate-200">
                      {insumo.categorias_productos?.nombre || 'General'}
                    </span>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Stock</p>
                      <p className={`text-2xl font-black italic ${insumo.stock_actual <= insumo.stock_minimo_alerta ? 'text-rose-500' : 'text-black'}`}>
                        {insumo.stock_actual}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel de Retiro */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sticky top-8">
            <h2 className="text-xl font-black uppercase italic mb-6 flex items-center gap-2">
              <Minus size={20} className="text-rose-500" /> Registrar Retiro
            </h2>

            {!selectedInsumo ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
                <AlertCircle size={32} className="text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500 uppercase">Selecciona un insumo<br/>para registrar el retiro</p>
              </div>
            ) : (
              <form onSubmit={handleRetiro} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Insumo Seleccionado</label>
                  <div className="p-3 bg-indigo-50 border-2 border-indigo-200 rounded-xl">
                    <p className="font-black text-indigo-900 text-sm">{selectedInsumo.nombre}</p>
                    <p className="text-xs font-bold text-indigo-600">Disp: {selectedInsumo.stock_actual} unidades</p>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Cantidad a Retirar</label>
                  <div className="flex items-center gap-4">
                    <button 
                      type="button" 
                      onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                      className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded-xl border-2 border-black hover:bg-slate-200 active:bg-slate-300 transition-colors"
                    >
                      <Minus size={20} />
                    </button>
                    <input 
                      type="number" 
                      min="1"
                      max={selectedInsumo.stock_actual}
                      value={cantidad}
                      onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
                      className="flex-1 h-12 text-center text-2xl font-black bg-white rounded-xl border-4 border-black focus:outline-none focus:border-[var(--primary)]"
                    />
                    <button 
                      type="button" 
                      onClick={() => setCantidad(Math.min(selectedInsumo.stock_actual, cantidad + 1))}
                      className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded-xl border-2 border-black hover:bg-slate-200 active:bg-slate-300 transition-colors"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Motivo / Notas</label>
                  <textarea 
                    rows="3"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Ej. Uso en turno actual, reposición de mesa 1, etc."
                    className="w-full p-3 text-sm font-bold bg-white rounded-xl border-2 border-black focus:outline-none focus:border-[var(--primary)] resize-none"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting || selectedInsumo.stock_actual < 1}
                  className="w-full h-14 bg-black text-white rounded-2xl font-black text-sm uppercase flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                >
                  {isSubmitting ? <Loader className="animate-spin" size={20} /> : <><CheckCircle size={20} /> Confirmar Retiro</>}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Pequeño workaround para importar CheckCircle que no estaba en el import superior
import { CheckCircle } from 'lucide-react';

export default GroomerSuppliesView;
