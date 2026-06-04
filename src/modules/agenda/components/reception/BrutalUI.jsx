import PropTypes from 'prop-types';
import { X } from 'lucide-react';

export const PopModal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-4xl' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`bg-white border-[6px] border-black rounded-[3.5rem] shadow-[15px_15px_0px_0px_black] w-full ${maxWidth} max-h-[90vh] overflow-y-auto p-10 relative animate-in zoom-in-95`}>
        <button onClick={onClose} className="absolute top-8 right-8 p-2 hover:rotate-90 transition-transform bg-slate-100 rounded-full border-2 border-black">
          <X size={20} strokeWidth={4} />
        </button>
        <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-8 pr-12 border-b-8 border-slate-100 pb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
};

PopModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.string,
  children: PropTypes.node,
  maxWidth: PropTypes.string,
};

export const BrutalInput = ({ label, type = 'text', placeholder, value, onChange, icon: Icon }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</label>
    <div className="relative">
      {Icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Icon size={18} /></div>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full bg-slate-50 border-[3px] border-black rounded-2xl px-4 py-3 ${Icon ? 'pl-12' : ''} font-bold text-sm focus:outline-none focus:ring-4 focus:ring-[var(--primary)] focus:bg-white transition-all`}
      />
    </div>
  </div>
);

BrutalInput.propTypes = {
  label: PropTypes.string.isRequired,
  type: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  icon: PropTypes.elementType,
};

export const StatusBadge = ({ status }) => {
  const styles = {
    programada: 'bg-blue-100 text-blue-600 border-blue-600',
    en_espera: 'bg-amber-100 text-amber-600 border-amber-600',
    en_proceso: 'bg-purple-100 text-purple-600 border-purple-600',
    completada: 'bg-emerald-100 text-emerald-600 border-emerald-600',
    cancelada: 'bg-rose-100 text-rose-600 border-rose-600',
    no_show: 'bg-rose-600 text-white border-black shadow-[2px_2px_0px_0px_black]',
  };

  return (
    <span className={`px-3 py-1 rounded-lg border-[2px] font-black text-[9px] uppercase italic ${styles[status] || styles.programada}`}>
      {status?.replace('_', ' ') || 'programada'}
    </span>
  );
};

StatusBadge.propTypes = {
  status: PropTypes.string,
};
