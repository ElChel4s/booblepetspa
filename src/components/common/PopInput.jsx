/**
 * PopInput — Input de formulario estilo Neo-Brutalism.
 * Usado en modales y formularios del sistema.
 */
const PopInput = ({ label, icon: Icon, ...props }) => (
  <div className="flex flex-col gap-2 w-full">
    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
      {label}
    </label>
    <div className="relative group">
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[var(--primary)] transition-colors pointer-events-none">
          <Icon size={16} strokeWidth={3} />
        </div>
      )}
      <input
        {...props}
        className={`w-full bg-white border-[3.5px] border-black rounded-2xl py-3.5 ${Icon ? 'pl-12' : 'pl-5'} pr-4 font-black text-xs uppercase outline-none shadow-[4px_4px_0px_0px_black] focus:shadow-none focus:translate-y-0.5 transition-all placeholder:text-slate-300 placeholder:normal-case`}
      />
    </div>
  </div>
);

export default PopInput;
