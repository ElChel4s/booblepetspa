import PropTypes from 'prop-types';

const ProgressBar = ({ current, total }) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="w-full mt-2">
      <div className="flex justify-between text-[10px] font-black uppercase mb-1">
        <span>Checklist</span>
        <span>{current}/{total}</span>
      </div>
      <div className="h-4 w-full bg-slate-100 border-2 border-black rounded-full overflow-hidden shadow-inner flex">
        <div
          className="h-full bg-[var(--primary)] border-r-2 border-black transition-all duration-500 flex items-center justify-center overflow-hidden relative"
          style={{ width: `${percentage}%` }}
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, transparent, transparent 5px, black 5px, black 10px)',
            }}
          />
        </div>
      </div>
    </div>
  );
};

ProgressBar.propTypes = {
  current: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
};

export default ProgressBar;
