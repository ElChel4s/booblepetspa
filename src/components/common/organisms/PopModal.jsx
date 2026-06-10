import { X } from 'lucide-react';
import PropTypes from 'prop-types';

const PopModal = ({ isOpen, onClose, title, children, maxWidth = "max-w-3xl", icon: Icon }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`bg-white border-[6px] border-black rounded-[2.5rem] md:rounded-[3.5rem] shadow-[12px_12px_0px_0px_black] w-full ${maxWidth} max-h-[90vh] overflow-y-auto p-6 md:p-10 relative animate-in zoom-in-95`}>
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:rotate-90 transition-transform bg-slate-100 rounded-full border-2 border-black">
          <X size={20} strokeWidth={4} />
        </button>
        <div className="flex items-center gap-4 mb-6 pr-12 border-b-8 border-slate-100 pb-4">
          {Icon && <div className="bg-[var(--primary)] p-3 rounded-2xl border-2 border-black"><Icon size={28} /></div>}
          <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter leading-none">{title}</h2>
        </div>
        {children}
      </div>
    </div>
  );
};

PopModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  maxWidth: PropTypes.string,
  icon: PropTypes.elementType
};

export default PopModal;
