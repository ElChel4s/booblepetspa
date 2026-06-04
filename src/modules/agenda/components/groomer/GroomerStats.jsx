import PropTypes from 'prop-types';
import AgendaMiniCard from '../AgendaMiniCard';

const GroomerStats = ({ totalAppointments, inProgressCount, schedulesCount, fichasCount }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
      <AgendaMiniCard label="Mis turnos" value={String(totalAppointments)} />
      <AgendaMiniCard
        label="En proceso"
        value={String(inProgressCount)}
        accent="var(--secondary)"
      />
      <AgendaMiniCard
        label="Horarios"
        value={String(schedulesCount)}
        accent="#16a34a"
      />
      <AgendaMiniCard
        label="Fichas"
        value={String(fichasCount)}
        accent="#f59e0b"
      />
    </div>
  );
};

GroomerStats.propTypes = {
  totalAppointments: PropTypes.number.isRequired,
  inProgressCount: PropTypes.number.isRequired,
  schedulesCount: PropTypes.number.isRequired,
  fichasCount: PropTypes.number.isRequired,
};

export default GroomerStats;
