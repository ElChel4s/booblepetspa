import React from 'react';
import PropTypes from 'prop-types';
import { Plus, Check, X, Bug, Scissors, Heart, Zap, Sparkles, AlertTriangle, HelpCircle } from 'lucide-react';

const ICON_MAP = {
  Bug,
  Scissors,
  Heart,
  Zap,
  Sparkles,
  AlertTriangle,
};

export default function ExtraChargesSelector({
  availableModifiers,
  appliedModifiers,
  onToggleModifier,
  saving
}) {
  return (
    <div className="space-y-4 border-t-[4px] border-black/10 pt-4">
      <label className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-2">
        <Plus size={14} className="stroke-[3]" /> Cargos Extra / Servicios Adicionales
      </label>
      
      {availableModifiers.length === 0 ? (
        <p className="text-[10px] font-bold text-slate-400 uppercase italic">
          No hay recargos adicionales configurados para este servicio.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {availableModifiers.map((extra) => {
            const applied = appliedModifiers.find((m) => m.modificador_id === extra.id || m.id === extra.id);
            const isApplied = !!applied;
            const status = applied?.estado_aprobacion || 'pendiente';
            const IconComp = ICON_MAP[extra.icon_name] || Zap;
            
            if (isApplied) {
              if (status === 'aprobado') {
                return (
                  <div
                    key={extra.id}
                    className="flex items-center justify-between p-3.5 border-[3.5px] border-black rounded-2xl bg-emerald-100 shadow-[4px_4px_0px_0px_black] transition-all"
                  >
                    <span className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg border-2 border-black bg-white">
                        <IconComp size={16} className="text-emerald-600 stroke-[3]" />
                      </div>
                      <div>
                        <span className="block font-black text-xs uppercase leading-tight text-emerald-950">{extra.criterio}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-800/80">Autorizado (+Bs. {extra.precio_adicional})</span>
                      </div>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-emerald-400 text-black border-2 border-black rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                        <Check size={10} strokeWidth={4} /> Aceptado
                      </span>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => onToggleModifier(extra, true)}
                        className="p-1.5 bg-white border-2 border-black rounded-lg hover:bg-rose-100 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Remover"
                      >
                        <X size={12} strokeWidth={4} />
                      </button>
                    </div>
                  </div>
                );
              }
              
              if (status === 'rechazado') {
                return (
                  <div
                    key={extra.id}
                    className="flex items-center justify-between p-3.5 border-[3.5px] border-black rounded-2xl bg-rose-50 shadow-[4px_4px_0px_0px_black] opacity-90 transition-all"
                  >
                    <span className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg border-2 border-black bg-slate-100">
                        <IconComp size={16} className="text-slate-400 stroke-[2] line-through" />
                      </div>
                      <div>
                        <span className="block font-black text-xs uppercase leading-tight text-slate-500 line-through">{extra.criterio}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-rose-600 font-black">Rechazado por Recepción</span>
                      </div>
                    </span>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => onToggleModifier(extra, true)}
                      className="px-3 py-1.5 bg-rose-200 hover:bg-rose-300 text-rose-700 border-2 border-black rounded-xl text-[9px] font-black uppercase tracking-wider active:translate-y-0.5 transition-all shadow-[2px_2px_0px_0px_black] active:shadow-none cursor-pointer"
                    >
                      Remover / Reintentar
                    </button>
                  </div>
                );
              }
              
              // Pendiente
              return (
                <div
                  key={extra.id}
                  className="flex items-center justify-between p-3.5 border-[3.5px] border-black rounded-2xl bg-amber-50 shadow-[4px_4px_0px_0px_black]"
                >
                  <span className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg border-2 border-black bg-white">
                      <IconComp size={16} className="text-amber-500 stroke-[3] animate-pulse" />
                    </div>
                    <div>
                      <span className="block font-black text-xs uppercase leading-tight text-amber-950">{extra.criterio}</span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-amber-800">Solicitado a Recepción (+Bs. {extra.precio_adicional})</span>
                    </div>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-amber-300 text-amber-950 border-2 border-black rounded-xl text-[9px] font-black uppercase tracking-wider animate-pulse">
                      Pendiente...
                    </span>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => onToggleModifier(extra, true)}
                      className="p-1.5 bg-white border-2 border-black rounded-lg hover:bg-rose-100 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Cancelar solicitud"
                    >
                      <X size={12} strokeWidth={4} />
                    </button>
                  </div>
                </div>
              );
            }
            
            // No solicitado
            return (
              <button
                key={extra.id}
                type="button"
                disabled={saving}
                onClick={() => onToggleModifier(extra, false)}
                className="w-full flex items-center justify-between p-3.5 border-[3.5px] border-black rounded-2xl bg-white text-slate-700 shadow-[4px_4px_0px_0px_black] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_black] active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_black] transition-all cursor-pointer font-black text-xs uppercase text-left"
              >
                <span className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg border-2 border-black bg-slate-50 text-slate-500">
                    <IconComp size={16} className="stroke-[2.5]" />
                  </div>
                  <span className="leading-none text-black">{extra.criterio} (+Bs. {extra.precio_adicional})</span>
                </span>
                <div className="w-7 h-7 rounded-xl border-2 border-black bg-indigo-100 hover:bg-indigo-200 flex items-center justify-center text-black shrink-0 shadow-[2px_2px_0px_0px_black]">
                  <Plus size={16} strokeWidth={4} />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

ExtraChargesSelector.propTypes = {
  availableModifiers: PropTypes.array.isRequired,
  appliedModifiers: PropTypes.array.isRequired,
  onToggleModifier: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};
