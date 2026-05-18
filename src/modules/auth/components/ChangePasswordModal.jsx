import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import PopModal from './PopModal';
import PopInput from './PopInput';
import PopButton from './PopButton';
import { useAuth } from '../../../store/AuthContext';
import * as authService from '../services/authService';

/**
 * ChangePasswordModal — Modal inteligente de cambio de contraseña.
 * 
 * Flujo Personal (viewingProfileMode === 'personal'):
 *   1. Pide contraseña actual → verifica → permite poner nueva
 *   2. Si no sabe su clave → confirma → envía correo de recuperación
 *
 * Flujo Admin (viewingProfileMode === 'admin_view'):
 *   1. Pide la contraseña del ADMIN para verificar identidad
 *   2. Envía correo de recuperación al usuario objetivo
 */
const ChangePasswordModal = ({ isOpen, onClose, targetUser, viewingProfileMode }) => {
  const { currentUser } = useAuth();

  // Estados del flujo
  const [step, setStep] = useState('verify'); // 'verify', 'newpass', 'confirm_email', 'email_sent', 'success'
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [passStrength, setPassStrength] = useState(0);

  const isAdmin = viewingProfileMode === 'admin_view';
  const emailToReset = isAdmin ? targetUser?.email : currentUser?.email;

  const calcStrength = (val) => {
    let score = 0;
    if (val.length >= 8) score += 1;
    if (/[A-Z]/.test(val)) score += 1;
    if (/[0-9]/.test(val)) score += 1;
    if (/[^A-Za-z0-9]/.test(val)) score += 1;
    setPassStrength(score);
  };

  const resetState = () => {
    setStep('verify');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setPassStrength(0);
    setLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // ── FLUJO PERSONAL: Verificar contraseña actual ──
  const handleVerifyCurrentPassword = async () => {
    if (!currentPassword) return;
    setLoading(true);
    setError(null);

    const { error: verifyError } = await authService.verifyCurrentPassword(currentUser.email, currentPassword);

    if (verifyError) {
      setError('La contraseña actual es incorrecta');
      setLoading(false);
      return;
    }

    setStep('newpass');
    setLoading(false);
  };

  // ── FLUJO PERSONAL: Guardar nueva contraseña ──
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

    setStep('success');
    setLoading(false);
  };

  // ── FLUJO "NO SÉ MI CLAVE" / ADMIN: Enviar correo ──
  const handleSendRecoveryEmail = async () => {
    setLoading(true);
    setError(null);

    const { error: resetError } = await authService.sendPasswordResetEmail(emailToReset);

    if (resetError) {
      setError('Error al enviar correo: ' + resetError.message);
      setLoading(false);
      return;
    }

    setStep('email_sent');
    setLoading(false);
  };

  // ── FLUJO ADMIN: Verificar contraseña del admin primero ──
  const handleAdminVerify = async () => {
    if (!currentPassword) return;
    setLoading(true);
    setError(null);

    const { error: verifyError } = await authService.verifyCurrentPassword(currentUser.email, currentPassword);

    if (verifyError) {
      setError('Tu contraseña de administrador es incorrecta');
      setLoading(false);
      return;
    }

    // Contraseña verificada, enviamos el correo al usuario
    await handleSendRecoveryEmail();
  };

  if (!isOpen) return null;

  const hasMfa = currentUser?.mfa_activado;

  return (
    <PopModal isOpen={isOpen} onClose={handleClose} title={isAdmin ? 'Reset de Clave' : 'Cambiar Contraseña'} isDanger={isAdmin}>
      
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PASO: VERIFICAR CONTRASEÑA (Personal o Admin)                      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {step === 'verify' && (
        <div className="space-y-6">
          {isAdmin ? (
            <>
              <div className="bg-rose-50 border-2 border-rose-200 p-4 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="text-rose-600 shrink-0 mt-1" size={18} />
                <p className="text-[10px] font-black uppercase text-rose-600 leading-relaxed">
                  Vas a enviar un correo de recuperación de contraseña a <span className="underline">{targetUser?.email || targetUser?.nombre_completo}</span>. Ingresa tu clave de admin para confirmar.
                </p>
              </div>
              <PopInput
                label="Tu Contraseña (Admin)"
                icon={Lock}
                type="password"
                placeholder="Ingresa tu clave..."
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </>
          ) : (
            <>
              {hasMfa && step !== 'direct_anyway' ? (
                <div className="bg-amber-50 border-2 border-amber-200 p-5 rounded-[2rem] text-center space-y-4">
                  <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                    <ShieldCheck size={24} />
                  </div>
                  <p className="text-[10px] font-black uppercase text-amber-700 leading-relaxed">
                    Tienes el <span className="text-black">Doble Factor (2FA)</span> activado. Por seguridad, la mejor forma de cambiar tu clave es a través de un enlace de recuperación.
                  </p>
                  <PopButton onClick={() => setStep('confirm_email')} variant="secondary" icon={Mail}>
                    Enviar enlace al correo
                  </PopButton>
                  <div className="pt-2">
                    <button 
                      onClick={() => setStep('direct_anyway')} 
                      className="text-[8px] font-bold uppercase text-slate-400 hover:text-black tracking-[0.2em]"
                    >
                      Intentar con contraseña actual
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-slate-50 border-2 border-black/10 p-4 rounded-2xl">
                    <p className="text-[10px] font-black uppercase text-slate-500 leading-relaxed text-center">
                      {hasMfa ? 'Ingresa tu clave actual (Supabase podría pedirte 2FA después)' : 'Para cambiar tu contraseña, primero necesitamos verificar tu identidad.'}
                    </p>
                  </div>
                  <PopInput
                    label="Contraseña Actual"
                    icon={Lock}
                    type="password"
                    placeholder="Tu clave actual..."
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </>
              )}
            </>
          )}

          {error && (
            <div className="bg-rose-100 border-2 border-black p-2 rounded-xl text-[9px] font-black text-rose-600 uppercase text-center">
              {error}
            </div>
          )}

          {(!hasMfa || isAdmin || step === 'direct_anyway') && (
            <PopButton
              onClick={isAdmin ? handleAdminVerify : handleVerifyCurrentPassword}
              variant={isAdmin ? 'danger' : 'primary'}
              icon={loading ? Loader2 : ShieldCheck}
              disabled={loading || !currentPassword}
            >
              {loading ? 'Verificando...' : isAdmin ? 'Confirmar y Enviar Correo' : 'Verificar Identidad'}
            </PopButton>
          )}

          {/* Botón: "No sé mi contraseña" (solo en flujo personal) */}
          {!isAdmin && !hasMfa && (
            <button
              onClick={() => setStep('confirm_email')}
              className="w-full text-[9px] font-black uppercase text-[var(--primary)] hover:underline tracking-widest py-2"
            >
              ¿No recuerdas tu contraseña actual?
            </button>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PASO: CONFIRMAR ENVÍO DE CORREO (flujo "no sé mi clave")           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {step === 'confirm_email' && (
        <div className="space-y-6 text-center">
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-[2rem] border-[4px] border-black flex items-center justify-center mx-auto rotate-3 shadow-[6px_6px_0px_0px_black]">
            <Mail size={36} strokeWidth={3} />
          </div>
          <h3 className="text-xl font-black italic uppercase">¿Estás seguro?</h3>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-relaxed">
            Te enviaremos un enlace a <span className="text-black">{currentUser?.email}</span> para que puedas establecer una nueva contraseña desde ahí.
          </p>

          {error && (
            <div className="bg-rose-100 border-2 border-black p-2 rounded-xl text-[9px] font-black text-rose-600 uppercase text-center">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <PopButton onClick={handleSendRecoveryEmail} variant="secondary" icon={loading ? Loader2 : Mail} disabled={loading}>
              {loading ? 'Enviando...' : 'Sí, Enviar Correo'}
            </PopButton>
            <PopButton onClick={() => { setStep('verify'); setError(null); }} variant="outline">
              Cancelar
            </PopButton>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PASO: CORREO ENVIADO                                               */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {step === 'email_sent' && (
        <div className="space-y-6 text-center py-4">
          <div className="w-20 h-20 bg-emerald-500 text-white rounded-[2rem] border-[4px] border-black flex items-center justify-center mx-auto -rotate-3 shadow-[6px_6px_0px_0px_black]">
            <Mail size={36} strokeWidth={3} />
          </div>
          <h3 className="text-2xl font-black italic uppercase tracking-tighter">¡Correo Enviado!</h3>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-relaxed">
            Hemos enviado un enlace a <span className="text-black">{emailToReset}</span>. 
            {isAdmin
              ? ' El usuario deberá hacer clic en el enlace para establecer su nueva contraseña.'
              : ' Revisa tu bandeja de entrada y haz clic en el botón para cambiar tu clave.'}
          </p>
          <PopButton onClick={handleClose} variant="primary">
            Entendido
          </PopButton>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PASO: NUEVA CONTRASEÑA (flujo personal directo)                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {step === 'newpass' && (
        <div className="space-y-6">
          <div className="bg-emerald-50 border-2 border-emerald-300 p-4 rounded-2xl flex items-start gap-3">
            <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={16} />
            <p className="text-[10px] font-black uppercase text-emerald-700 leading-relaxed">
              Identidad verificada. Ahora elige tu nueva contraseña.
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
            {loading ? 'Guardando...' : 'Guardar Nueva Contraseña'}
          </PopButton>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PASO: ÉXITO                                                        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {step === 'success' && (
        <div className="space-y-6 text-center py-4">
          <div className="w-20 h-20 bg-emerald-500 text-white rounded-[2rem] border-[4px] border-black flex items-center justify-center mx-auto -rotate-3 shadow-[6px_6px_0px_0px_black]">
            <ShieldCheck size={36} strokeWidth={3} />
          </div>
          <h3 className="text-2xl font-black italic uppercase tracking-tighter">¡Contraseña Actualizada!</h3>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-relaxed">
            Tu nueva contraseña ha sido guardada con éxito. Usa esta clave la próxima vez que inicies sesión.
          </p>
          <PopButton onClick={handleClose} variant="primary">
            Cerrar y Continuar
          </PopButton>
        </div>
      )}
    </PopModal>
  );
};

export default ChangePasswordModal;
