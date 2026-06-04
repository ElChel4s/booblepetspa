import PropTypes from 'prop-types';
import { CalendarDays, Shield, LayoutDashboard } from 'lucide-react';

const ReceptionTabs = ({ activeTab, onChangeTab, badgeCount = 0 }) => {
  const tabs = [
    { id: 'calendario', label: 'Agenda Diaria', icon: CalendarDays },
    { id: 'validacion', label: 'Bandeja Web', icon: Shield, badge: badgeCount },
    { id: 'panel', label: 'Control', icon: LayoutDashboard },
  ];

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar border-b-4 border-slate-200">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChangeTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-t-2xl border-x-[4px] border-t-[4px] border-black font-black text-xs uppercase tracking-widest transition-all relative ${
              activeTab === tab.id
                ? 'bg-[var(--primary)] text-white shadow-[4px_0px_0px_0px_black] translate-y-[4px]'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-400 translate-y-1'
            }`}
          >
            <Icon size={18} strokeWidth={3} />
            {tab.label}
            {tab.badge ? (
              <span className="absolute -top-2 -right-2 bg-rose-500 text-white w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] shadow-sm animate-bounce">
                {tab.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
};

ReceptionTabs.propTypes = {
  activeTab: PropTypes.string.isRequired,
  onChangeTab: PropTypes.func.isRequired,
  badgeCount: PropTypes.number,
};

export default ReceptionTabs;
