import React from 'react';
import PropTypes from 'prop-types';
import { Box, X } from 'lucide-react';

export default function InsumosStockModal({
  isOpen,
  onClose,
  insumos,
  onWithdraw,
  loading
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white border-[6px] border-black rounded-[2rem] shadow-[12px_12px_0px_0px_black] w-full max-w-md p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-4 -right-4 bg-rose-500 text-white p-2 rounded-full border-[3px] border-black shadow-[4px_4px_0px_0px_black] hover:bg-rose-600 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
        >
          <X size={20} />
        </button>
        
        <h3 className="text-2xl font-black uppercase mb-4 flex items-center gap-2">
          <Box /> Stock de Estación
        </h3>
        <p className="text-sm font-bold text-slate-500 mb-6">
          Selecciona el producto que vas a abrir. Esto descontará el inventario central (retiros_insumo).
        </p>
        
        {loading ? (
          <div className="text-center py-6 font-black text-slate-400 uppercase text-xs tracking-wider animate-pulse">
            Sincronizando Inventario...
          </div>
        ) : insumos.length === 0 ? (
          <p className="text-center py-6 font-black text-slate-400 uppercase text-xs tracking-wider">
            No hay productos registrados en estación.
          </p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-1">
            {insumos.map((ins) => {
              const isLowStock = ins.stock_actual <= (ins.stock_minimo_alerta || 2);
              
              return (
                <div
                  key={ins.id}
                  className="bg-slate-50 border-[3px] border-black rounded-xl p-3 flex justify-between items-center group hover:bg-blue-50 transition-colors"
                >
                  <div>
                    <p className="font-black uppercase text-sm leading-tight text-slate-800">{ins.nombre}</p>
                    <p className={`text-[10px] font-bold mt-1 ${isLowStock ? 'text-rose-600 font-black' : 'text-slate-500'}`}>
                      Stock actual: {ins.stock_actual} un.{' '}
                      {isLowStock && <span className="underline">(Bajo stock!)</span>}
                    </p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => onWithdraw(ins)}
                    className="bg-blue-400 text-white font-black uppercase text-[10px] px-3 py-2 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_black] active:translate-y-1 active:shadow-none hover:bg-blue-500 transition-all cursor-pointer shrink-0"
                  >
                    Abrir -1
                  </button>
                </div>
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
