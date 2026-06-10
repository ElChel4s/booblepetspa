import PropTypes from 'prop-types';

const BrutalInput = ({ label, type = "text", placeholder, value, onChange, icon: Icon, min, max, step, disabled = false }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</label>
    <div className="relative">
      {Icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Icon size={18}/></div>}
      <input 
        type={type} 
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={`w-full bg-slate-50 border-[3px] border-black rounded-2xl px-4 py-3 ${Icon ? 'pl-12' : ''} font-bold text-sm focus:outline-none focus:ring-4 focus:ring-[var(--primary)] focus:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
      />
    </div>
  </div>
);

BrutalInput.propTypes = {
  label: PropTypes.string.isRequired,
  type: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  icon: PropTypes.elementType,
  min: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  max: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  step: PropTypes.string,
  disabled: PropTypes.bool
};

export default BrutalInput;
