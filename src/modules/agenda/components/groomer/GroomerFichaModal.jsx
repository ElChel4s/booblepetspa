import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FileText, Save, X, Activity, Scissors, AlertCircle, Heart } from 'lucide-react';

const BrutalCardToggle = ({ label, checked, onChange, icon: Icon, colorClass }) => (
  <label
    className={`flex items-center gap-3 p-4 rounded-2xl border-[3.5px] border-black cursor-pointer transition-all shadow-[4px_4px_0px_0px_black] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_black] active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_black] ${
      checked ? colorClass : 'bg-white text-slate-400'
    }`}
  >
    <div className={`p-2 rounded-xl border-2 border-black ${checked ? 'bg-white text-black' : 'bg-slate-100 text-slate-400'}`}>
      <Icon size={20} strokeWidth={3} />
    </div>
    <div className="flex-1">
      <span className={`block font-black uppercase text-sm ${checked ? 'text-black' : 'text-slate-500'}`}>
        {label}
      </span>
      <span className={`text-[9px] font-bold uppercase tracking-wider ${checked ? 'text-black/70' : 'text-slate-400'}`}>
        {checked ? 'Detectado' : 'No detectado'}
      </span>
    </div>
    <div className={`w-6 h-6 rounded-md border-2 border-black flex items-center justify-center shrink-0 ${checked ? 'bg-black text-white' : 'bg-white'}`}>
      {checked && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
    </div>
    <input type="checkbox" className="hidden" checked={checked} onChange={onChange} />
  </label>
);

const GroomerFichaModal = ({
  isOpen,
  onClose,
  cita,
  fichas,
  onSubmit,
  saving,
}) => {
  const [fichaForm, setFichaForm] = useState({
    nivel_suciedad: '',
    estado_ingreso_nudos: false,
    estado_ingreso_pulgas: false,
    estado_ingreso_heridas: false,
    temperamento_actual: '',
    peso_actual: '',
    observaciones_groomer: '',
    recomendaciones_post: '',
  });

  useEffect(() => {
    if (!isOpen || !cita) return;
    const existing = fichas.find((item) => item.cita_id === cita.id);
    setFichaForm({
      nivel_suciedad: existing?.nivel_suciedad || '',
      estado_ingreso_nudos: Boolean(existing?.estado_ingreso_nudos),
      estado_ingreso_pulgas: Boolean(existing?.estado_ingreso_pulgas),
      estado_ingreso_heridas: Boolean(existing?.estado_ingreso_heridas),
      temperamento_actual: existing?.temperamento_actual || '',
      peso_actual: existing?.peso_actual || '',
      observaciones_groomer: existing?.observaciones_groomer || '',
      recomendaciones_post: existing?.recomendaciones_post || '',
    });
  }, [isOpen, cita, fichas]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSubmit(fichaForm);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#f8fafc] border-[6px] border-black rounded-[3rem] shadow-[15px_15px_0px_0px_black] w-full max-w-4xl max-h-[90vh] flex flex-col relative animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 md:p-8 border-b-[4px] border-black bg-white rounded-t-[2.5rem]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-400 rounded-2xl border-[3.5px] border-black flex items-center justify-center shadow-[4px_4px_0px_0px_black]">
              <FileText size={28} className="text-black" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter leading-none">
                Ficha Clínica
              </h2>
              <p className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest mt-1">
                {cita?.mascota?.nombre || cita?.mascota_nombre || 'Mascota'} - {cita?.servicio?.nombre || 'Servicio'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-rose-100 text-rose-600 rounded-2xl border-[3px] border-black hover:bg-rose-500 hover:text-white transition-all shadow-[4px_4px_0px_0px_black] active:translate-y-1 active:shadow-none"
          >
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Sección Izquierda: Datos Generales */}
            <div className="space-y-6">
              <h3 className="font-black text-lg uppercase flex items-center gap-2 border-b-[3px] border-black pb-2">
                <Activity size={20} className="text-indigo-500" /> Evaluación Inicial
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Peso Actual (kg)</label>
                  <input
                    type="number"
                    value={fichaForm.peso_actual}
                    onChange={(e) => setFichaForm({ ...fichaForm, peso_actual: e.target.value })}
                    className="w-full bg-white border-[3.5px] border-black rounded-2xl p-4 font-black text-lg shadow-[4px_4px_0px_0px_black] focus:outline-none focus:-translate-y-1 focus:shadow-[6px_6px_0px_0px_var(--primary)] transition-all"
                    placeholder="0.0"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Temperamento</label>
                  <input
                    type="text"
                    value={fichaForm.temperamento_actual}
                    onChange={(e) => setFichaForm({ ...fichaForm, temperamento_actual: e.target.value })}
                    className="w-full bg-white border-[3.5px] border-black rounded-2xl p-4 font-black text-sm shadow-[4px_4px_0px_0px_black] focus:outline-none focus:-translate-y-1 focus:shadow-[6px_6px_0px_0px_var(--primary)] transition-all"
                    placeholder="Ej. Nervioso"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nivel de Suciedad</label>
                <select
                  value={fichaForm.nivel_suciedad}
                  onChange={(e) => setFichaForm({ ...fichaForm, nivel_suciedad: e.target.value })}
                  className="w-full bg-white border-[3.5px] border-black rounded-2xl p-4 font-black text-sm shadow-[4px_4px_0px_0px_black] focus:outline-none focus:-translate-y-1 focus:shadow-[6px_6px_0px_0px_var(--primary)] transition-all appearance-none cursor-pointer"
                >
                  <option value="">Seleccione un nivel...</option>
                  <option value="Bajo">Bajo</option>
                  <option value="Medio">Medio</option>
                  <option value="Alto">Alto</option>
                  <option value="Extremo">Extremo</option>
                </select>
              </div>
            </div>

            {/* Sección Derecha: Estado Físico (Toggles) */}
            <div className="space-y-6">
              <h3 className="font-black text-lg uppercase flex items-center gap-2 border-b-[3px] border-black pb-2">
                <AlertCircle size={20} className="text-rose-500" /> Alertas de Ingreso
              </h3>
              
              <div className="flex flex-col gap-4">
                <BrutalCardToggle
                  label="Presencia de Nudos"
                  icon={Scissors}
                  colorClass="bg-amber-300"
                  checked={fichaForm.estado_ingreso_nudos}
                  onChange={(e) => setFichaForm({ ...fichaForm, estado_ingreso_nudos: e.target.checked })}
                />
                <BrutalCardToggle
                  label="Presencia de Pulgas"
                  icon={AlertCircle}
                  colorClass="bg-rose-300"
                  checked={fichaForm.estado_ingreso_pulgas}
                  onChange={(e) => setFichaForm({ ...fichaForm, estado_ingreso_pulgas: e.target.checked })}
                />
                <BrutalCardToggle
                  label="Heridas o Lesiones"
                  icon={Heart}
                  colorClass="bg-rose-200"
                  checked={fichaForm.estado_ingreso_heridas}
                  onChange={(e) => setFichaForm({ ...fichaForm, estado_ingreso_heridas: e.target.checked })}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t-[3px] border-black/10">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Observaciones del Groomer</label>
              <textarea
                value={fichaForm.observaciones_groomer}
                onChange={(e) => setFichaForm({ ...fichaForm, observaciones_groomer: e.target.value })}
                className="w-full h-32 bg-amber-50 border-[3.5px] border-black rounded-2xl p-4 font-bold text-sm shadow-[4px_4px_0px_0px_black] focus:outline-none focus:-translate-y-1 focus:shadow-[6px_6px_0px_0px_var(--primary)] transition-all resize-none"
                placeholder="Anota cualquier detalle relevante durante el servicio..."
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Recomendaciones para el Cliente</label>
              <div className="flex flex-wrap gap-2 mb-1">
                {['Shampoo Avena', 'Deslanado Mensual', 'Limpieza Dental', 'Piel Sensible'].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      const newText = fichaForm.recomendaciones_post ? `${fichaForm.recomendaciones_post}\n- ${chip}` : `- ${chip}`;
                      setFichaForm({ ...fichaForm, recomendaciones_post: newText });
                    }}
                    className="px-2 py-1 bg-slate-100 border-2 border-black rounded-lg text-[9px] font-black uppercase shadow-[2px_2px_0px_0px_black] active:translate-y-0.5 active:shadow-none hover:bg-slate-200 transition-all text-slate-700"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
              <textarea
                value={fichaForm.recomendaciones_post}
                onChange={(e) => setFichaForm({ ...fichaForm, recomendaciones_post: e.target.value })}
                className="w-full h-[5.5rem] bg-emerald-50 border-[3.5px] border-black rounded-2xl p-4 font-bold text-sm shadow-[4px_4px_0px_0px_black] focus:outline-none focus:-translate-y-1 focus:shadow-[6px_6px_0px_0px_var(--primary)] transition-all resize-none"
                placeholder="¿Qué cuidados debe tener el dueño en casa?"
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 md:p-8 bg-slate-100 border-t-[4px] border-black rounded-b-[2.5rem] flex flex-col-reverse md:flex-row justify-end gap-4">
          <button
            onClick={onClose}
            className="px-8 py-4 bg-white border-[4px] border-black rounded-2xl font-black text-sm uppercase shadow-[4px_4px_0px_0px_black] hover:bg-slate-50 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_black] active:translate-y-1 active:shadow-none transition-all text-slate-600"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-4 bg-[var(--primary)] text-white border-[4px] border-black rounded-2xl font-black text-sm uppercase shadow-[4px_4px_0px_0px_black] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_black] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save size={20} strokeWidth={3} />
            {saving ? 'Guardando...' : 'Guardar Ficha'}
          </button>
        </div>
      </div>
    </div>
  );
};

GroomerFichaModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  cita: PropTypes.object,
  fichas: PropTypes.array.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};

export default GroomerFichaModal;
