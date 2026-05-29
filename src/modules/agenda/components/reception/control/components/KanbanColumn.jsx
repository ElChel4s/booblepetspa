import PropTypes from 'prop-types';
import Badge from './Badge';

const KanbanColumn = ({ title, count, icon, children, bgClass = 'bg-slate-100' }) => (
  <div className={`flex-1 min-w-[300px] max-w-full h-full border-[4px] border-black rounded-[2.5rem] p-5 flex flex-col shadow-[8px_8px_0px_0px_black] overflow-hidden ${bgClass}`}>
    <div className="flex items-center justify-between mb-4 border-b-4 border-black/10 pb-3 shrink-0">
      <h2 className="font-black text-xl uppercase flex items-center gap-2">
        {icon}
        {title}
      </h2>
      <Badge colorClass="bg-black text-white">{String(count)}</Badge>
    </div>
    
    <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar pb-10">
      {children}
    </div>
  </div>
);

KanbanColumn.propTypes = {
  title: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  icon: PropTypes.node.isRequired,
  children: PropTypes.node,
  bgClass: PropTypes.string,
};

export default KanbanColumn;
