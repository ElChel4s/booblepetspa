import { Save, User, Mail, Phone, Hash, MapPin } from 'lucide-react';
import PopModal from '../../../components/common/PopModal';
import PopInput from '../../../components/common/PopInput';

/**
 * UserFormModal — Modal de alta/edición de perfil de usuario.
 */
const UserFormModal = ({ isOpen, onClose, user = null }) => {
  const isEditing = !!user;

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: llamar a clientsService.createUser() o updateUser()
    onClose();
  };

  return (
    <PopModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Actualizar Perfil' : 'Nuevo Usuario'}
    >
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <PopInput
            label="Nombre Completo"
            defaultValue={user?.nombre_completo}
            icon={User}
            placeholder="Nombre y apellidos"
            required
          />
          <PopInput
            label="Email de Contacto"
            defaultValue={user?.email}
            icon={Mail}
            type="email"
            placeholder="correo@ejemplo.com"
          />
          <PopInput
            label="Teléfono / WhatsApp"
            defaultValue={user?.telefono}
            icon={Phone}
            placeholder="+591 7XXXXXXX"
          />
          <PopInput
            label="CI / NIT"
            defaultValue={user?.ci}
            icon={Hash}
            placeholder="Número de identidad"
          />
          <div className="md:col-span-2">
            <PopInput
              label="Dirección"
              defaultValue={user?.direccion}
              icon={MapPin}
              placeholder="Av. Principal #123, Edificio..."
            />
          </div>

          <button
            type="submit"
            className="md:col-span-2 bg-black text-white py-5 rounded-3xl font-black text-sm uppercase shadow-[8px_8px_0px_0px_var(--primary)] hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-3 mt-2"
          >
            <Save size={18} strokeWidth={4} />
            {isEditing ? 'Guardar Cambios' : 'Registrar Usuario'}
          </button>
        </div>
      </form>
    </PopModal>
  );
};

export default UserFormModal;
