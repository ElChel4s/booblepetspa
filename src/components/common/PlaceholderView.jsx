import PropTypes from 'prop-types';

const PlaceholderView = ({ title, subtitle }) => (
  <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
    <div className="bg-white border-[4px] border-black rounded-[3rem] shadow-[10px_10px_0px_0px_black] p-10 max-w-4xl">
      <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-4">
        {title}
      </h2>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
        {subtitle}
      </p>
      <div className="mt-8 bg-slate-50 border-2 border-black/10 rounded-2xl p-6">
        <p className="text-sm font-bold text-slate-500">
          Vista en preparacion. Aqui ira el contenido real con datos de Supabase.
        </p>
      </div>
    </div>
  </div>
);

PlaceholderView.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
};

export default PlaceholderView;
