import PropTypes from 'prop-types';
import { PawPrint } from 'lucide-react';
import PopBadge from '../shared/PopBadge';
import PetCard from './PetCard';

const COLUMN_COLORS = [
  'bg-blue-200',
  'bg-emerald-200',
  'bg-purple-200',
  'bg-amber-200',
  'bg-rose-200',
];

const GroomerColumn = ({ groomer, citas, index, onOpenFicha, onDrop }) => {
  const color = COLUMN_COLORS[index % COLUMN_COLORS.length];

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e) => {
    e.preventDefault();
    const citaId = e.dataTransfer.getData('citaId');
    if (citaId) onDrop(citaId, groomer.id);
  };

  return (
    <div
      className="min-w-[300px] w-[300px] flex-shrink-0 bg-white/50 backdrop-blur-sm border-[4px] border-black rounded-[2rem] flex flex-col snap-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Header */}
      <div className={`p-4 border-b-[4px] border-black flex items-center justify-between rounded-t-[1.7rem] ${color}`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full border-[3px] border-black overflow-hidden shadow-[2px_2px_0px_0px_black] bg-white shrink-0">
            <img
              src={
                groomer.avatar_url ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${groomer.nombre_completo}`
              }
              alt={groomer.nombre_completo}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-black text-base uppercase tracking-tight leading-tight">
              {groomer.nombre_completo}
            </h3>
            <PopBadge color="bg-black" textColor="text-white" className="!text-[8px] py-0 mt-0.5 block w-max">
              Estación {index + 1}
            </PopBadge>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-white border-2 border-black flex items-center justify-center font-black shadow-[2px_2px_0px_0px_black]">
          {citas.length}
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto min-h-[200px]">
        {citas.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 opacity-50 border-4 border-dashed border-slate-300 rounded-2xl min-h-[150px]">
            <PawPrint size={40} className="mb-2" />
            <span className="font-black uppercase text-xs">Estación Libre</span>
          </div>
        )}
        {citas.map((cita) => (
          <PetCard key={cita.id} cita={cita} onOpenFicha={onOpenFicha} />
        ))}
      </div>
    </div>
  );
};

GroomerColumn.propTypes = {
  groomer: PropTypes.object.isRequired,
  citas: PropTypes.array.isRequired,
  index: PropTypes.number.isRequired,
  onOpenFicha: PropTypes.func.isRequired,
  onDrop: PropTypes.func.isRequired,
};

export default GroomerColumn;
