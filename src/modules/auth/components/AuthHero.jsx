import React from 'react';
import { Star, Scissors } from 'lucide-react';
import PwaInstallButton from '../../../components/common/PwaInstallButton';

const AuthHero = () => (
  <div className="hidden lg:block relative">
    <div className="bg-[var(--primary)] border-[5px] border-black p-12 rounded-[5rem] shadow-[20px_20px_0px_0px_black] rotate-[-2deg] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/20 -mr-10 -mt-10 rounded-full"></div>
      <h1 className="text-8xl font-black italic uppercase tracking-tighter leading-[0.8] mb-8 text-white drop-shadow-[6px_6px_0px_black]">
        Bubble<br />Pet
      </h1>
      <p className="text-2xl font-black uppercase tracking-widest leading-none mb-10 text-black">
        Gestiona tu Spa con estilo Pop-Art.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border-4 border-black p-4 rounded-3xl rotate-3 shadow-lg">
          <Star className="text-[var(--secondary)] fill-current mb-2" />
          <p className="text-[10px] font-black uppercase">Puntos Lealtad</p>
        </div>
        <div className="bg-[var(--secondary)] border-4 border-black p-4 rounded-3xl -rotate-3 shadow-lg">
          <Scissors className="mb-2" />
          <p className="text-[10px] font-black uppercase">Citas Grooming</p>
        </div>
      </div>
    </div>
  </div>
);

export default AuthHero;
