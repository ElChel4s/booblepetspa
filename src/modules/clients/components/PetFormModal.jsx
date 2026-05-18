import { useState } from 'react';
import { Save, Camera, Zap, Users, ClipboardList, Ruler, Activity } from 'lucide-react';
import PopModal from '../../../components/common/PopModal';
import PopInput from '../../../components/common/PopInput';
import PopTextarea from '../../../components/common/PopTextarea';
import PopTagInput from '../../../components/common/PopTagInput';
import PopSelectForm from '../../../components/common/PopSelectForm';

/**
 * PetFormModal — Modal de alta/edición de expediente de mascota.
 * Pet opcional: si se pasa, es modo edición; si no, es alta nueva.
 */
const PetFormModal = ({ isOpen, onClose, pet = null }) => {
  const [alergias, setAlergias] = useState(pet?.alergias ?? []);
  const isEditing = !!pet;

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: llamar a clientsService.createPet() o updatePet() con los datos del form
    onClose();
  };

  return (
    <PopModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Editar a ${pet.nombre}` : 'Nueva Mascota'}
    >
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Foto placeholder */}
          <div className="md:col-span-2 flex justify-center mb-2">
            <div className="w-28 h-28 bg-slate-50 border-[4px] border-dashed border-black/20 rounded-[3rem] flex flex-col items-center justify-center cursor-pointer hover:border-[var(--primary)] hover:bg-[var(--bg)] transition-all group">
              <Camera size={32} className="text-slate-300 group-hover:text-[var(--primary)]" />
              <span className="text-[9px] font-black text-slate-300 uppercase mt-2 group-hover:text-[var(--primary)]">
                Foto
              </span>
            </div>
          </div>

          <PopInput
            label="Nombre de la Mascota"
            defaultValue={pet?.nombre}
            icon={Zap}
            placeholder="Ej. Max, Firulais..."
            required
          />
          <PopSelectForm
            label="Especie"
            defaultValue={pet?.especie ?? 'Perro'}
            icon={Users}
            options={[
              { label: 'Perro 🐶', value: 'Perro' },
              { label: 'Gato 🐱', value: 'Gato' },
            ]}
          />
          <PopInput
            label="Raza"
            defaultValue={pet?.raza}
            icon={ClipboardList}
            placeholder="Ej. Poodle, Siamés..."
          />
          <PopSelectForm
            label="Tamaño"
            defaultValue={pet?.tamano ?? 'Mediano'}
            icon={Ruler}
            options={[
              { label: 'Pequeño', value: 'Pequeño' },
              { label: 'Mediano', value: 'Mediano' },
              { label: 'Grande', value: 'Grande' },
              { label: 'Gigante', value: 'Gigante' },
            ]}
          />

          <div className="md:col-span-2">
            <PopTagInput
              label="Alergias / Restricciones (Enter para añadir)"
              tags={alergias}
              setTags={setAlergias}
              placeholder="Ej: Avena, Perfumes, Pollo..."
            />
          </div>

          <div className="md:col-span-2">
            <PopTextarea
              label="Temperamento & Conducta"
              defaultValue={pet?.temperamento}
              icon={Activity}
              placeholder="Describe el comportamiento para el groomer..."
            />
          </div>

          <button
            type="submit"
            className="md:col-span-2 bg-black text-white py-5 rounded-3xl font-black text-sm uppercase shadow-[8px_8px_0px_0px_var(--primary)] hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-3 mt-2"
          >
            <Save size={18} strokeWidth={4} />
            {isEditing ? 'Actualizar Expediente' : 'Vincular Mascota'}
          </button>
        </div>
      </form>
    </PopModal>
  );
};

export default PetFormModal;
