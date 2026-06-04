import React from 'react';
import PropTypes from 'prop-types';
import { Camera, Bug, Scissors, ShieldAlert, Thermometer, PenTool, X } from 'lucide-react';

const ToggleChip = ({ active, onClick, icon: Icon, label, activeColor = 'bg-rose-500' }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-1 py-3 px-2 border-[3px] border-black rounded-xl font-black text-xs uppercase flex flex-col items-center gap-2 transition-all shadow-[3px_3px_0px_0px_black] active:translate-y-1 active:shadow-none ${
      active
        ? `${activeColor} text-white scale-105 rotate-1 shadow-none`
        : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
    }`}
  >
    <Icon size={20} strokeWidth={3} />
    <span className="text-center leading-none">{label}</span>
  </button>
);

ToggleChip.propTypes = {
  active: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  activeColor: PropTypes.string,
};

export default function DiagnosticsTriage({
  fichaForm,
  onChange,
  onTakePhoto,
  onRemovePhoto
}) {
  const handleToggle = (field) => {
    onChange({ ...fichaForm, [field]: !fichaForm[field] });
  };

  const handleTextChange = (field, val) => {
    onChange({ ...fichaForm, [field]: val });
  };

  return (
    <div className="space-y-6">
      {/* Fotografía Antes */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
          Foto Evidencia (Antes)
        </label>
        {fichaForm.foto_antes ? (
          <div className="relative aspect-video rounded-2xl border-[4px] border-black overflow-hidden shadow-[4px_4px_0px_0px_black] group">
            <img src={fichaForm.foto_antes} alt="Antes" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onRemovePhoto('antes')}
              className="absolute top-2 right-2 bg-rose-500 text-white p-2 rounded-full border-2 border-black opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 shadow-md"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onTakePhoto('antes')}
            className="w-full aspect-video bg-slate-100 border-[4px] border-black border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-slate-200 transition-colors shadow-inner text-slate-500 hover:text-black cursor-pointer"
          >
            <Camera size={40} />
            <span className="font-black uppercase text-sm">Tomar Foto &ldquo;Antes&rdquo;</span>
          </button>
        )}
      </div>

      {/* Alertas Médicas Rápidas */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
          Anomalías Visuales
        </label>
        <div className="flex gap-3">
          <ToggleChip
            active={!!fichaForm.nudos}
            onClick={() => handleToggle('nudos')}
            icon={Scissors}
            label="Nudos"
            activeColor="bg-amber-500"
          />
          <ToggleChip
            active={!!fichaForm.pulgas}
            onClick={() => handleToggle('pulgas')}
            icon={Bug}
            label="Pulgas"
            activeColor="bg-rose-500"
          />
          <ToggleChip
            active={!!fichaForm.heridas}
            onClick={() => handleToggle('heridas')}
            icon={ShieldAlert}
            label="Heridas"
            activeColor="bg-purple-500"
          />
        </div>
      </div>

      {/* Signos Vitales y Observaciones */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1 block">
            Peso (Kg)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              value={fichaForm.peso || ''}
              onChange={(e) => handleTextChange('peso', e.target.value)}
              className="w-full bg-slate-50 border-[3px] border-black rounded-xl py-3 pl-10 pr-3 font-black text-lg outline-none focus:bg-yellow-50 focus:shadow-[4px_4px_0px_0px_var(--primary)] transition-all"
              style={{ '--primary': '#fbbf24' }}
              placeholder="0.0"
            />
            <Thermometer className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          </div>
        </div>
        
        <div>
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1 block">
            Temperamento Actual
          </label>
          <select
            value={fichaForm.temperamento || ''}
            onChange={(e) => handleTextChange('temperamento', e.target.value)}
            className="w-full bg-slate-50 border-[3px] border-black rounded-xl py-3.5 px-3 font-black text-sm uppercase outline-none focus:bg-yellow-50 focus:shadow-[4px_4px_0px_0px_var(--primary)] transition-all"
            style={{ '--primary': '#fbbf24' }}
          >
            <option value="">Seleccionar...</option>
            <option value="Docil">Dócil / Tranquilo</option>
            <option value="Nervioso">Nervioso</option>
            <option value="Agresivo">Agresivo</option>
          </select>
        </div>
      </div>

      {/* Observaciones durante el servicio */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
          <PenTool size={12} /> Bitácora: Anota lo que sucede en cabina
        </label>
        <textarea
          value={fichaForm.observaciones_groomer || ''}
          onChange={(e) => handleTextChange('observaciones_groomer', e.target.value)}
          placeholder="Ej: Se puso muy ansioso con el secador, tuvimos que pausar 5 mins..."
          className="w-full h-24 bg-slate-50 border-[3px] border-black rounded-xl p-3 font-bold text-sm outline-none focus:bg-yellow-50 focus:shadow-[4px_4px_0px_0px_var(--primary)] transition-all resize-none"
          style={{ '--primary': '#fbbf24' }}
        />
      </div>
    </div>
  );
}

DiagnosticsTriage.propTypes = {
  fichaForm: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onTakePhoto: PropTypes.func.isRequired,
  onRemovePhoto: PropTypes.func.isRequired,
};
