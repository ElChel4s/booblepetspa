const AgendaShell = ({ title, subtitle, role, tabs, activeTab, onChangeTab, children }) => {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black italic uppercase tracking-tighter">
              {title} <span className="text-[var(--primary)]">{role}</span>
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <AgendaTabButton
                key={tab.id}
                tab={tab}
                isActive={activeTab === tab.id}
                onClick={() => onChangeTab(tab.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {children}
    </div>
  );
};

const AgendaTabButton = ({ tab, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-2xl border-[3px] border-black font-black text-[10px] uppercase tracking-widest shadow-[4px_4px_0px_0px_black] transition-all active:translate-y-1 active:shadow-none ${
      isActive ? 'bg-[var(--primary)] text-white' : 'bg-white hover:bg-slate-50'
    }`}
  >
    {tab.label}
  </button>
);

export default AgendaShell;