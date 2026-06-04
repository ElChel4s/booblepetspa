import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import PopModal from '../../../auth/components/PopModal';
import PopInput from '../../../../components/common/PopInput';
import PopTextarea from '../../../../components/common/PopTextarea';
import PopButton from '../../../auth/components/PopButton';

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

  const handleSave = () => {
    onSubmit(fichaForm);
  };

  return (
    <PopModal isOpen={isOpen} onClose={onClose} title="Ficha de Grooming">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PopInput
            label="Nivel de suciedad"
            value={fichaForm.nivel_suciedad}
            onChange={(e) => setFichaForm({ ...fichaForm, nivel_suciedad: e.target.value })}
          />
          <PopInput
            label="Peso actual"
            type="number"
            value={fichaForm.peso_actual}
            onChange={(e) => setFichaForm({ ...fichaForm, peso_actual: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[10px] font-black uppercase">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={fichaForm.estado_ingreso_nudos}
              onChange={(e) => setFichaForm({ ...fichaForm, estado_ingreso_nudos: e.target.checked })}
              className="accent-[var(--primary)]"
            />{' '}
            Nudos
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={fichaForm.estado_ingreso_pulgas}
              onChange={(e) => setFichaForm({ ...fichaForm, estado_ingreso_pulgas: e.target.checked })}
              className="accent-[var(--primary)]"
            />{' '}
            Pulgas
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={fichaForm.estado_ingreso_heridas}
              onChange={(e) => setFichaForm({ ...fichaForm, estado_ingreso_heridas: e.target.checked })}
              className="accent-[var(--primary)]"
            />{' '}
            Heridas
          </label>
        </div>
        <PopInput
          label="Temperamento"
          value={fichaForm.temperamento_actual}
          onChange={(e) => setFichaForm({ ...fichaForm, temperamento_actual: e.target.value })}
        />
        <PopTextarea
          label="Observaciones"
          value={fichaForm.observaciones_groomer}
          onChange={(e) => setFichaForm({ ...fichaForm, observaciones_groomer: e.target.value })}
          rows={4}
        />
        <PopTextarea
          label="Recomendaciones"
          value={fichaForm.recomendaciones_post}
          onChange={(e) => setFichaForm({ ...fichaForm, recomendaciones_post: e.target.value })}
          rows={4}
        />
        <div className="flex flex-col md:flex-row gap-3 justify-end pt-2">
          <PopButton variant="outline" full={false} onClick={onClose}>
            Cancelar
          </PopButton>
          <PopButton variant="primary" full={false} onClick={handleSave}>
            {saving ? 'Guardando...' : 'Guardar ficha'}
          </PopButton>
        </div>
      </div>
    </PopModal>
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
