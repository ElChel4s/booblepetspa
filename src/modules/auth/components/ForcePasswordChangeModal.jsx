import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import PopModal from './PopModal';
import PopInput from './PopInput';
import PopButton from './PopButton';
import { useAuth } from '../../../store/AuthContext';
import * as authService from '../services/authService';

const ForcePasswordChangeModal = ({ isOpen }) => {
  const { setMustChangePassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [passStrength, setPassStrength] = useState(0);

  const calcStrength = (val) => {
    let score = 0;
    if (val.length >= 8) score += 1;
    if (/[A-Z]/.test(val)) score += 1;
    if (/[0-9]/.test(val)) score += 1;
    if (/[^A-Za-z0-9]/.test(val)) score += 1;
    setPassStrength(score);
  };

  const handleSaveNewPassword = async () => {
    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    setError(null);

    const { error: updateError } = await authService.updatePassword(newPassword);

    if (updateError) {
      setError('Error al actualizar: ' + updateError.message);
      setLoading(false);
      return;
    }

    // Marcar como modificada en metadata
    await authService.markPasswordAsChanged();

    setMustChangePassword(false);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <PopModal isOpen={isOpen} onClose={() => {}} title="Cambio Obligatorio" isDanger={true} showCloseButton={false}>
      <div className="space-y-6">
        <div className="bg-emerald-50 border-2 border-emerald-300 p-4 rounded-2xl flex items-start gap-3">
          <ShieldCheck className="text-emerald-600 shrink-0 mt-0.5" size={16} />
          <p className="text-[10px] font-black uppercase text-emerald-700 leading-relaxed">
            Por seguridad, debes cambiar tu contraseña temporal antes de continuar. Tienes 30 minutos desde la creación de la cuenta.
          </p>
        </div>

        <div className="relative">
          <PopInput
            label="Nueva Contraseña"
            icon={Lock}
            type="password"
            placeholder="Mínimo 8 caracteres..."
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); calcStrength(e.target.value); }}
            containerClassName="mb-3"
          />
          <div className="flex gap-2 px-2 mb-6">
            {[1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`h-2 flex-1 rounded-full border-2 border-black transition-colors duration-300 ${passStrength >= level ? (passStrength < 2 ? 'bg-rose-500' : passStrength < 4 ? 'bg-amber-400' : 'bg-emerald-400') : 'bg-slate-100'}`}
              />
            ))}
          </div>
        </div>

        <PopInput
          label="Repetir Contraseña"
          icon={Lock}
          type="password"
          placeholder="Repite tu nueva clave..."
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {error && (
          <div className="bg-rose-100 border-2 border-black p-2 rounded-xl text-[9px] font-black text-rose-600 uppercase text-center">
            {error}
          </div>
        )}

        <PopButton
          onClick={handleSaveNewPassword}
          variant="primary"
          icon={loading ? Loader2 : ArrowRight}
          disabled={loading || !newPassword || !confirmPassword}
        >
          {loading ? 'Guardando...' : 'Guardar y Continuar'}
        </PopButton>
      </div>
    </PopModal>
  );
};

export default ForcePasswordChangeModal;
