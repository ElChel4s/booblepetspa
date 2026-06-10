import React from 'react';
import PropTypes from 'prop-types';
import { Package, X } from 'lucide-react';

export default function InsumosStockModal({
  isOpen,
  onClose,
  insumos,
  onWithdraw,
  loading
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white border-[6px] border-black rounded-[2.5rem] shadow-[12px_12px_0px_0px_black] w-full max-w-2xl p-8 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-4 -right-4 bg-rose-500 text-white w-12 h-12 flex items-center justify-center rounded-full border-[4px] border-black shadow-[4px_4px_0px_0px_black] hover:bg-rose-600 active:translate-y-1 active:shadow-none transition-all cursor-pointer z-10"
        >
          <X size={24} strokeWidth={3} />
        </button>
        
        <h3 className="text-3xl font-black uppercase italic mb-2 flex items-center gap-3">
          <Package size={32} className="text-[var(--primary)]" /> Stock de Estación
        </h3>
        <p className="text-sm font-bold text-slate-500 mb-8 uppercase tracking-widest">
          Toque rápido para abrir un insumo nuevo
        </p>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Package size={48} className="animate-bounce text-slate-300 mb-4" />
            <p className="font-black text-slate-400 uppercase tracking-widest text-sm">Cargando almacén...</p>
          </div>
        ) : insumos.length === 0 ? (
          <div className="text-center py-12 font-black text-slate-400 uppercase">
            No hay productos disponibles
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar pb-4">
            {insumos.map((ins) => {
              const outOfStock = ins.stock_actual <= 0;
              
              return (
                <button
                  key={ins.id}
                  disabled={outOfStock}
                  onClick={() => {
                    onWithdraw(ins);
                    onClose();
                  }}
                  className={`relative overflow-hidden w-full flex flex-col items-start p-5 rounded-3xl border-[4px] border-black text-left transition-all
                    ${outOfStock 
                      ? 'bg-slate-100 opacity-60 cursor-not-allowed border-dashed' 
                      : 'bg-[var(--bg)] hover:bg-[var(--primary)] hover:text-white shadow-[6px_6px_0px_0px_black] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_black] active:translate-y-1 active:shadow-none cursor-pointer group'
                    }`}
                >
                  {outOfStock && (
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.1)_10px,rgba(0,0,0,0.1)_20px)] pointer-events-none" />
                  )}
                  
                  <div className="flex items-center gap-3 mb-2 relative z-10 w-full">
                    <div className={`p-2 rounded-xl border-2 border-black flex-shrink-0 ${outOfStock ? 'bg-slate-200' : 'bg-white text-black'}`}>
                      <Package size={24} strokeWidth={2.5} />
                    </div>
                    <span className="font-black text-lg uppercase leading-tight truncate w-full" title={ins.nombre}>
                      {ins.nombre}
                    </span>
                  </div>
                  
                  <div className={`relative z-10 font-bold uppercase text-[10px] tracking-widest inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border-2 border-black ${outOfStock ? 'bg-rose-100 text-rose-800' : 'bg-white text-black'}`}>
                    Stock: {ins.stock_actual} ud
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

InsumosStockModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  insumos: PropTypes.array.isRequired,
  onWithdraw: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};
