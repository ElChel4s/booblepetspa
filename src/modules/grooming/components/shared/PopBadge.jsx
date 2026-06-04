import PropTypes from 'prop-types';

const PopBadge = ({ children, color = 'bg-white', textColor = 'text-black', className = '' }) => (
  <span
    className={`px-2 py-1 rounded-md border-2 border-black font-black text-[10px] uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${color} ${textColor} ${className}`}
  >
    {children}
  </span>
);

PopBadge.propTypes = {
  children: PropTypes.node.isRequired,
  color: PropTypes.string,
  textColor: PropTypes.string,
  className: PropTypes.string,
};

export default PopBadge;
