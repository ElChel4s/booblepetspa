import PropTypes from 'prop-types';

const Badge = ({ children, colorClass = 'bg-white', icon: Icon }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border-2 border-black text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_black] ${colorClass}`}>
    {Icon && <Icon size={10} strokeWidth={4} />}
    {children}
  </span>
);

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  colorClass: PropTypes.string,
  icon: PropTypes.elementType,
};

export default Badge;
