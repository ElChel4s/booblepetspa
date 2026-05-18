import React from 'react';
import { ArrowLeft, Heart, CheckCircle2 } from 'lucide-react';

const RegisterSidebar = ({ onBack }) => (
  <div className="lg:col-span-4 space-y-6">
    <button onClick={onBack} className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-slate-400 hover:text-black mb-10">
      <ArrowLeft size={20} strokeWidth={4} /> Volver
    </button>
    <div className="bg-black text-white p-8 rounded-[3rem] shadow-[10px_10px_0px_0px_var(--primary)] rotate-[-1deg]">
      <Heart size={40} className="text-rose-500 fill-current mb-6" />
      <h3 className="text-3xl font-black uppercase italic mb-4 leading-none">Únete a la<br />Manada</h3>
      <ul className="space-y-4">
        {['Puntos por cada visita', 'Historial médico digital', 'Citas express online'].map((b) => (
          <li key={b} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
            <CheckCircle2 size={16} className="text-[var(--primary)]" /> {b}
          </li>
        ))}
      </ul>
    </div>
  </div>
);

export default RegisterSidebar;
