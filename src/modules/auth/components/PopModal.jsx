import React from 'react';
import { Zap } from 'lucide-react';

const PopModal = ({ isOpen, onClose, title, children, isDanger = false, showCloseButton = true }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`bg-white border-[6px] border-black rounded-[3.5rem] shadow-[15px_15px_0px_0px_black] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 md:p-12 relative animate-in zoom-in-95 ${isDanger ? 'border-rose-600' : ''}`}>
        {showCloseButton && (
          <button onClick={onClose} className="absolute top-8 right-8 p-3 hover:rotate-90 transition-transform bg-slate-100 rounded-full border-2 border-black">
            <Zap size={20} strokeWidth={4} className={isDanger ? 'text-rose-600' : ''} />
          </button>
        )}
        <h2 className={`text-3xl font-black italic uppercase tracking-tighter mb-10 border-b-8 pb-4 ${isDanger ? 'border-rose-100 text-rose-600' : 'border-slate-100'}`}>
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
};

export default PopModal;
