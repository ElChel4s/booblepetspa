import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, ShieldCheck, Loader2, Smartphone } from 'lucide-react';
import PopInput from '../modules/auth/components/PopInput';
import PopButton from '../modules/auth/components/PopButton';
import * as authService from '../modules/auth/services/authService';

/**
 * ResetPasswordFromEmail — Pantalla de recuperación con soporte para MFA.
 */
const ResetPasswordFromEmail = ({ onComplete }) => {
  const [step, setStep] = useState('loading'); // 'loading', 'mfa_verify', 'newpass', 'success'
  const [mfaCode, setMfaCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [passStrength, setPassStrength] = useState(0);

  // ── 1. Verificar si el usuario necesita MFA ──
  useEffect(() => {
    const checkMfaRequirement = async () => {
      try {
        const { data, error: factorsError } = await authService.listMfaFactors();
        // Si hay factores verificados, necesitamos autenticar AAL2
        if (data?.all?.some(f => f.status === 'verified')) {
          setStep('mfa_verify');
        } else {
          setStep('newpass');
        }
      } catch (err) {
        setStep('newpass'); // Fallback por si acaso
      }
    };
    checkMfaRequirement();
  }, []);

  const calcStrength = (val) => {
    let score = 0;
    if (val.length >= 8) score += 1;
    if (/[A-Z]/.test(val)) score += 1;
    if (/[0-9]/.test(val)) score += 1;
    if (/[^A-Za-z0-9]/.test(val)) score += 1;
    setPassStrength(score);
  };

  // ── 2. Manejar Verificación MFA ──
  const handleVerifyMfa = async () => {
    if (mfaCode.length !== 6) return;
    setLoading(true);
    setError(null);

    try {
      const { data: factorsData } = await authService.listMfaFactors();
      const factor = factorsData?.all?.find(f => f.status === 'verified');
      
      const { data: challengeData, error: challengeError } = await authService.mfaChallenge(factor.id);
      if (challengeError) throw challengeError;

      const { error: verifyError } = await authService.mfaVerify(factor.id, challengeData.id, mfaCode);
      if (verifyError) throw verifyError;

      setStep('newpass');
    } catch (err) {
      setError('Código inválido o expirado');
    } finally {
      setLoading(false);
    }
  };

  // ── 3. Guardar nueva contraseña ──
  const handleSave = async () => {
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
      setError('Error: ' + updateError.message);
      setLoading(false);
      return;
    }

    setStep('success');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-4 font-['Nunito',sans-serif]" 
      style={{
        backgroundImage: 'radial-gradient(#0f172a 2px, transparent 2px)',
        backgroundSize: '35px 35px',
        backgroundPosition: '0 0',
      }}
    >
      <div className="bg-white border-[6px] border-black rounded-[3.5rem] shadow-[15px_15px_0px_0px_black] w-full max-w-lg p-10 md:p-14 animate-in zoom-in-95 duration-500">

        {step === 'loading' && (
          <div className="flex flex-col items-center py-10">
            <Loader2 size={40} className="animate-spin text-[var(--primary)]" />
            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Verificando seguridad...</p>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* PASO: VERIFICAR MFA                                                */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {step === 'mfa_verify' && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-[2rem] border-[4px] border-black flex items-center justify-center mx-auto mb-6 rotate-3 shadow-[6px_6px_0px_0px_black]">
                <Smartphone size={36} strokeWidth={3} />
              </div>
              <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-2">Seguridad <span className="text-amber-600">Extra</span></h2>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-relaxed">
                Tu cuenta tiene Doble Factor. Ingresa el código de tu App para continuar.
              </p>
            </div>
            
            <PopInput 
              label="Código de 6 dígitos" 
              icon={Smartphone} 
              placeholder="000 000" 
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />

            {error && (
              <div className="bg-rose-100 border-2 border-black p-3 rounded-xl text-[9px] font-black text-rose-600 uppercase text-center">
                {error}
              </div>
            )}

            <PopButton onClick={handleVerifyMfa} variant="secondary" icon={loading ? Loader2 : ShieldCheck} disabled={loading || mfaCode.length < 6}>
              {loading ? 'Verificando...' : 'Verificar y Continuar'}
            </PopButton>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* PASO: NUEVA CONTRASEÑA                                             */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {step === 'newpass' && (
          <>
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-[#8b5cf6] text-white rounded-[2rem] border-[4px] border-black flex items-center justify-center mx-auto mb-6 -rotate-3 shadow-[6px_6px_0px_0px_black]">
                <Lock size={36} strokeWidth={3} />
              </div>
              <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-2">
                Nueva <span className="text-[#8b5cf6]">Contraseña</span>
              </h2>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-relaxed">
                Elige una nueva contraseña segura para tu cuenta
              </p>
            </div>

            <div className="space-y-6">
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
                <div className="flex gap-2 px-2 mb-2">
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
                <div className="bg-rose-100 border-2 border-black p-3 rounded-xl text-[9px] font-black text-rose-600 uppercase text-center">
                  {error}
                </div>
              )}

              <PopButton
                onClick={handleSave}
                variant="primary"
                icon={loading ? Loader2 : ArrowRight}
                disabled={loading || !newPassword || !confirmPassword}
              >
                {loading ? 'Guardando...' : 'Guardar Nueva Contraseña'}
              </PopButton>
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* PASO: ÉXITO                                                        */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {step === 'success' && (
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-emerald-500 text-white rounded-[2rem] border-[4px] border-black flex items-center justify-center mx-auto mb-6 -rotate-3 shadow-[6px_6px_0px_0px_black]">
              <ShieldCheck size={36} strokeWidth={3} />
            </div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4">
              ¡Contraseña <span className="text-emerald-500">Actualizada!</span>
            </h2>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-relaxed mb-8">
              Tu nueva contraseña ha sido guardada con éxito. Ahora puedes iniciar sesión con tu nueva clave.
            </p>
            <PopButton onClick={onComplete} variant="primary" icon={ArrowRight}>
              Ir al Inicio de Sesión
            </PopButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordFromEmail;
