import React, { useState } from 'react';
import { X, Star, Heart, CheckCircle2 } from 'lucide-react';
import { useClientLiveTracking } from '../../../../../store/ClientTrackingContext';

export default function ClientCheckoutFeedback() {
  const { activeCita, showCheckoutModal, setShowCheckoutModal, handleFinishSurvey } = useClientLiveTracking();

  const [rating, setRating] = useState(10);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!showCheckoutModal || !activeCita) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await handleFinishSurvey(rating, comment);
    } finally {
      setSubmitting(false);
    }
  };

  const petName = activeCita.mascota?.nombre || 'tu mascota';

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/80 backdrop-blur-md flex justify-center items-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md border-[4px] border-black rounded-[2.5rem] shadow-[10px_10px_0px_0px_black] overflow-hidden relative">
        
        {/* Botón de cierre */}
        <button
          onClick={() => setShowCheckoutModal(false)}
          className="absolute top-4 right-4 bg-slate-100 border-[2.5px] border-black p-2 rounded-xl hover:bg-slate-200 transition-colors shadow-[2px_2px_0px_0px_black] active:translate-y-0.5 active:shadow-none cursor-pointer"
        >
          <X size={16} strokeWidth={3} />
        </button>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 text-center">
          
          <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 border-[3px] border-black rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_black] mb-2 rotate-3">
            <Heart size={32} className="fill-current" />
          </div>

          <div>
            <h3 className="font-black text-2xl uppercase tracking-tighter text-slate-900">
              ¡{petName} está listo!
            </h3>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mt-1">
              Ayúdanos a mejorar evaluando el servicio
            </p>
          </div>

          {/* Calificación NPS de 1 a 10 */}
          <div className="space-y-3">
            <label className="text-xs font-black uppercase text-slate-500 tracking-wider">
              ¿Qué tan probable es que nos recomiendes?
            </label>
            <div className="grid grid-cols-5 gap-2 md:grid-cols-10">
              {[...Array(10)].map((_, i) => {
                const score = i + 1;
                const isSelected = rating === score;
                return (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setRating(score)}
                    className={`py-2 rounded-lg font-black text-xs border-[2px] border-black transition-all shadow-[2px_2px_0px_0px_black] active:translate-y-0.5 active:shadow-none cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--primary)] text-white shadow-none translate-y-0.5'
                        : 'bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {score}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">
              <span>Poco probable</span>
              <span>Muy probable</span>
            </div>
          </div>

          {/* Comentarios */}
          <div className="space-y-2 text-left">
            <label className="text-xs font-black uppercase text-slate-500 tracking-wider pl-1">
              Comentarios adicionales
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows="3"
              placeholder="¿Qué tal fue la atención del groomer?"
              className="w-full bg-slate-50 border-[3px] border-black rounded-2xl p-4 text-xs font-bold focus:outline-none focus:bg-white placeholder-slate-400 focus:shadow-[4px_4px_0px_0px_black] transition-all"
            />
          </div>

          {/* Botón de envío */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[var(--primary)] text-white border-[3px] border-black py-4 rounded-2xl font-black uppercase text-xs tracking-wider shadow-[4px_4px_0px_0px_black] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_black] transition-all active:translate-y-1 active:shadow-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>Finalizar y Salir</span>
            <CheckCircle2 size={16} strokeWidth={3} />
          </button>

        </form>
      </div>
    </div>
  );
}
