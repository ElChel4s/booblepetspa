const AgendaMiniCard = ({ label, value, accent = 'var(--primary)' }) => {
  return (
    <div className="bg-white border-[4px] border-black p-5 rounded-[2rem] shadow-[8px_8px_0px_0px_black] flex flex-col gap-2">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      <span className="text-3xl font-black italic" style={{ color: accent }}>{value}</span>
    </div>
  );
};

export default AgendaMiniCard;