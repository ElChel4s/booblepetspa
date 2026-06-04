import PropTypes from 'prop-types';
import { PawPrint, History, RotateCcw } from 'lucide-react';

const DashboardSidebar = ({
  pets,
  pastAppointments,
  onQuickRebook,
}) => {
  return (
    <div className="space-y-8">
      {/* Registered Pets Card */}
      <div className="bg-white border-[3px] border-black rounded-[2rem] p-6 shadow-[6px_6px_0px_0px_black]">
        <h2 className="text-[13px] font-black uppercase italic flex items-center gap-2 text-slate-800 mb-5 pb-3 border-b-[3px] border-black/10">
          <PawPrint size={18} className="text-black" strokeWidth={3} /> Tus Peludos
        </h2>
        {pets.length === 0 ? (
          <p className="text-[10px] font-black uppercase text-slate-400 py-4 text-center">
            No tienes mascotas registradas
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {pets.map((pet) => (
              <div
                key={pet.id}
                className="flex items-center gap-2 bg-slate-50 border-[2px] border-black px-3 py-2 rounded-xl shadow-sm"
              >
                <img
                  src={
                    pet.foto_perfil_url ||
                    `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${pet.nombre || 'Pet'}&backgroundColor=fbbf24`
                  }
                  alt={pet.nombre}
                  className="w-8 h-8 rounded-full border-2 border-black object-cover bg-white animate-in zoom-in-95 duration-200"
                />
                <div>
                  <p className="text-xs font-black uppercase leading-none">{pet.nombre}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
                    {pet.raza || pet.especie}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Appointment History Card */}
      <div>
        <h2 className="text-[13px] font-black uppercase italic flex items-center gap-2 text-slate-800 mb-5 border-l-[4px] border-[var(--secondary)] pl-3">
          <History size={18} className="text-black" strokeWidth={3} /> Historial de Citas
        </h2>
        {pastAppointments.length === 0 ? (
          <p className="text-[10px] font-black uppercase text-slate-400 py-4 text-center bg-white border-2 border-black rounded-2xl">
            Sin citas anteriores
          </p>
        ) : (
          <div className="space-y-4">
            {pastAppointments.slice(0, 5).map((past) => {
              const dateFormatted = new Date(past.fecha_hora_inicio).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              return (
                <div
                  key={past.id}
                  className="bg-white border-[3px] border-black p-4 rounded-2xl flex justify-between items-center shadow-[4px_4px_0px_0px_black] hover:-translate-y-1 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        past.mascota?.foto_perfil_url ||
                        `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${past.mascota?.nombre || 'Pet'}&backgroundColor=fbbf24`
                      }
                      alt={past.mascota?.nombre}
                      className="w-12 h-12 bg-slate-100 border-[2px] border-black rounded-xl group-hover:scale-110 transition-transform object-cover"
                    />
                    <div>
                      <h4 className="font-black uppercase text-sm leading-none">{past.mascota?.nombre}</h4>
                      <p className="text-[9px] font-black text-[var(--primary)] uppercase mt-1 mb-0.5">
                        {past.servicio?.nombre || 'Grooming'}
                      </p>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                        {dateFormatted} {past.estado === 'cancelada' && <span className="text-rose-500">(Cancelada)</span>}
                      </p>
                    </div>
                  </div>
                  {past.estado !== 'cancelada' && (
                    <button
                      onClick={() => onQuickRebook(past.mascota, past.servicio_id)}
                      className="bg-black text-[var(--secondary)] p-3 rounded-xl border-[2px] border-black shadow-[2px_2px_0px_0px_var(--secondary)] active:translate-y-1 active:shadow-none transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
                    >
                      <RotateCcw size={16} strokeWidth={3} />
                      <span className="text-[7px] font-black uppercase tracking-widest">Repetir</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

DashboardSidebar.propTypes = {
  pets: PropTypes.array.isRequired,
  pastAppointments: PropTypes.array.isRequired,
  onQuickRebook: PropTypes.func.isRequired,
};

export default DashboardSidebar;
