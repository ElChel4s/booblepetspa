import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * PopSelect — Componente atómico de dropdown con estilo Neo-Brutalismo.
 * Se inclina cuando tiene un filtro activo para feedback visual.
 */
const PopSelect = ({ label, value, options, onChange, activeColor, icon: Icon, rotation }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const isDirty = value !== 'Todos' && value !== 'Ambos' && value !== 'default';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative flex-1 lg:flex-none lg:min-w-[170px] transition-all duration-300 ${isOpen ? 'z-[60]' : 'z-20'} ${isDirty ? `${rotation} scale-105` : ''} hover:z-50 w-full`}
    >
      {/* Etiqueta flotante superior */}
      <div className="absolute -top-3 left-4 z-30 bg-black text-white px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest shadow-sm">
        {label}
      </div>

      {/* Botón trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between border-[3.5px] border-black px-4 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all shadow-[4px_4px_0px_0px_black] ${isDirty ? activeColor : 'bg-slate-50 text-slate-800 hover:bg-white'}`}
      >
        <span className="flex items-center gap-2 truncate pr-2">
          {Icon && <Icon size={12} className="shrink-0" />}
          <span className="truncate">{options.find((opt) => opt.value === value)?.label || value}</span>
        </span>
        <ChevronDown className={`transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} size={14} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white border-[3.5px] border-black rounded-2xl shadow-[8px_8px_0px_0px_black] overflow-hidden z-[70]">
          <div className="max-h-60 overflow-y-auto">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className={`w-full text-left px-4 py-3 font-black text-[10px] uppercase border-b-2 border-black/5 hover:bg-[var(--bg)] last:border-b-0 transition-colors ${value === opt.value ? 'bg-black/5 text-[var(--primary)]' : 'text-slate-800'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PopSelect;
