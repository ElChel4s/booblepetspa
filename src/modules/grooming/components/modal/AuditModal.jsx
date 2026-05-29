import PropTypes from 'prop-types';
import { X, RefreshCcw, AlertTriangle, ArrowRight } from 'lucide-react';
import PopBadge from '../shared/PopBadge';

const AuditModal = ({ selectedFicha, loadingFicha, onClose }) => {
  if (!selectedFicha && !loadingFicha) return null;

  const ficha = selectedFicha?.ficha;
  const fotoAntes = ficha?.fotos?.find((f) => f.tipo_momento === 'antes')?.url_foto;
  const fotoDespues = ficha?.fotos?.find((f) => f.tipo_momento === 'despues')?.url_foto;

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-[2rem] md:rounded-[3rem] border-[4px] md:border-[6px] border-black shadow-[8px_8px_0px_0px_black] md:shadow-[12px_12px_0px_0px_black] p-6 md:p-8 relative max-h-full overflow-y-auto">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 md:-top-4 md:-right-4 bg-rose-500 text-white w-10 h-10 md:w-12 md:h-12 rounded-full border-[3px] md:border-[4px] border-black flex items-center justify-center shadow-[4px_4px_0px_0px_black] hover:scale-110 transition-transform z-20"
        >
          <X size={20} strokeWidth={4} />
        </button>

        {/* Loading */}
        {loadingFicha && (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCcw size={48} className="animate-spin text-[var(--primary)] mb-4" strokeWidth={3} />
            <h3 className="font-black text-xl uppercase tracking-widest">Cargando Ficha...</h3>
            <p className="text-sm font-bold text-slate-500">Consultando fichas_grooming...</p>
          </div>
        )}

        {/* Content */}
        {!loadingFicha && selectedFicha && (
          <>
            <h2 className="text-2xl md:text-3xl font-black uppercase italic mb-2 pr-10">
              Auditoría: {selectedFicha.mascotaNombre}
            </h2>
            <p className="text-xs md:text-sm font-bold text-slate-500 uppercase mb-4 md:mb-6">
              Atendido por {selectedFicha.groomerNombre}
              {ficha?.id && ` · Ficha #FG-${ficha.id.slice(0, 8)}`}
            </p>

            {/* Health badges */}
            <div className="flex flex-wrap gap-2 mb-8">
              {ficha ? (
                <>
                  {ficha.nivel_suciedad && (
                    <PopBadge color="bg-blue-100">Suciedad: {ficha.nivel_suciedad}</PopBadge>
                  )}
                  {ficha.estado_ingreso_nudos && (
                    <PopBadge color="bg-amber-300">Nudos Encontrados</PopBadge>
                  )}
                  {ficha.estado_ingreso_pulgas && (
                    <PopBadge color="bg-rose-400" textColor="text-white">Presencia Pulgas</PopBadge>
                  )}
                  {ficha.estado_ingreso_heridas && (
                    <PopBadge color="bg-orange-400" textColor="text-white">Heridas Previas</PopBadge>
                  )}
                  {!ficha.estado_ingreso_nudos && !ficha.estado_ingreso_pulgas && !ficha.estado_ingreso_heridas && (
                    <PopBadge color="bg-emerald-300">Sin Novedades Médicas</PopBadge>
                  )}
                </>
              ) : (
                <PopBadge color="bg-slate-100">Sin ficha registrada</PopBadge>
              )}
            </div>

            {/* Fotos antes / después */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-2">
                <PopBadge color="bg-black" textColor="text-white">Antes</PopBadge>
                <div className="aspect-square bg-slate-200 border-[4px] border-black rounded-3xl overflow-hidden grayscale">
                  {fotoAntes ? (
                    <img src={fotoAntes} className="w-full h-full object-cover" alt="Antes" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-black uppercase text-xs">
                      Sin foto
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2 relative">
                <PopBadge color="bg-[var(--primary)]" textColor="text-white">Después</PopBadge>
                <div className="aspect-square bg-white border-[4px] border-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_var(--primary)]">
                  {fotoDespues ? (
                    <img src={fotoDespues} className="w-full h-full object-cover" alt="Después" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-black uppercase text-xs">
                      Sin foto
                    </div>
                  )}
                </div>
                <div className="hidden md:flex absolute top-1/2 -left-8 bg-white border-[4px] border-black p-2 rounded-full shadow-[4px_4px_0px_0px_black] z-10">
                  <ArrowRight size={24} strokeWidth={4} />
                </div>
              </div>
            </div>

            {/* Observaciones */}
            {ficha?.observaciones_groomer && (
              <div className="bg-amber-100 border-[4px] border-black rounded-2xl p-4 flex gap-4 items-start shadow-inner mb-6">
                <AlertTriangle className="text-amber-600 shrink-0 mt-1" />
                <div>
                  <h4 className="font-black uppercase text-sm mb-1">Observaciones del Groomer</h4>
                  <p className="font-bold text-slate-800 text-sm italic">
                    "{ficha.observaciones_groomer}"
                  </p>
                </div>
              </div>
            )}

            {/* Checklist */}
            {ficha?.checklist && ficha.checklist.length > 0 && (
              <div className="mb-6">
                <h4 className="font-black uppercase text-sm mb-3 border-b-[3px] border-black pb-2">
                  Checklist de seguimiento
                </h4>
                <div className="space-y-2">
                  {ficha.checklist.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-2 rounded-xl border-[2px] ${
                        item.completado
                          ? 'border-emerald-400 bg-emerald-50'
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md border-2 border-black flex items-center justify-center font-black text-xs ${
                          item.completado ? 'bg-emerald-400' : 'bg-white'
                        }`}
                      >
                        {item.completado && '✓'}
                      </div>
                      <span className="font-black text-xs uppercase">
                        {item.tarea?.nombre || 'Tarea'}
                      </span>
                      {item.observacion_item && (
                        <span className="text-[10px] text-slate-500 ml-auto">{item.observacion_item}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={onClose}
                className="w-full md:w-auto bg-black text-white px-8 py-3 rounded-2xl font-black uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_0px_var(--primary)] hover:translate-y-1 hover:shadow-none transition-all"
              >
                Cerrar Auditoría
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

AuditModal.propTypes = {
  selectedFicha: PropTypes.object,
  loadingFicha: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default AuditModal;
