import PropTypes from 'prop-types';
import { Info, CheckCircle2, ChevronRight } from 'lucide-react';

const WizardStepPets = ({
  pets,
  cart,
  togglePetInCart,
  setWizardStep,
}) => {
  return (
    <div className="animate-in fade-in space-y-6">
      <div className="bg-[var(--secondary)] border-[3.5px] border-black p-4 rounded-2xl flex items-start gap-3 shadow-[4px_4px_0px_0px_black]">
        <Info size={24} className="text-black shrink-0" strokeWidth={2.5} />
        <p className="text-[11px] font-black uppercase text-black leading-relaxed tracking-wider">
          Selecciona uno o más peluditos. Agendaremos sus citas juntas en una sola reserva.
        </p>
      </div>

      {pets.length === 0 ? (
        <div className="bg-white border-[4px] border-black p-8 rounded-[2rem] shadow-[6px_6px_0px_0px_black] text-center">
          <p className="font-black uppercase text-xs text-slate-400">
            No tienes mascotas registradas. Agrega una desde la pestaña de mascotas antes de agendar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {pets.map((pet) => {
            const isSelected = cart.some((i) => i.pet.id === pet.id);
            return (
              <button
                key={pet.id}
                onClick={() => togglePetInCart(pet)}
                className={`p-6 rounded-[2rem] border-[3.5px] border-black flex flex-col items-center gap-4 transition-all relative outline-none overflow-hidden group cursor-pointer
                  ${
                    isSelected
                      ? 'bg-black text-white shadow-[6px_6px_0px_0px_var(--secondary)] -translate-y-1'
                      : 'bg-white text-slate-900 shadow-[4px_4px_0px_0px_black] hover:bg-slate-50 active:translate-y-1 active:shadow-none'
                  }`}
              >
                <img
                  src={
                    pet.foto_perfil_url ||
                    `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${pet.nombre || 'Pet'}&backgroundColor=fbbf24`
                  }
                  alt={pet.nombre}
                  className={`w-20 h-20 rounded-full border-[3px] object-cover group-hover:scale-110 transition-transform ${
                    isSelected ? 'border-white/20 bg-white/10' : 'border-black/10 bg-slate-100'
                  }`}
                />
                <span className="font-black uppercase text-sm tracking-widest">{pet.nombre}</span>
                {isSelected && (
                  <CheckCircle2
                    className="absolute top-4 right-4 text-[var(--secondary)] bg-black rounded-full"
                    size={24}
                    strokeWidth={3}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex justify-end pt-6">
        <button
          disabled={cart.length === 0}
          onClick={() => setWizardStep(2)}
          className="bg-[var(--primary)] text-white px-8 py-4 rounded-2xl border-[3.5px] border-black font-black text-xs uppercase shadow-[6px_6px_0px_0px_black] disabled:opacity-50 disabled:shadow-none hover:-translate-y-1 transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_black] flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          Servicios <ChevronRight size={20} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};

WizardStepPets.propTypes = {
  pets: PropTypes.array.isRequired,
  cart: PropTypes.array.isRequired,
  togglePetInCart: PropTypes.func.isRequired,
  setWizardStep: PropTypes.func.isRequired,
};

export default WizardStepPets;
