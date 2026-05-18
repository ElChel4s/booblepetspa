/**
 * PopTextarea — Textarea de formulario estilo Neo-Brutalism.
 */
const PopTextarea = ({ label, icon: Icon, rows = 4, ...props }) => (
  <div className="flex flex-col gap-2 w-full">
    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
      {label}
    </label>
    <div className="relative group">
      {Icon && (
        <div className="absolute left-4 top-5 text-slate-400 group-focus-within:text-[var(--primary)] transition-colors pointer-events-none">
          <Icon size={16} strokeWidth={3} />
        </div>
      )}
      <textarea
        {...props}
        rows={rows}
        className={`w-full bg-white border-[3.5px] border-black rounded-2xl py-4 ${Icon ? 'pl-12' : 'pl-5'} pr-4 font-black text-xs uppercase outline-none shadow-[4px_4px_0px_0px_black] focus:shadow-none focus:translate-y-0.5 transition-all resize-none placeholder:text-slate-300 placeholder:normal-case`}
      />
    </div>
  </div>
);

export default PopTextarea;
