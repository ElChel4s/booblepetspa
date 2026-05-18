import React from 'react';
import { User, Mail, Phone, IdCard, MapPin, Scissors, BookOpen } from 'lucide-react';
import PopInput from './PopInput';

const ProfileInfoForm = ({ profileForm, onFormChange, canEdit, isEditing, viewingProfileMode }) => {
  const role = profileForm.rol;

  return (
    <div className="bg-white border-[5px] border-black p-10 rounded-[4rem] shadow-[12px_12px_0px_0px_black]">
      <div className="flex justify-between items-center mb-8 border-b-4 border-slate-100 pb-4">
        <h3 className="text-3xl font-black uppercase italic">Datos del Expediente</h3>
        <span className={`px-4 py-1 rounded-xl text-[10px] font-black uppercase border-2 border-black ${
          role === 'admin' ? 'bg-black text-white' : 
          role === 'groomer' ? 'bg-indigo-500 text-white' : 
          'bg-[var(--secondary)] text-black'
        }`}>
          Ficha: {role}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
        <div className="md:col-span-2">
          <PopInput 
            label="Nombre Completo" 
            icon={User} 
            value={profileForm.nombre_completo || ''} 
            onChange={(e) => onFormChange('nombre_completo', e.target.value)} 
            disabled={!canEdit || !isEditing} 
          />
        </div>

        <PopInput
          label="Correo Electrónico"
          icon={Mail}
          value={profileForm.email || ''}
          onChange={(e) => onFormChange('email', e.target.value)}
          disabled={!canEdit || !isEditing || viewingProfileMode !== 'admin_view'}
        />

        <PopInput 
          label="Teléfono / WhatsApp" 
          icon={Phone} 
          value={profileForm.telefono || ''} 
          onChange={(e) => onFormChange('telefono', e.target.value)} 
          disabled={!canEdit || !isEditing} 
        />

        {/* ── Campos Específicos: CLIENTE ── */}
        {role === 'cliente' && (
          <>
            <PopInput 
              label="Cédula / NIT" 
              icon={IdCard} 
              value={profileForm.ci_nit || ''} 
              onChange={(e) => onFormChange('ci_nit', e.target.value)} 
              disabled={!canEdit || !isEditing} 
            />
            <div className="md:col-span-2">
              <PopInput 
                label="Dirección Completa" 
                icon={MapPin} 
                value={profileForm.direccion || ''} 
                onChange={(e) => onFormChange('direccion', e.target.value)} 
                disabled={!canEdit || !isEditing} 
              />
            </div>
          </>
        )}

        {/* ── Campos Específicos: GROOMER ── */}
        {role === 'groomer' && (
          <>
            <PopInput 
              label="Especialidad" 
              icon={Scissors} 
              value={profileForm.especialidad || ''} 
              onChange={(e) => onFormChange('especialidad', e.target.value)} 
              disabled={!canEdit || !isEditing} 
            />
            <div className="md:col-span-2">
              <PopInput 
                label="Biografía / Notas" 
                icon={BookOpen} 
                value={profileForm.biografia || ''} 
                onChange={(e) => onFormChange('biografia', e.target.value)} 
                disabled={!canEdit || !isEditing} 
                multiline
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileInfoForm;
