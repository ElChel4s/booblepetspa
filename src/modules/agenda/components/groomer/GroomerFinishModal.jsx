import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Camera, Heart, CheckCircle, ArrowRight, X, Package } from 'lucide-react';
import { supabase } from '../../../../api/supabase';
import { getInsumosList, saveAndFinishFicha } from '../../services/groomerAgendaService';
import { useToast } from '../../../../store/ToastContext';

export default function GroomerFinishModal({ isOpen, onClose, activeApp, currentUser, onRefresh, updateOptimistically }) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [insumosUsados, setInsumosUsados] = useState([]);
  const [insumosList, setInsumosList] = useState([]);
  
  const [fichaForm, setFichaForm] = useState({
    foto_despues: activeApp?.ficha?.foto_despues || null,
    recomendaciones_post: activeApp?.ficha?.recomendaciones_post || '',
  });

  const QUICK_RECOMMENDATIONS = ['Shampoo Avena', 'Deslanado Mensual', 'Limpieza Dental', 'Piel Sensible'];

  useEffect(() => {
    const fetchRecetaAndInsumos = async () => {
      if (!isOpen || !activeApp?.servicio_id || !supabase) return;

      try {
        const { data: recetaData, error: recetaError } = await supabase
          .from('recetas_insumos')
          .select(`
            producto_id,
            cantidad,
            productos (
              id,
              nombre,
              stock_actual
            )
          `)
          .eq('servicio_id', activeApp.servicio_id);

        if (!recetaError && recetaData) {
          const mapped = recetaData.map((item) => ({
            producto_id: item.producto_id,
            nombre: item.productos?.nombre || 'Insumo',
            cantidad: parseFloat(item.cantidad) || 1.0,
            stock_actual: item.productos?.stock_actual || 0,
            abrio_nuevo: false
          }));
          setInsumosUsados(mapped);
        } else {
          setInsumosUsados([]);
        }

        const { data: catData, error: catError } = await getInsumosList();
        if (!catError && catData) {
          setInsumosList(catData);
        }
      } catch (err) {
        console.error('Error al cargar insumos iniciales:', err);
      }
    };

    fetchRecetaAndInsumos();
  }, [isOpen, activeApp?.servicio_id]);

  if (!isOpen || !activeApp) return null;

  const handleFinalizar = async () => {
    setSaving(true);
    
    // Optimistic Update if provided
    if (updateOptimistically) {
      updateOptimistically(prev => ({
        ...prev,
        appointments: prev.appointments.map(app => app.id === activeApp.id ? { ...app, estado: 'completada' } : app)
      }));
    }

    const { error } = await saveAndFinishFicha(
      activeApp.id,
      {
        foto_despues: fichaForm.foto_despues,
        recomendaciones_post: fichaForm.recomendaciones_post,
      },
      insumosUsados,
      currentUser?.id
    );

    if (error) {
      showToast('Error al finalizar el servicio', 'error');
      if (onRefresh) await onRefresh();
    } else {
      localStorage.removeItem(`groomer_timer_${activeApp.id}`);
      localStorage.removeItem(`groomer_timer_last_active_${activeApp.id}`);
      showToast('¡Servicio finalizado y enviado a caja!', 'success');
      onClose();
      if (onRefresh) await onRefresh();
    }
    setSaving(false);
  };

  const agregarRecomendacionRapida = (chip) => {
    const newText = fichaForm.recomendaciones_post ? `${fichaForm.recomendaciones_post}\n- ${chip}` : `- ${chip}`;
    setFichaForm({ ...fichaForm, recomendaciones_post: newText });
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-emerald-400 border-[6px] border-black rounded-[3rem] p-8 shadow-[15px_15px_0px_0px_black] w-full max-w-3xl max-h-[90vh] flex flex-col relative animate-in zoom-in-95 overflow-y-auto custom-scrollbar">
        
        <button onClick={onClose} className="absolute top-8 right-8 p-2 bg-white rounded-full border-[3px] border-black hover:rotate-90 hover:bg-slate-100 transition-all shadow-[4px_4px_0px_0px_black] active:translate-y-1 active:shadow-none">
          <X size={20} strokeWidth={4} className="text-black" />
        </button>

        <div className="flex items-center gap-4 mb-8 border-b-[4px] border-black/10 pb-6 pr-12">
          <div className="bg-white p-3 rounded-2xl border-[4px] border-black shadow-[4px_4px_0px_0px_black]">
            <CheckCircle size={40} className="text-emerald-500" strokeWidth={3} />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-black uppercase italic text-black leading-none tracking-tighter">
              Finalizar Servicio
            </h2>
            <p className="text-emerald-900 font-bold mt-1 uppercase tracking-wider text-sm">
              {activeApp.mascota?.nombre || 'Mascota'} - {activeApp.servicio?.nombre || 'Grooming'}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Registro de Insumos */}
          <div className="bg-white border-[4px] border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_black] space-y-4">
            <h4 className="font-black uppercase text-lg flex items-center gap-2 text-black">
              <Package size={24} className="text-indigo-500" /> Insumos Utilizados
            </h4>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-tight">
              Confirma los insumos consumidos. Marca &ldquo;Envase Nuevo&rdquo; si abriste uno nuevo.
            </p>

            {insumosUsados.length > 0 ? (
              <div className="space-y-3">
                {insumosUsados.map((item) => {
                  const outOfStock = item.stock_actual <= 0;
                  return (
                    <div
                      key={item.producto_id}
                      className="bg-slate-50 border-[3px] border-black rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[4px_4px_0px_0px_black]"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-black uppercase text-sm truncate leading-tight">{item.nombre}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                          Stock Almacén: <span className="text-black">{item.stock_actual} ud</span>
                        </p>
                      </div>

                      <div className="flex items-center flex-wrap gap-2 shrink-0">
                        <div className="flex items-center bg-white border-[3px] border-black rounded-xl overflow-hidden h-10 shadow-[2px_2px_0px_0px_black]">
                          <button type="button" onClick={() => setInsumosUsados(prev => prev.map(i => i.producto_id === item.producto_id ? { ...i, cantidad: Math.max(0.05, parseFloat((item.cantidad - 0.1).toFixed(2))) } : i))} className="px-3 h-full font-black hover:bg-slate-200 transition-colors bg-slate-100 border-r-[3px] border-black">-</button>
                          <input type="number" step="0.05" min="0.05" value={item.cantidad} onChange={(e) => setInsumosUsados(prev => prev.map(i => i.producto_id === item.producto_id ? { ...i, cantidad: Math.max(0.05, parseFloat(parseFloat(e.target.value).toFixed(2)) || 0.05) } : i))} className="w-16 h-full text-center font-black text-sm bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                          <button type="button" onClick={() => setInsumosUsados(prev => prev.map(i => i.producto_id === item.producto_id ? { ...i, cantidad: parseFloat((item.cantidad + 0.1).toFixed(2)) } : i))} className="px-3 h-full font-black hover:bg-slate-200 transition-colors bg-slate-100 border-l-[3px] border-black">+</button>
                        </div>

                        <button type="button" disabled={outOfStock && !item.abrio_nuevo} onClick={() => setInsumosUsados(prev => prev.map(i => i.producto_id === item.producto_id ? { ...i, abrio_nuevo: !i.abrio_nuevo } : i))} className={`px-4 py-2 rounded-xl border-[3px] border-black font-black text-[10px] uppercase transition-all shadow-[2px_2px_0px_0px_black] active:translate-y-0.5 active:shadow-none cursor-pointer ${item.abrio_nuevo ? 'bg-amber-400 text-black' : 'bg-white text-slate-500 hover:bg-slate-100'} ${outOfStock && !item.abrio_nuevo ? 'opacity-50 cursor-not-allowed shadow-none active:translate-y-0' : ''}`}>
                          <span>{item.abrio_nuevo ? '🆕 Envase Nuevo' : '🔄 Compartido'}</span>
                        </button>

                        <button type="button" onClick={() => setInsumosUsados(prev => prev.filter(i => i.producto_id !== item.producto_id))} className="p-2 bg-rose-100 text-rose-700 border-[3px] border-black rounded-xl hover:bg-rose-500 hover:text-white active:translate-y-0.5 active:shadow-none shadow-[2px_2px_0px_0px_black] transition-all cursor-pointer" title="Quitar">
                          <X size={16} strokeWidth={4} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-black/20 rounded-2xl p-6 text-center">
                <p className="text-sm font-bold text-slate-400 italic uppercase">No se han registrado insumos para esta sesión.</p>
              </div>
            )}

            {/* Selector de insumos a agregar */}
            <div className="pt-4 border-t-[3px] border-black/10 flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                ➕ Agregar insumo extra
              </label>
              <select
                value=""
                onChange={(e) => {
                  const pId = e.target.value;
                  if (!pId) return;
                  const selected = insumosList.find((i) => i.id === pId);
                  if (selected && !insumosUsados.some((i) => i.producto_id === pId)) {
                    setInsumosUsados((prev) => [...prev, { producto_id: selected.id, nombre: selected.nombre, cantidad: 1.0, stock_actual: selected.stock_actual || 0, abrio_nuevo: false }]);
                  }
                }}
                className="w-full bg-slate-50 border-[3px] border-black rounded-2xl p-3 font-black text-sm outline-none cursor-pointer hover:bg-slate-100 transition-all shadow-[4px_4px_0px_0px_black] focus:translate-y-1 focus:shadow-none"
              >
                <option value="">-- Seleccionar insumo... --</option>
                {insumosList.filter((opt) => !insumosUsados.some((i) => i.producto_id === opt.id)).map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.nombre} (Stock: {opt.stock_actual} ud)</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={handleFinalizar}
            className={`w-full py-5 text-xl bg-black text-white border-[5px] border-black rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-[8px_8px_0px_0px_white] active:translate-y-2 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <span>🏁 Terminar y Cobrar</span>
            <ArrowRight size={28} strokeWidth={4} />
          </button>
        </div>
      </div>
    </div>
  );
}

GroomerFinishModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  activeApp: PropTypes.object,
  currentUser: PropTypes.object,
  onRefresh: PropTypes.func,
  updateOptimistically: PropTypes.func,
};
