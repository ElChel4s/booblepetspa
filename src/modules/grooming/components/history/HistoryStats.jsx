import PropTypes from 'prop-types';

const HistoryStats = ({ completados, retrasados, recargos }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div className="bg-blue-100 border-[3.5px] border-black p-6 rounded-[2rem] shadow-[6px_6px_0px_0px_black] md:-rotate-1">
      <h4 className="font-black text-xs uppercase text-slate-600 mb-2">Completados Hoy</h4>
      <span className="text-4xl md:text-5xl font-black tracking-tighter">{completados}</span>
    </div>
    <div className="bg-amber-100 border-[3.5px] border-black p-6 rounded-[2rem] shadow-[6px_6px_0px_0px_black] md:rotate-1">
      <h4 className="font-black text-xs uppercase text-slate-600 mb-2">Retrasos (Semáforo Rojo)</h4>
      <span className="text-4xl md:text-5xl font-black tracking-tighter text-amber-600">{retrasados}</span>
    </div>
    <div className="bg-purple-100 border-[3.5px] border-black p-6 rounded-[2rem] shadow-[6px_6px_0px_0px_black]">
      <h4 className="font-black text-xs uppercase text-slate-600 mb-2">Recargos Aplicados</h4>
      <span className="text-4xl md:text-5xl font-black tracking-tighter text-purple-600">
        +${recargos}Bs
      </span>
    </div>
  </div>
);

HistoryStats.propTypes = {
  completados: PropTypes.number.isRequired,
  retrasados: PropTypes.number.isRequired,
  recargos: PropTypes.number.isRequired,
};

export default HistoryStats;
