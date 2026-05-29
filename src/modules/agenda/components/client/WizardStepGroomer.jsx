import PropTypes from 'prop-types';
import { User, ChevronRight } from 'lucide-react';

const WizardStepGroomer = ({
  groomers,
  selectedGroomer,
  setSelectedGroomer,
  setWizardStep,
}) => {
  return (
    <div className="animate-in slide-in-from-right-8 space-y-8">
      <div className="bg-white border-[3.5px] border-black rounded-[2rem] p-6 shadow-[6px_6px_0px_0px_black]">
        <h3 className="text-[13px] font-black uppercase mb-5 flex items-center gap-2 text-slate-900 tracking-widest border-b-[3px] border-black/10 pb-3">
          <User size={20} strokeWidth={3} className="text-[var(--primary)]" /> 2. Elige Especialista
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => setSelectedGroomer('any')}
            className={`p-4 rounded-2xl border-[3.5px] flex flex-col items-center gap-3 transition-all text-center outline-none cursor-pointer
              ${
                selectedGroomer === 'any'
                  ? 'border-black bg-black text-[var(--secondary)] shadow-[4px_4px_0px_0px_var(--secondary)] -translate-y-1'
                  : 'border-black bg-white text-slate-800 shadow-[4px_4px_0px_0px_black] hover:bg-slate-50'
              }`}
          >
            <img
              src="https://api.dicebear.com/7.x/shapes/svg?seed=any&backgroundColor=fbbf24"
              alt="Cualquiera"
              className={`w-14 h-14 rounded-full border-[3px] ${
                selectedGroomer === 'any' ? 'border-[var(--secondary)] bg-white/10' : 'border-black bg-slate-100'
              } object-cover`}
            />
            <div>
              <h4 className="font-black uppercase text-[11px] leading-tight">Cualquiera</h4>
              <p
                className={`text-[8px] font-black uppercase tracking-[0.2em] mt-1 ${
                  selectedGroomer === 'any' ? 'text-white/70' : 'text-slate-500'
                }`}
              >
                El primero disponible
              </p>
            </div>
          </button>

          {groomers.map((groomer) => {
            const isSelected = selectedGroomer === groomer.id;
            return (
              <button
                key={groomer.id}
                onClick={() => setSelectedGroomer(groomer.id)}
                className={`p-4 rounded-2xl border-[3.5px] flex flex-col items-center gap-3 transition-all text-center outline-none cursor-pointer
                  ${
                    isSelected
                      ? 'border-black bg-black text-[var(--secondary)] shadow-[4px_4px_0px_0px_var(--secondary)] -translate-y-1'
                      : 'border-black bg-white text-slate-800 shadow-[4px_4px_0px_0px_black] hover:bg-slate-50'
                  }`}
              >
                <img
                  src={
                    groomer.avatar_url ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${groomer.nombre_completo || 'Carlos'}&backgroundColor=14b8a6`
                  }
                  alt={groomer.nombre_completo}
                  className={`w-14 h-14 rounded-full border-[3px] ${
                    isSelected ? 'border-[var(--secondary)] bg-white/10' : 'border-black bg-slate-100'
                  } object-cover`}
                />
                <div>
                  <h4 className="font-black uppercase text-[11px] leading-tight">
                    {groomer.nombre_completo || groomer.nombre}
                  </h4>
                  <p
                    className={`text-[8px] font-black uppercase tracking-[0.2em] mt-1 ${
                      isSelected ? 'text-white/70' : 'text-slate-500'
                    }`}
                  >
                    Estilista
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={() => setWizardStep(1)}
          className="bg-white text-black px-6 py-4 rounded-2xl border-[3.5px] border-black font-black text-xs uppercase shadow-[4px_4px_0px_0px_black] hover:-translate-y-1 transition-all active:translate-y-1 active:shadow-none cursor-pointer"
        >
          Atrás
        </button>
        <button
          onClick={() => setWizardStep(3)}
          className="bg-[var(--primary)] text-white px-8 py-4 rounded-2xl border-[3.5px] border-black font-black text-xs uppercase shadow-[6px_6px_0px_0px_black] hover:-translate-y-1 transition-all active:translate-y-1 active:shadow-none flex items-center gap-2 cursor-pointer"
        >
          Servicios <ChevronRight size={20} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};

WizardStepGroomer.propTypes = {
  groomers: PropTypes.array.isRequired,
  selectedGroomer: PropTypes.string.isRequired,
  setSelectedGroomer: PropTypes.func.isRequired,
  setWizardStep: PropTypes.func.isRequired,
};

export default WizardStepGroomer;
