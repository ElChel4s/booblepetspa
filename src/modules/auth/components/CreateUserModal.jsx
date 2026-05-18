import React, { useState } from 'react';
import {
  UserPlus, Mail, Phone, Lock, MapPin, FileText,
  Scissors, BookOpen, ChevronDown, Loader2, CheckCircle, ArrowRight
} from 'lucide-react';
import PopModal from './PopModal';
import PopInput from './PopInput';
import PopButton from './PopButton';
import PopTagInput from './PopTagInput';
import { createUserByAdmin } from '../../../services/profilesService';

// ─── Configuración de roles ───────────────────────────────────────────────────
const ROLES = [
  { id: 'cliente',   label: 'Cliente',       color: 'bg-amber-400',   textColor: 'text-black' },
  { id: 'groomer',   label: 'Groomer',       color: 'bg-indigo-500',  textColor: 'text-white' },
  { id: 'recepcion', label: 'Recepción',     color: 'bg-teal-500',    textColor: 'text-white' },
  { id: 'admin',     label: 'Administrador', color: 'bg-black',       textColor: 'text-white' },
];

const EMPTY_FORM = {
  nombre_completo: '', email: '', telefono: '',
  rol: 'cliente',
  ci_nit: '', // Ahora es base para la contraseña
  // cliente
  direccion: '',
  // groomer
  especialidad: '', biografia: '',
  especList: [],
};

