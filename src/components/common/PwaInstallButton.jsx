import React from 'react';
import { Download } from 'lucide-react';
import { usePwaInstall } from '../../hooks/usePwaInstall';

const PwaInstallButton = ({ className = '', compact = false }) => {
  const { isInstallable, installApp } = usePwaInstall();

  if (!isInstallable) return null;

  return (
    <button
      onClick={installApp}
      title="Instalar App"
      className={`flex items-center gap-2 bg-[var(--primary)] text-white rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_0px_black] hover:translate-y-1 hover:shadow-none transition-all active:scale-95 font-black text-[10px] uppercase tracking-widest ${compact ? 'p-2' : 'px-3 py-2 md:px-4'} ${className}`}
    >
      <Download size={16} strokeWidth={3} />
      {!compact && <span className="hidden sm:inline">Instalar</span>}
    </button>
  );
};

export default PwaInstallButton;
