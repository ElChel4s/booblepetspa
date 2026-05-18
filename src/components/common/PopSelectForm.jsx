/**
 * PopSelectForm — Select nativo de formulario estilo Neo-Brutalism.
 * Distinto del PopSelect de filtros (que tiene dropdown custom).
 * Usar este en modales y formularios de edición.
 */
const PopSelectForm = ({ label, icon: Icon, options = [], ...props }) => (
  <div className="flex flex-col gap-2 w-full">
    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
      {label}
    </label>
    <div className="relative group">
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[var(--primary)] transition-colors z-10 pointer-events-none">
          <Icon size={16} strokeWidth={3} />
        </div>
      )}
      <select
        {...props}
        className={`w-full bg-white border-[3.5px] border-black rounded-2xl py-3.5 ${Icon ? 'pl-12' : 'pl-5'} pr-4 font-black text-xs uppercase outline-none shadow-[4px_4px_0px_0px_black] focus:shadow-none focus:translate-y-0.5 transition-all appearance-none cursor-pointer`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  </div>
);

export default PopSelectForm;
