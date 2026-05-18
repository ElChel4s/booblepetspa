import React from 'react';

const PopButton = ({ children, onClick, variant = "primary", icon: Icon, full = true, className = "" }) => {
  const variants = {
    primary: "bg-[var(--primary)] text-white shadow-[var(--shadow)]",
    secondary: "bg-[var(--secondary)] text-black shadow-[var(--shadow)]",
    dark: "bg-black text-white shadow-[var(--primary)]",
    danger: "bg-rose-600 text-white shadow-[var(--shadow)] border-rose-900",
    outline: "bg-white text-black border-black shadow-[var(--shadow)]",
  };

  return (
    <button
      onClick={onClick}
      className={`${full ? 'w-full' : ''} ${variants[variant]} border-[3.5px] border-black rounded-2xl py-4 px-6 font-black text-xs uppercase tracking-[0.15em] hover:translate-y-1 hover:shadow-none active:scale-95 transition-all flex items-center justify-center gap-3 ${className}`}
    >
      {children}
      {Icon && <Icon size={18} strokeWidth={3} />}
    </button>
  );
};

export default PopButton;
