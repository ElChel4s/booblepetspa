import React from 'react';
import PropTypes from 'prop-types';
import { Plus, Check, Bug, Scissors, Heart, Zap, Sparkles, AlertTriangle, HelpCircle } from 'lucide-react';

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
    <div className="space-y-2 border-t-4 border-black/10 pt-4">
      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
        <Plus size={12} /> Sugerir Recargos a Recepción
      </label>
      
      {availableModifiers.length === 0 ? (
        <p className="text-[10px] font-bold text-slate-400 uppercase italic">
          No hay recargos adicionales configurados para este servicio.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {availableModifiers.map((extra) => {
            const isSelected = appliedModifiers.some((applied) => applied.modificador_id === extra.id || applied.id === extra.id);
            const IconComp = ICON_MAP[extra.icon_name] || Zap;
            
            return (
              <button
                key={extra.id}
                type="button"
                disabled={saving}
                onClick={() => onToggleModifier(extra, isSelected)}
                className={`w-full flex items-center justify-between p-3 border-[3px] border-black rounded-xl font-black text-xs uppercase transition-all active:translate-y-0.5 disabled:opacity-50 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-300 shadow-[3px_3px_0px_0px_black] text-black'
                    : 'bg-slate-50 shadow-sm hover:bg-slate-100 text-slate-500 hover:text-black'
                }`}
              >
                <span className="flex items-center gap-2">
                  <IconComp size={16} className={isSelected ? 'text-black' : 'text-slate-500'} />
                  <span className="leading-none">{extra.criterio} (+Bs. {extra.precio_adicional})</span>
                </span>
                {isSelected && <Check size={16} className="text-black" />}
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
