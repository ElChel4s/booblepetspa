import PropTypes from 'prop-types';

export const PetTag = ({ tag }) => {
  const styles = {
    'Nervioso': 'bg-rose-100 text-rose-700 border-rose-300',
    'Gigante': 'bg-indigo-100 text-indigo-700 border-indigo-300',
    'Pelo Enredado': 'bg-amber-100 text-amber-700 border-amber-300',
    'Senior': 'bg-slate-200 text-slate-700 border-slate-400'
  };
  
  return (
    <span className={`px-2 py-0.5 rounded-md border-2 font-black text-[8px] uppercase tracking-wider ${styles[tag.criterio] || 'bg-slate-100 text-slate-600 border-slate-300'}`}>
      {tag.criterio}
    </span>
  );
};

PetTag.propTypes = {
  tag: PropTypes.shape({
    id: PropTypes.string,
    criterio: PropTypes.string.isRequired,
  }).isRequired,
};

export const StatusBadge = ({ status }) => {
  const styles = {
    programada: "bg-blue-50 text-blue-600 border-blue-600 border-dashed",
    en_espera: "bg-amber-400 text-black border-black shadow-[2px_2px_0px_0px_black] animate-pulse",
    en_proceso: "bg-indigo-100 text-indigo-600 border-indigo-600",
    pausada: "bg-rose-100 text-rose-600 border-rose-600",
    completada: "bg-emerald-100 text-emerald-700 border-emerald-600 opacity-60"
  };
  
  const labels = {
    programada: "Por llegar",
    en_espera: "¡En sala de espera!",
    en_proceso: "En mesa / Tina",
    pausada: "Pausado (Descanso)",
    completada: "Terminado"
  };

  return (
    <span className={`px-3 py-1.5 rounded-xl border-[3px] font-black text-[9px] uppercase tracking-widest transition-all ${styles[status] || styles.programada}`}>
      {labels[status] || status}
    </span>
  );
};

StatusBadge.propTypes = {
  status: PropTypes.string,
};
