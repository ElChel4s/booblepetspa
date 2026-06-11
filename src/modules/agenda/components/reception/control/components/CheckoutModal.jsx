import PropTypes from 'prop-types';
import { X, DollarSign, FileText, Wallet, Smartphone, CreditCard, Heart, ListChecks, CheckCircle } from 'lucide-react';
import Badge from './Badge';

const CheckoutModal = ({
  checkoutData,
  billingForm,
  onChangeBillingForm,
  onClose,
  onFinalizePayment,
  saving
}) => {
  if (!checkoutData) return null;

  const { cita, modificadores_aplicados, total_calculado, recomendaciones_post } = checkoutData;
  const petName = cita.mascota?.nombre || 'Mascota';
  const basePrice = Number(cita.servicio?.precio_base || 0);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in zoom-in-95 duration-300 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-[3rem] border-[6px] border-black shadow-[16px_16px_0px_0px_black] flex flex-col md:flex-row relative mt-10 md:mt-0 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 bg-rose-500 text-white p-2 border-[3px] border-black rounded-full shadow-[4px_4px_0px_0px_black] hover:scale-110 transition-transform"
        >
          <X size={24} strokeWidth={4} />
        </button>

        {/* MITAD IZQUIERDA: RESUMEN Y FORMULARIO DE FACTURACIÓN */}
        <div className="w-full md:w-1/2 p-6 md:p-8 border-b-[6px] md:border-b-0 md:border-r-[6px] border-black bg-emerald-50">
          <h2 className="text-2xl md:text-3xl font-black uppercase italic mb-6 flex items-center gap-2">
            <DollarSign size={32} /> Punto de Venta
          </h2>
          
          {/* Resumen */}
          <div className="space-y-3 mb-6 bg-white border-[3px] border-black p-4 rounded-2xl shadow-[4px_4px_0px_0px_black]">
            <div className="flex justify-between items-end border-b-4 border-black/10 pb-2">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Servicio Base ({petName})</p>
                <p className="font-black text-lg uppercase">{cita.servicio?.nombre || 'Grooming'}</p>
              </div>
              <p className="font-black text-xl">${basePrice.toFixed(2)}</p>
            </div>

            {/* Lista de Extras */}
            {modificadores_aplicados.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-[10px] font-black uppercase text-rose-500 tracking-wider">Cargos Extra Autorizados</p>
                {modificadores_aplicados.map((mod) => (
                  <div key={mod.id} className="flex justify-between items-center text-sm">
                    <span className="font-bold flex items-center gap-1">
                      <span className="text-rose-500">⚡</span> {mod.concepto}
                    </span>
                    <span className="font-black text-rose-600">+${mod.precio.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
            
            <div className="pt-2 border-t-4 border-black border-dashed flex justify-between items-center">
              <p className="font-black uppercase text-slate-600">Total</p>
              <p className="text-3xl font-black text-emerald-600">${total_calculado.toFixed(2)}</p>
            </div>
          </div>

          {/* Formulario */}
          <div className="bg-slate-100 border-[3px] border-black p-4 rounded-2xl shadow-[4px_4px_0px_0px_black] mb-6">
            <h4 className="font-black text-[10px] uppercase text-slate-500 tracking-wider mb-3 flex items-center gap-1.5">
              <FileText size={14} /> Datos de Facturación
            </h4>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1">NIT / CI</label>
                <input
                  type="text"
                  value={billingForm.nit_ci}
                  onChange={(e) => onChangeBillingForm({ ...billingForm, nit_ci: e.target.value })}
                  className="w-full bg-white border-2 border-black rounded-lg px-3 py-2 text-sm font-bold outline-none focus:shadow-[2px_2px_0px_0px_var(--primary)]"
                  style={{ '--primary': '#34d399' }}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1">Razón Social</label>
                <input
                  type="text"
                  value={billingForm.razon_social}
                  onChange={(e) => onChangeBillingForm({ ...billingForm, razon_social: e.target.value })}
                  className="w-full bg-white border-2 border-black rounded-lg px-3 py-2 text-sm font-bold outline-none focus:shadow-[2px_2px_0px_0px_var(--primary)]"
                  style={{ '--primary': '#34d399' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase mb-2">Método de Pago</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Efectivo', icon: Wallet },
                  { id: 'QR', icon: Smartphone },
                  { id: 'Tarjeta', icon: CreditCard }
                ].map((metodo) => {
                  const Icon = metodo.icon;
                  const isSelected = billingForm.metodo_pago === metodo.id;
                  return (
                    <button
                      key={metodo.id}
                      onClick={() => onChangeBillingForm({ ...billingForm, metodo_pago: metodo.id })}
                      className={`py-2 px-1 border-2 border-black rounded-lg text-[10px] font-black uppercase flex flex-col items-center gap-1 transition-all ${
                        isSelected
                          ? 'bg-black text-white shadow-[2px_2px_0px_0px_var(--primary)] scale-105'
                          : 'bg-white text-slate-500'
                      }`}
                      style={{ '--primary': '#34d399' }}
                    >
                      <Icon size={16} />
                      {metodo.id}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            onClick={onFinalizePayment}
            disabled={saving}
            className="w-full bg-emerald-400 hover:bg-emerald-500 text-black border-[4px] border-black rounded-2xl py-4 font-black text-lg uppercase shadow-[6px_6px_0px_0px_black] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {saving ? 'Procesando...' : <><CheckCircle size={24} /> Registrar Pago</>}
          </button>
        </div>

        {/* MITAD DERECHA: RECOMENDACIONES POST-ESTÉTICA */}
        <div className="w-full md:w-1/2 p-6 md:p-10 bg-white flex flex-col justify-center gap-6 overflow-y-auto max-h-[85vh] custom-scrollbar">
          {/* Recomendaciones Post-Estética */}
          <div className="bg-purple-100 border-[4px] border-black rounded-[2rem] p-6 shadow-[6px_6px_0px_0px_black] relative mt-4">
            <div className="absolute -top-5 -left-5 bg-white border-[4px] border-black rounded-full p-2 shadow-[4px_4px_0px_0px_black] rotate-[-10deg]">
              <Heart size={32} className="text-rose-500 fill-current" />
            </div>
            <h3 className="font-black text-xl uppercase mb-2 pl-4">Recomendaciones Post-Estética</h3>
            <p className="text-[10px] font-black uppercase text-purple-600 tracking-wider mb-4 pl-4 border-b-2 border-black/10 pb-2">Extraído de fichas_grooming</p>
            
            <div className="bg-white border-[3px] border-black rounded-xl p-5 font-bold text-slate-800 text-base leading-snug shadow-inner">
              {recomendaciones_post ? (
                <span className="italic">"{recomendaciones_post}"</span>
              ) : (
                <span className="text-slate-400 italic">El groomer no dejó recomendaciones post-servicio para esta visita.</span>
              )}
            </div>
          </div>

          {/* Insumos Utilizados */}
          <div className="bg-slate-50 border-[4px] border-black rounded-[2rem] p-6 shadow-[6px_6px_0px_0px_black] relative">
            <h3 className="font-black text-xl uppercase mb-2">Reflejando Insumos</h3>
            <p className="text-[10px] font-black uppercase text-emerald-600 tracking-wider mb-4 border-b-2 border-black/10 pb-2">
              Ingresados manualmente por el groomer
            </p>
            
            {checkoutData.loadingInsumos ? (
              <div className="text-center py-4 font-bold text-slate-400 uppercase tracking-widest text-xs">
                Cargando insumos...
              </div>
            ) : checkoutData.insumosUsados && checkoutData.insumosUsados.length > 0 ? (
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                {checkoutData.insumosUsados.map((ins, i) => (
                  <div key={i} className="text-xs font-black uppercase bg-white border-2 border-black p-3 rounded-xl flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <span className="truncate pr-2 text-slate-800">{ins.nombre}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 bg-slate-100 border border-black rounded font-black text-black">
                        {ins.cantidad} ud
                      </span>
                      {ins.abrio_nuevo ? (
                        <span className="px-1.5 py-0.5 bg-amber-400 text-black text-[9px] font-black border border-black rounded">
                          ENV. NUEVO
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-slate-100 text-[9px] font-black text-slate-400 border border-black rounded">
                          COMPARTIDO
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-bold text-slate-400 italic">No se registraron insumos en este servicio.</p>
            )}
          </div>

          <div className="bg-slate-50 border-[3px] border-black border-dashed rounded-2xl p-5">
            <h4 className="font-black uppercase text-sm mb-3 flex items-center gap-2">
              <ListChecks size={18} /> Protocolo de Entrega
            </h4>
            <ul className="text-sm font-bold text-slate-700 space-y-3">
              <li className="flex items-center gap-2">
                <div className="bg-black text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">1</div>
                Entregar Mascota y leer recomendaciones
              </li>
              <li className="flex items-center gap-2">
                <div className="bg-black text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">2</div>
                Consultar por agendamiento próximo mes
              </li>
              <li className="flex items-center gap-2">
                <div className="bg-black text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">3</div>
                Entregar Ticket / Factura
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

CheckoutModal.propTypes = {
  checkoutData: PropTypes.shape({
    cita: PropTypes.object.isRequired,
    modificadores_aplicados: PropTypes.array.isRequired,
    total_calculado: PropTypes.number.isRequired,
    recomendaciones_post: PropTypes.string,
    insumosUsados: PropTypes.array,
    loadingInsumos: PropTypes.bool
  }),
  billingForm: PropTypes.shape({
    nit_ci: PropTypes.string.isRequired,
    razon_social: PropTypes.string.isRequired,
    metodo_pago: PropTypes.string.isRequired,
  }).isRequired,
  onChangeBillingForm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onFinalizePayment: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};

export default CheckoutModal;