// ─── Componente ───────────────────────────────────────────────────────────────
const CreateUserModal = ({ isOpen, onClose, onCreated }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [step, setStep] = useState('form'); // 'form' | 'success'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const selectedRole = ROLES.find(r => r.id === form.rol);

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setStep('form');
    setError(null);
    onClose();
  };

  const handleCreate = async () => {
    // Validación mínima
    if (!form.nombre_completo || !form.email) {
      setError('El nombre y el correo son obligatorios');
      return;
    }
    if (form.rol === 'cliente' && !form.ci_nit) {
      setError('El CI/NIT es obligatorio para clientes (se usará como contraseña temporal)');
      return;
    }

    setLoading(true);
    setError(null);

    const dataToSend = { ...form };
    if (form.rol === 'groomer' && form.especList?.length > 0) {
      dataToSend.especialidad = form.especList.join(', ');
    }

    const { data, error: createError } = await createUserByAdmin(dataToSend);

    if (createError) {
      setError(createError.message);
      setLoading(false);
      return;
    }

    setStep('success');
    setLoading(false);
    if (onCreated) onCreated(data);
  };

  if (!isOpen) return null;

  return (
    <PopModal isOpen={isOpen} onClose={handleClose} title="Nuevo Usuario">
      {step === 'form' && (
        <div className="space-y-6">

          {/* ── Selector de Rol ── */}
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Rol del usuario</p>
            <div className="grid grid-cols-2 gap-3">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => set('rol', r.id)}
                  className={`py-4 px-4 rounded-2xl border-[3px] border-black font-black text-[10px] uppercase tracking-widest transition-all hover:-translate-y-1 ${
                    form.rol === r.id
                      ? `${r.color} ${r.textColor} shadow-[4px_4px_0px_0px_black]`
                      : 'bg-slate-50 text-slate-400'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Datos Base (todos los roles) ── */}
          <div className="border-t-4 border-dashed border-slate-100 pt-6 space-y-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Datos básicos</p>

            <PopInput
              label="Nombre Completo"
              icon={UserPlus}
              placeholder="Ej: Juan Pérez López"
              value={form.nombre_completo}
              onChange={(e) => set('nombre_completo', e.target.value)}
            />
            <PopInput
              label="Correo Electrónico"
              icon={Mail}
              type="email"
              placeholder="usuario@email.com"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />
            <PopInput
              label="Teléfono"
              icon={Phone}
              placeholder="+591 7xxxxxxx"
              value={form.telefono}
              onChange={(e) => set('telefono', e.target.value)}
            />
            <PopInput
              label="CI / NIT (Contraseña temporal)"
              icon={FileText}
              placeholder="Ej: 12345678"
              value={form.ci_nit}
              onChange={(e) => set('ci_nit', e.target.value)}
            />
          </div>

          {/* ── Datos Específicos: CLIENTE ── */}
          {form.rol === 'cliente' && (
            <div className="border-t-4 border-dashed border-amber-200 pt-6 space-y-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-amber-500">Datos de cliente</p>
              <PopInput
                label="Dirección"
                icon={MapPin}
                placeholder="Zona, Calle, Número..."
                value={form.direccion}
                onChange={(e) => set('direccion', e.target.value)}
              />
            </div>
          )}

          {/* ── Datos Específicos: GROOMER ── */}
          {form.rol === 'groomer' && (
            <div className="border-t-4 border-dashed border-indigo-200 pt-6 space-y-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500">Datos de groomer</p>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Especialidades (Presiona Enter para agregar)</p>
                <PopTagInput
                  tags={form.especList || []}
                  setTags={(newTags) => set('especList', newTags)}
                  placeholder="Ej: Cortes de pelo, Baños..."
                />
              </div>
              <PopInput
                label="Biografía"
                icon={BookOpen}
                placeholder="Breve descripción profesional..."
                value={form.biografia}
                onChange={(e) => set('biografia', e.target.value)}
                multiline
              />
            </div>
          )}

          {/* ── Aviso de Contraseña ── */}
          <div className="border-t-4 border-dashed border-slate-200 pt-6">
            <div className="bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl">
              <p className="text-[9px] font-black uppercase text-slate-500 leading-relaxed">
                🔑 La contraseña temporal será la <span className="text-black font-black">CI / NIT</span> ingresada. El usuario recibirá un correo para establecer su propia contraseña definitiva al verificar su cuenta.
              </p>
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="bg-rose-100 border-2 border-black p-3 rounded-xl text-[9px] font-black text-rose-600 uppercase text-center">
              {error}
            </div>
          )}

          {/* ── Botón Crear ── */}
          <PopButton
            onClick={handleCreate}
            variant="primary"
            icon={loading ? Loader2 : UserPlus}
            disabled={loading}
          >
            {loading ? 'Creando usuario...' : `Crear ${selectedRole?.label || 'Usuario'}`}
          </PopButton>
        </div>
      )}

      {/* ── Paso Éxito ── */}
      {step === 'success' && (
        <div className="text-center py-6 space-y-6">
          <div className="w-20 h-20 bg-emerald-500 text-white rounded-[2rem] border-[4px] border-black flex items-center justify-center mx-auto -rotate-3 shadow-[6px_6px_0px_0px_black]">
            <CheckCircle size={36} strokeWidth={3} />
          </div>
          <h3 className="text-2xl font-black italic uppercase tracking-tighter">¡Usuario Creado!</h3>

          <div className="bg-slate-50 border-2 border-black p-5 rounded-2xl text-left space-y-2">
            <p className="text-[9px] font-black uppercase text-slate-400 mb-3">Resumen</p>
            <p className="text-xs font-black"><span className="text-slate-400 uppercase text-[8px]">Nombre: </span>{form.nombre_completo}</p>
            <p className="text-xs font-black"><span className="text-slate-400 uppercase text-[8px]">Email: </span>{form.email}</p>
            <p className="text-xs font-black"><span className="text-slate-400 uppercase text-[8px]">Rol: </span>{selectedRole?.label}</p>
          </div>

          <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-2xl">
            <p className="text-[9px] font-black uppercase text-amber-700 leading-relaxed">
              📧 Se enviaron dos correos a <span className="text-black">{form.email}</span>: uno de verificación de cuenta y otro para establecer su contraseña definitiva.
            </p>
          </div>

          <PopButton onClick={handleClose} variant="primary" icon={ArrowRight}>
            Crear Otro / Cerrar
          </PopButton>
        </div>
      )}
    </PopModal>
  );
};

export default CreateUserModal;
