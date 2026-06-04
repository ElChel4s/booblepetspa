import PropTypes from 'prop-types';
import { CreditCard } from 'lucide-react';

const PET_EMOJI = { Perro: '🐶', Gato: '🐱', Conejo: '🐰', Ave: '🦜', Otro: '🐾' };

const ReadyCard = ({ cita, onOpenCheckout }) => {
  const petName = cita.mascota?.nombre || 'Mascota';
  const petEmoji = PET_EMOJI[cita.mascota?.especie] || '🐾';
  const groomerName = cita.groomer?.nombre_completo || 'Groomer';
  const ownerName = cita.mascota?.dueno?.nombre_completo || 'Cliente';
  const ownerTel = cita.mascota?.dueno?.telefono || 'Sin teléfono';

  return (
    <div className="bg-white border-[3px] border-black rounded-2xl p-4 shadow-[4px_4px_0px_0px_black] flex flex-col gap-3 relative overflow-hidden animate-in zoom-in-95 duration-500">
      <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-400 rounded-bl-[100%] z-0" />
      
      <div className="relative z-10">
        <h3 className="font-black text-2xl uppercase leading-none mb-1 flex items-center gap-1.5">
          <span className="text-3xl shrink-0 leading-none">{petEmoji}</span>
          {petName} <span className="text-emerald-600 text-lg">✓</span>
        </h3>
        <p className="text-[10px] font-black uppercase text-slate-500">
          Groomer: {groomerName}
        </p>
      </div>
      
      <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-2 relative z-10 flex flex-col">
        <p className="text-[9px] font-black uppercase text-emerald-800 tracking-wider">Llamar Dueño:</p>
        <p className="font-bold text-sm">{ownerName} ({ownerTel})</p>
      </div>

      <button
        onClick={() => onOpenCheckout(cita)}
        className="w-full bg-black hover:bg-slate-800 text-white border-[3px] border-black rounded-xl py-2.5 font-black uppercase text-sm shadow-[4px_4px_0px_0px_var(--primary)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 mt-2 z-10"
        style={{ '--primary': '#34d399' }}
      >
        <CreditCard size={18} /> Procesar Checkout
      </button>
    </div>
  );
};

ReadyCard.propTypes = {
  cita: PropTypes.shape({
    id: PropTypes.string.isRequired,
    groomer: PropTypes.shape({
      nombre_completo: PropTypes.string,
    }),
    mascota: PropTypes.shape({
      nombre: PropTypes.string,
      especie: PropTypes.string,
      dueno: PropTypes.shape({
        nombre_completo: PropTypes.string,
        telefono: PropTypes.string,
      }),
    }),
  }).isRequired,
  onOpenCheckout: PropTypes.func.isRequired,
};

export default ReadyCard;
