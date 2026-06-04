import PropTypes from 'prop-types';
import { User, Zap, ChevronRight } from 'lucide-react';

const WizardStepServices = ({
  cart,
  services,
  setServiceForCartItem,
  calculatePetService,
  setWizardStep,
}) => {
  return (
    <div className="animate-in slide-in-from-right-8 space-y-8">
      <div className="space-y-6">
        {cart.map((item, index) => {
          const currentCalc = calculatePetService(item.pet, item.serviceId);
          return (
            <div
              key={item.pet.id}
              className="bg-white border-[3.5px] border-black rounded-[2rem] shadow-[6px_6px_0px_0px_black] overflow-hidden"
            >
              <div className="bg-slate-100 p-5 border-b-[3.5px] border-black flex items-center gap-4 relative">
                <div className="absolute top-0 right-0 bg-black text-white px-3 py-1 rounded-bl-xl font-black text-[9px] uppercase tracking-widest">
                  Mascota {index + 1}
                </div>
                <img
                  src={
                    item.pet.foto_perfil_url ||
                    `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${item.pet.nombre || 'Pet'}&backgroundColor=fbbf24`
                  }
                  alt={item.pet.nombre}
                  className="w-14 h-14 bg-white border-[3px] border-black rounded-xl shadow-sm object-cover"
                />
                <div>
                  <h4 className="font-black uppercase italic text-xl leading-none text-slate-900 tracking-tighter">
                    {item.pet.nombre}
                  </h4>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                    {item.pet.raza || item.pet.especie}
                  </p>
                </div>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  {services.map((srv) => {
                    const isSelected = item.serviceId === srv.id;
                    return (
                      <button
                        key={srv.id}
                        onClick={() => setServiceForCartItem(item.pet.id, srv.id)}
                        className={`p-4 rounded-xl border-[3.5px] flex items-center justify-between transition-all outline-none group cursor-pointer
                          ${
                            isSelected
                              ? 'border-black bg-[var(--primary)] text-white shadow-[4px_4px_0px_0px_black] -translate-y-0.5'
                              : 'border-black bg-white text-slate-800 shadow-[2px_2px_0px_0px_black] hover:bg-slate-50 hover:shadow-[4px_4px_0px_0px_black]'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-black uppercase text-[11px] leading-tight">{srv.nombre}</span>
                        </div>
                        <span className="font-black italic text-lg tracking-tighter">${srv.precio_base}</span>
                      </button>
                    );
                  })}
                </div>

                {currentCalc && currentCalc.breakdown.length > 0 && (
                  <div className="bg-amber-100 border-[3px] border-black p-4 rounded-xl mt-4 animate-in zoom-in-95">
                    <p className="text-[10px] font-black uppercase text-black flex items-center gap-2 border-b-[3px] border-black/10 pb-2 mb-2 tracking-widest">
                      <Zap size={16} className="text-amber-500 fill-amber-500" /> Ajustes por tamaño/raza
                    </p>
                    <div className="space-y-2 text-[10px] font-black uppercase tracking-wider text-slate-800">
                      {currentCalc.breakdown.map((b, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{b.label}</span>
                          <span className="text-rose-600">
                            +${b.extraP} / +{b.extraT}m
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>



      <div className="flex justify-between pt-4">
        <button
          onClick={() => setWizardStep(2)}
          className="bg-white text-black px-6 py-4 rounded-2xl border-[3.5px] border-black font-black text-xs uppercase shadow-[4px_4px_0px_0px_black] hover:-translate-y-1 transition-all active:translate-y-1 active:shadow-none cursor-pointer"
        >
          Atrás
        </button>
        <button
          disabled={cart.some((i) => !i.serviceId)}
          onClick={() => setWizardStep(4)}
          className="bg-[var(--primary)] text-white px-8 py-4 rounded-2xl border-[3.5px] border-black font-black text-xs uppercase shadow-[6px_6px_0px_0px_black] disabled:opacity-50 disabled:shadow-none hover:-translate-y-1 transition-all active:translate-y-1 active:shadow-none flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          Calendario <ChevronRight size={20} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};

WizardStepServices.propTypes = {
  cart: PropTypes.array.isRequired,
  services: PropTypes.array.isRequired,
  setServiceForCartItem: PropTypes.func.isRequired,
  calculatePetService: PropTypes.func.isRequired,
  setWizardStep: PropTypes.func.isRequired,
};

export default WizardStepServices;
