import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const PopInput = ({
  label,
  icon: Icon,
  type = "text",
  placeholder,
  value,
  onChange,
  disabled = false,
  multiline = false,
  containerClassName = "mb-6",
}) => {
  const [showPwd, setShowPwd] = useState(false);
  const isPwdField = type === "password";
  const currentType = isPwdField ? (showPwd ? "text" : "password") : type;

  return (
    <div className={`relative w-full group ${containerClassName} ${disabled ? 'opacity-70' : ''}`}>
      {label && (
        <label className="absolute -top-3 left-4 z-30 bg-black text-white px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest shadow-sm">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <div className={`absolute left-4 ${disabled ? 'text-slate-400' : 'text-slate-400 group-focus-within:text-[var(--primary)]'} transition-colors`}>
          {Icon && <Icon size={18} strokeWidth={3} />}
        </div>
        {multiline ? (
          <textarea
            rows={3}
            value={value || ''}
            onChange={onChange}
            disabled={disabled}
            placeholder={placeholder}
            className={`w-full bg-white border-[3.5px] border-black rounded-2xl py-4 pl-12 pr-4 font-bold text-sm outline-none transition-all resize-none ${disabled ? 'bg-slate-100 cursor-not-allowed' : 'focus:shadow-[4px_4px_0px_0px_var(--primary)] shadow-[4px_4px_0px_0px_black]'}`}
          />
        ) : (
          <input
            type={currentType}
            value={value || ''}
            onChange={onChange}
            disabled={disabled}
            placeholder={placeholder}
            className={`w-full bg-white border-[3.5px] border-black rounded-2xl py-4 pl-12 ${isPwdField ? 'pr-12' : 'pr-4'} font-bold text-sm outline-none transition-all ${disabled ? 'bg-slate-100 cursor-not-allowed' : 'focus:shadow-[4px_4px_0px_0px_var(--primary)] shadow-[4px_4px_0px_0px_black]'}`}
          />

        )}
        {isPwdField && !disabled && (
          <button
            type="button"
            onClick={() => setShowPwd(!showPwd)}
            className="absolute right-4 text-slate-400 hover:text-black transition-colors z-40"
          >
            {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};

export default PopInput;
