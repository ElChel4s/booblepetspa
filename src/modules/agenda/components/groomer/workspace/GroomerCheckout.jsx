import React from 'react';
import PropTypes from 'prop-types';
import { Camera, Heart, CheckCircle, ArrowRight, X } from 'lucide-react';

const QUICK_RECOMMENDATIONS = ['Shampoo Avena', 'Deslanado Mensual', 'Limpieza Dental', 'Piel Sensible'];

export default function GroomerCheckout({
  fotoDespues,
  onTakePhoto,
  onRemovePhoto,
  recommendations,
  onRecommendationsChange,
  onSubmit,
  saving
}) {
  const agregarRecomendacionRapida = (chip) => {
    const newText = recommendations ? `${recommendations}\n- ${chip}` : `- ${chip}`;
    onRecommendationsChange(newText);
  };

  return (
    <div className="bg-emerald-400 border-[4px] border-black rounded-[2rem] p-6 shadow-[8px_8px_0px_0px_black] animate-in slide-in-from-bottom-8 flex-1 flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-white p-2 rounded-full border-[3px] border-black shadow-sm shrink-0">
            <CheckCircle size={32} className="text-emerald-500" />
          </div>
          <h2 className="text-3xl font-black uppercase italic text-black leading-none">¡Trabajo Terminado!</h2>
        </div>

        {/* Evidencia Final */}
        <div className="bg-white border-[4px] border-black rounded-2xl p-5 shadow-inner mb-6 space-y-4">
          <h4 className="font-black uppercase text-sm flex items-center gap-2">
            <Camera size={18} /> Evidencia Final
          </h4>
          {fotoDespues ? (
            <div className="relative aspect-video rounded-xl border-[3px] border-black overflow-hidden group w-full md:w-2/3 mx-auto shadow-md">
              <img src={fotoDespues} alt="Después" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onRemovePhoto('despues')}
                className="absolute top-2 right-2 bg-rose-500 text-white p-1.5 rounded-full border-2 border-black opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 shadow-md"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={() => onTakePhoto('despues')}
              className="w-full md:w-2/3 mx-auto aspect-video bg-emerald-50 border-[3px] border-black border-dashed rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-emerald-100 transition-colors cursor-pointer text-emerald-800 disabled:opacity-50"
            >
              <Camera size={32} className="text-emerald-600" />
              <span className="font-black uppercase text-sm">Tomar Foto &ldquo;Después&rdquo;</span>
            </button>
          )}
        </div>

        {/* Recomendaciones */}
        <div className="space-y-3 mb-6">
          <h4 className="font-black uppercase text-sm flex items-center gap-2">
            <Heart size={16} /> Recomendaciones para el Cliente
          </h4>
          
          <div className="flex flex-wrap gap-2 mb-2">
            {QUICK_RECOMMENDATIONS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => agregarRecomendacionRapida(chip)}
                className="px-3 py-1.5 bg-black text-white border-2 border-black rounded-lg font-black text-[10px] uppercase shadow-[2px_2px_0px_0px_white] active:translate-y-0.5 active:shadow-none hover:bg-slate-800 transition-all cursor-pointer"
              >
                + {chip}
              </button>
            ))}
          </div>

          <textarea
            value={recommendations}
            onChange={(e) => onRecommendationsChange(e.target.value)}
            placeholder="Escribe recomendaciones personalizadas para la tabla fichas_grooming.recomendaciones_post..."
            className="w-full h-24 bg-white border-[3px] border-black rounded-xl p-3 font-bold text-sm outline-none focus:ring-4 focus:ring-black/20 transition-all resize-none"
          />
        </div>
      </div>

      <button
        type="button"
        disabled={saving || !fotoDespues}
        onClick={onSubmit}
        className={`w-full py-4 text-lg border-[4px] border-black rounded-2xl font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[4px_4px_0px_0px_black] active:translate-y-1 active:shadow-none bg-white text-black disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-1`}
      >
        <span>🏁 Finalizar y Enviar a Caja</span>
        <ArrowRight size={20} strokeWidth={3} />
      </button>
    </div>
  );
}

GroomerCheckout.propTypes = {
  fotoDespues: PropTypes.string,
  onTakePhoto: PropTypes.func.isRequired,
  onRemovePhoto: PropTypes.func.isRequired,
  recommendations: PropTypes.string.isRequired,
  onRecommendationsChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};
