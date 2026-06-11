import React from 'react';
import PropTypes from 'prop-types';
import { Camera, Heart, CheckCircle, ArrowRight, X } from 'lucide-react';

const QUICK_RECOMMENDATIONS = ['Shampoo Avena', 'Deslanado Mensual', 'Limpieza Dental', 'Piel Sensible'];

export default function GroomerCheckout({
  fotoDespues,
  onTakePhoto,
  onRemovePhoto,
  recommendations,
  onRecommendationsChange,
  onSubmit,
  saving,
  insumosUsados = [],
  setInsumosUsados,
  insumosList = []
}) {
  const agregarRecomendacionRapida = (chip) => {
    const newText = recommendations ? `${recommendations}\n- ${chip}` : `- ${chip}`;
    onRecommendationsChange(newText);
  };

  return (
    <div className="bg-emerald-400 border-[4px] border-black rounded-[2rem] p-6 shadow-[8px_8px_0px_0px_black] animate-in slide-in-from-bottom-8 flex-1 flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-white p-2 rounded-full border-[3px] border-black shadow-sm shrink-0">
            <CheckCircle size={32} className="text-emerald-500" />
          </div>
          <h2 className="text-3xl font-black uppercase italic text-black leading-none">¡Trabajo Terminado!</h2>
        </div>

        {/* Evidencia Final */}
        <div className="bg-white border-[4px] border-black rounded-2xl p-5 shadow-inner mb-6 space-y-4">
          <h4 className="font-black uppercase text-sm flex items-center gap-2 text-black">
            <Camera size={18} /> Evidencia Final
          </h4>
          {fotoDespues ? (
            <div className="relative aspect-video rounded-xl border-[3px] border-black overflow-hidden group w-full md:w-2/3 mx-auto shadow-md">
              <img src={fotoDespues} alt="Después" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onRemovePhoto('despues')}
                className="absolute top-2 right-2 bg-rose-500 text-white p-1.5 rounded-full border-2 border-black opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 shadow-md"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={() => onTakePhoto('despues')}
              className="w-full md:w-2/3 mx-auto aspect-video bg-emerald-50 border-[3px] border-black border-dashed rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-emerald-100 transition-colors cursor-pointer text-emerald-800 disabled:opacity-50"
            >
              <Camera size={32} className="text-emerald-600" />
              <span className="font-black uppercase text-sm">Tomar Foto &ldquo;Después&rdquo;</span>
            </button>
          )}
        </div>

        {/* Registro de Insumos */}
        <div className="bg-white border-[4px] border-black rounded-2xl p-5 shadow-inner mb-6 space-y-4 text-black">
          <h4 className="font-black uppercase text-sm flex items-center gap-2">
            🧴 Insumos Utilizados en el Servicio
          </h4>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-tight">
            Registra los insumos consumidos. Marca &ldquo;Envase Nuevo&rdquo; solo si abriste una botella nueva del inventario central.
          </p>

          {/* Lista de insumos usados */}
          {insumosUsados.length > 0 ? (
            <div className="space-y-3">
              {insumosUsados.map((item) => {
                const outOfStock = item.stock_actual <= 0;
                return (
                  <div
                    key={item.producto_id}
                    className="bg-slate-50 border-[3px] border-black rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-black uppercase text-xs truncate leading-tight">{item.nombre}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        Stock Almacén: {item.stock_actual} ud
                      </p>
                    </div>

                    <div className="flex items-center flex-wrap gap-2 shrink-0">
                      {/* Control de cantidad */}
                      <div className="flex items-center bg-white border-2 border-black rounded-lg overflow-hidden h-8">
                        <button
                          type="button"
                          onClick={() => {
                            const nextQty = Math.max(0.05, parseFloat((item.cantidad - 0.1).toFixed(2)));
                            setInsumosUsados((prev) =>
                              prev.map((i) =>
                                i.producto_id === item.producto_id ? { ...i, cantidad: nextQty } : i
                              )
                            );
                          }}
                          className="px-2 h-full font-black hover:bg-slate-200 transition-colors"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="0.05"
                          min="0.05"
                          value={item.cantidad}
                          onChange={(e) => {
                            const val = Math.max(0.05, parseFloat(parseFloat(e.target.value).toFixed(2)) || 0.05);
                            setInsumosUsados((prev) =>
                              prev.map((i) =>
                                i.producto_id === item.producto_id ? { ...i, cantidad: val } : i
                              )
                            );
                          }}
                          className="w-14 h-full text-center font-bold text-xs bg-transparent outline-none border-x-2 border-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const nextQty = parseFloat((item.cantidad + 0.1).toFixed(2));
                            setInsumosUsados((prev) =>
                              prev.map((i) =>
                                i.producto_id === item.producto_id ? { ...i, cantidad: nextQty } : i
                              )
                            );
                          }}
                          className="px-2 h-full font-black hover:bg-slate-200 transition-colors"
                        >
                          +
                        </button>
                      </div>

                      {/* Botón Abrió Nuevo Envase */}
                      <button
                        type="button"
                        disabled={outOfStock && !item.abrio_nuevo}
                        onClick={() => {
                          setInsumosUsados((prev) =>
                            prev.map((i) =>
                              i.producto_id === item.producto_id ? { ...i, abrio_nuevo: !i.abrio_nuevo } : i
                            )
                          );
                        }}
                        className={`px-2 py-1 rounded-lg border-2 border-black font-black text-[9px] uppercase transition-all shadow-[2px_2px_0px_0px_black] active:translate-y-0.5 active:shadow-none cursor-pointer
                          ${item.abrio_nuevo
                            ? 'bg-amber-400 text-black'
                            : 'bg-white text-slate-500 hover:bg-slate-100'
                          } ${outOfStock && !item.abrio_nuevo ? 'opacity-50 cursor-not-allowed shadow-none active:translate-y-0' : ''}`}
                      >
                        <span>{item.abrio_nuevo ? '🆕 Envase Nuevo' : '🔄 Compartido'}</span>
                      </button>

                      {/* Eliminar de la lista */}
                      <button
                        type="button"
                        onClick={() => {
                          setInsumosUsados((prev) => prev.filter((i) => i.producto_id !== item.producto_id));
                        }}
                        className="p-1 bg-rose-100 text-rose-700 border-2 border-black rounded-lg hover:bg-rose-200 active:translate-y-0.5 active:shadow-none shadow-[2px_2px_0px_0px_black] transition-all cursor-pointer"
                        title="Quitar"
                      >
                        <X size={14} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs font-bold text-slate-400 italic uppercase">No se han registrado insumos para esta sesión.</p>
          )}

          {/* Selector de insumos a agregar */}
          <div className="pt-2 border-t border-black/10 flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-600">
              ➕ Agregar otro insumo al reporte
            </label>
            <select
              value=""
              onChange={(e) => {
                const pId = e.target.value;
                if (!pId) return;
                const exists = insumosUsados.some((i) => i.producto_id === pId);
                if (exists) return;
                const selected = insumosList.find((i) => i.id === pId);
                if (selected) {
                  setInsumosUsados((prev) => [
                    ...prev,
                    {
                      producto_id: selected.id,
                      nombre: selected.nombre,
                      cantidad: 1.0,
                      stock_actual: selected.stock_actual || 0,
                      abrio_nuevo: false
                    }
                  ]);
                }
              }}
              className="w-full bg-slate-50 border-2 border-black rounded-xl p-2.5 font-bold text-xs outline-none cursor-pointer hover:bg-slate-100 transition-colors shadow-[2px_2px_0px_0px_black] focus:translate-y-0.5 focus:shadow-none"
            >
              <option value="">-- Seleccionar insumo para agregar... --</option>
              {insumosList
                .filter((opt) => !insumosUsados.some((i) => i.producto_id === opt.id))
                .map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.nombre} (Stock: {opt.stock_actual} ud)
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Recomendaciones */}
        <div className="space-y-3 mb-6">
          <h4 className="font-black uppercase text-sm flex items-center gap-2 text-black">
            <Heart size={16} /> Recomendaciones para el Cliente
          </h4>
          
          <div className="flex flex-wrap gap-2 mb-2">
            {QUICK_RECOMMENDATIONS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => agregarRecomendacionRapida(chip)}
                className="px-3 py-1.5 bg-black text-white border-2 border-black rounded-lg font-black text-[10px] uppercase shadow-[2px_2px_0px_0px_white] active:translate-y-0.5 active:shadow-none hover:bg-slate-800 transition-all cursor-pointer"
              >
                + {chip}
              </button>
            ))}
          </div>

          <textarea
            value={recommendations}
            onChange={(e) => onRecommendationsChange(e.target.value)}
            placeholder="Escribe recomendaciones personalizadas para la tabla fichas_grooming.recomendaciones_post..."
            className="w-full h-24 bg-white border-[3px] border-black rounded-xl p-3 font-bold text-sm outline-none focus:ring-4 focus:ring-black/20 transition-all resize-none text-black"
          />
        </div>
      </div>

      <button
        type="button"
        disabled={saving || !fotoDespues}
        onClick={onSubmit}
        className={`w-full py-4 text-lg border-[4px] border-black rounded-2xl font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[4px_4px_0px_0px_black] active:translate-y-1 active:shadow-none bg-white text-black disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-1`}
      >
        <span>🏁 Finalizar y Enviar a Caja</span>
        <ArrowRight size={20} strokeWidth={3} />
      </button>
    </div>
  );
}

GroomerCheckout.propTypes = {
  fotoDespues: PropTypes.string,
  onTakePhoto: PropTypes.func.isRequired,
  onRemovePhoto: PropTypes.func.isRequired,
  recommendations: PropTypes.string.isRequired,
  onRecommendationsChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  insumosUsados: PropTypes.array,
  setInsumosUsados: PropTypes.func.isRequired,
  insumosList: PropTypes.array
};
