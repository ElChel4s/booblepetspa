import React from 'react';
import { Download } from 'lucide-react';
import { usePwaInstall } from '../../hooks/usePwaInstall';

const PwaInstallButton = ({ className = '' }) => {
  const { isInstallable, installApp } = usePwaInstall();

  if (!isInstallable) return null;

  return (
    <button
      onClick={installApp}
      className={`flex items-center gap-2 bg-black text-white px-4 py-2 rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_0px_var(--primary)] hover:translate-y-1 hover:shadow-none transition-all active:scale-95 font-black text-[10px] uppercase tracking-widest ${className}`}
    >
      <Download size={16} strokeWidth={3} />
      Instalar App
    </button>
  );
};

export default PwaInstallButton;
