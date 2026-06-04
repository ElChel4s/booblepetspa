import PropTypes from 'prop-types';
import { CalendarDays, Clock, ShoppingBag, CheckCircle2, User } from 'lucide-react';

const ClientTicketSummary = ({
  cartTotals,
  grandTotalPrice,
  grandTotalTime,
  selectedDate,
  uiStartTime,
  uiEndTime,
  selectedGroomer,
  groomersList,
  isDesktop = false,
  confirmAction,
  wizardStep,
}) => {
  // Find selected groomer details
  const groomer = groomersList.find((g) => g.id === selectedGroomer) || {
    id: 'any',
    nombre_completo: 'Cualquiera',
    avatar_url: `https://api.dicebear.com/7.x/shapes/svg?seed=any&backgroundColor=fbbf24`,
  };

  return (
    <div
      className={`bg-white border-[4px] border-black p-6 rounded-b-[2.5rem] relative ${
        isDesktop ? 'shadow-[8px_8px_0px_0px_black]' : 'shadow-[6px_6px_0px_0px_black] mt-4'
      }`}
    >
      {/* Decorative rasgado ticket edge */}
      <div className="absolute -top-[12px] left-0 w-full flex justify-around overflow-hidden px-2 pointer-events-none">
        {[...Array(isDesktop ? 12 : 15)].map((_, i) => (
          <div
            key={i}
            className="w-6 h-6 bg-[var(--bg)] rotate-45 border-b-[4px] border-r-[4px] border-black shrink-0"
          />
        ))}
      </div>

      <div className="text-center mt-4 mb-6 border-b-[4px] border-dashed border-black/20 pb-6">
        <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">Tu Reserva</h3>
        <p className="text-[9px] font-black uppercase text-slate-400 mt-1 tracking-widest">Revisa los detalles finales</p>
      </div>

      {cartTotals.length === 0 ? (
        <div className="text-center py-8 opacity-50">
          <ShoppingBag size={48} className="mx-auto mb-4" strokeWidth={1.5} />
          <p className="font-black uppercase text-[10px] tracking-widest">Carrito vacío</p>
        </div>
      ) : (
        <>
          {/* Date & Time block */}
          <div className="bg-[var(--secondary)] border-[3px] border-black rounded-2xl p-4 mb-5 shadow-[4px_4px_0px_0px_black] flex flex-col gap-3">
            <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest border-b-[3px] border-black/10 pb-2">
              <CalendarDays size={16} />{' '}
              {selectedDate
                ? selectedDate.toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Fecha Pendiente'}
            </div>
            <div className="flex items-center justify-between font-black uppercase">
              <span className="flex items-center gap-1.5 text-xs bg-white px-2 py-1 rounded-lg border-2 border-black shadow-sm">
                <Clock size={14} /> {uiStartTime || '--:--'}
              </span>
              <span className="text-lg">→</span>
              <span className="flex items-center gap-1.5 text-xs bg-black text-[var(--secondary)] px-2 py-1 rounded-lg border-2 border-black shadow-sm">
                <Clock size={14} /> {uiEndTime || '--:--'}
              </span>
            </div>
            <p className="text-[9px] font-black text-black/70 text-center tracking-widest">
              TIEMPO ESTIMADO: {grandTotalTime} MIN
            </p>
          </div>

          {/* Groomer Box */}
          <div className="bg-slate-50 border-[3px] border-black rounded-2xl p-3 mb-6 flex items-center gap-3">
            <img
              src={
                groomer.avatar_url ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${groomer.nombre_completo || 'Groomer'}`
              }
              alt="Groomer"
              className="w-10 h-10 rounded-full border-[2.5px] border-black bg-white object-cover"
            />
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Especialista a cargo</p>
              <h4 className="font-black text-xs uppercase leading-none mt-1">
                {groomer.nombre_completo || groomer.nombre || 'Cualquiera'}
              </h4>
            </div>
          </div>

          {/* Cart items */}
          <div className="space-y-4 mb-8">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b-2 border-slate-200 pb-1">
              Servicios Contratados
            </h4>
            {cartTotals.map((item, i) => (
              <div key={i} className="bg-white border-[3px] border-black rounded-xl p-4 shadow-[2px_2px_0px_0px_black]">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3 items-center">
                    <img
                      src={
                        item.pet?.foto_perfil_url ||
                        `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${item.pet?.nombre || 'Pet'}`
                      }
                      alt={item.pet?.nombre}
                      className="w-8 h-8 bg-slate-100 border-[2px] border-black/10 rounded-lg object-cover"
                    />
                    <div>
                      <h4 className="font-black uppercase text-xs leading-none text-slate-900 mb-1">
                        {item.pet?.nombre}
                      </h4>
                      <p className="text-[9px] font-black text-[var(--primary)] uppercase tracking-widest">
                        {item.service?.nombre}
                      </p>
                    </div>
                  </div>
                  <span className="font-black italic text-base">${item.service?.precio_base}</span>
                </div>
                {item.breakdown && item.breakdown.length > 0 && (
                  <div className="mt-3 pt-2 border-t-[2px] border-dashed border-slate-200 space-y-1">
                    {item.breakdown.map((b, j) => (
                      <div
                        key={j}
                        className="flex justify-between text-[8px] font-black uppercase tracking-widest text-rose-500"
                      >
                        <span>+ Modif: {b.label}</span>
                        <span>+${b.extraP}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-between items-center text-[10px] font-black uppercase mt-3 pt-2 border-t-2 border-slate-100">
                  <span className="text-slate-500">Subtotal Mascota</span>
                  <span className="text-emerald-600 text-sm">${item.totalPrice}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-black text-white p-5 rounded-2xl border-[4px] border-black mb-6 shadow-[4px_4px_0px_0px_var(--secondary)]">
            <div className="flex justify-between items-center font-black text-2xl uppercase italic">
              <span>Total</span>
              <span className="text-[var(--primary)]">${grandTotalPrice}</span>
            </div>
          </div>
        </>
      )}

      {isDesktop && wizardStep === 5 && (
        <button
          onClick={confirmAction}
          className="w-full bg-[var(--primary)] text-white border-[4px] border-black py-4 rounded-[1.5rem] font-black text-sm uppercase italic shadow-[6px_6px_0px_0px_black] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_black] transition-all active:translate-y-2 active:shadow-none flex justify-center items-center gap-2 cursor-pointer"
        >
          Confirmar Reserva <CheckCircle2 size={20} strokeWidth={3} />
        </button>
      )}
      {!isDesktop && (
        <button
          onClick={confirmAction}
          disabled={wizardStep !== 5}
          className="w-full bg-[var(--primary)] text-white border-[4px] border-black py-4 rounded-[1.5rem] font-black text-sm uppercase italic shadow-[6px_6px_0px_0px_black] hover:-translate-y-1 transition-all active:translate-y-2 active:shadow-none disabled:opacity-50 flex justify-center items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          Confirmar Reserva <CheckCircle2 size={20} strokeWidth={3} />
        </button>
      )}
    </div>
  );
};

ClientTicketSummary.propTypes = {
  cartTotals: PropTypes.arrayOf(
    PropTypes.shape({
      pet: PropTypes.object,
      service: PropTypes.object,
      totalPrice: PropTypes.number,
      totalTime: PropTypes.number,
      breakdown: PropTypes.array,
    })
  ).isRequired,
  grandTotalPrice: PropTypes.number.isRequired,
  grandTotalTime: PropTypes.number.isRequired,
  selectedDate: PropTypes.instanceOf(Date),
  uiStartTime: PropTypes.string,
  uiEndTime: PropTypes.string,
  selectedGroomer: PropTypes.string,
  groomersList: PropTypes.array.isRequired,
  isDesktop: PropTypes.bool,
  confirmAction: PropTypes.func.isRequired,
  wizardStep: PropTypes.number.isRequired,
};

export default ClientTicketSummary;
