import { ChevronRight } from 'lucide-react';

/**
 * PetCard — Tarjeta de mascota en el expediente del usuario.
 * Clic navega al detalle completo.
 */
const PetCard = ({ pet, index, onSelect }) => {
  const rotations = ['rotate-1', '-rotate-1'];

  return (
    <div
      onClick={() => onSelect(pet)}
      className={`bg-[var(--card)] border-[4px] border-black p-7 rounded-[3rem] shadow-[8px_8px_0px_0px_black] group cursor-pointer hover:-translate-y-1 transition-all duration-300 ${rotations[index % 2]}`}
    >
      <div className="flex items-center gap-5 mb-6">
        {/* Emoji */}
        <div className="w-20 h-20 bg-blue-50 border-[3.5px] border-black rounded-[2rem] flex items-center justify-center text-5xl shadow-[4px_4px_0px_0px_black] group-hover:scale-110 transition-transform shrink-0">
          {pet.foto}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-2xl font-black uppercase italic leading-none truncate">{pet.nombre}</h4>
          <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest truncate">
            {pet.raza}
          </p>
        </div>

        <ChevronRight className="text-slate-200 group-hover:text-[var(--primary)] shrink-0 transition-colors" size={20} />
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        <span className="bg-slate-50 border-2 border-black/10 px-3 py-1 rounded-lg text-[9px] font-black uppercase">
          {pet.tamano}
        </span>
        <span className="bg-rose-50 border-2 border-rose-200 text-rose-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase">
          {pet.alergias.length > 0 ? `${pet.alergias.length} Alergias` : 'Sin Alergias'}
        </span>
        {pet.especie && (
          <span className="bg-blue-50 border-2 border-blue-200 text-blue-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase">
            {pet.especie}
          </span>
        )}
      </div>
    </div>
  );
};

export default PetCard;
