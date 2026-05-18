import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Smartphone, ShieldCheck, Loader2, X, AlertTriangle } from 'lucide-react';
import { supabase } from '../../../api/supabase';
import PopModal from './PopModal';
import PopButton from './PopButton';
import PopInput from './PopInput';
import { useAuth } from '../../../store/AuthContext';
import * as authService from '../services/authService';

const MfaEnrollModal = ({ isOpen, onClose }) => {
  const { updateProfile, currentUser } = useAuth();
  const [step, setStep] = useState('loading'); // 'loading', 'initial', 'verify_existing', 'scanning', 'success'
  const [factorId, setFactorId] = useState(null);
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState('');
  const [verifyExistingCode, setVerifyExistingCode] = useState('');
  const [error, setError] = useState(null);

  // 1. Verificar si ya tiene factores antes de empezar
  React.useEffect(() => {
    if (isOpen) {
      checkExistingFactors();
    }
  }, [isOpen]);

  const checkExistingFactors = async () => {
    setStep('loading');
    const { data, error: listError } = await authService.listMfaFactors();
    
    if (listError) {
      console.error("[MFA] Error al listar factores:", listError);
      setStep('initial');
      return;
    }

    const verifiedFactor = data?.all?.find(f => f.status === 'verified');
    if (verifiedFactor) {
      // Si ya tiene uno, necesitamos verificarlo primero (AAL2) para poder agregar otro
      setStep('verify_existing');
    } else {
      // Si no tiene ninguno verificado, procedemos normal
      setStep('initial');
      startEnrollment();
    }
  };

  const handleVerifyExisting = async () => {
    if (verifyExistingCode.length !== 6) return;
    setLoading(true);
    setError(null);

    try {
      const { data: factorsData } = await authService.listMfaFactors();
      const factor = factorsData?.all?.find(f => f.status === 'verified');
      
      const { data: challengeData, error: challengeError } = await authService.mfaChallenge(factor.id);
      if (challengeError) throw challengeError;

      const { error: verifyError } = await authService.mfaVerify(factor.id, challengeData.id, verifyExistingCode);
      if (verifyError) throw verifyError;

      // Una vez verificado (somos AAL2), ya podemos enrolar el nuevo
      setStep('initial');
      await startEnrollment();
    } catch (err) {
      setError("Código incorrecto o sesión expirada");
    } finally {
      setLoading(false);
    }
  };

  const startEnrollment = async () => {
    // Si ya estamos en proceso o cargando, no duplicar
    if (loading && step === 'loading') return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Usamos un nombre único con la hora actual para evitar el error de "ya existe"
      const now = new Date();
      const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
      const uniqueName = `Mi Dispositivo (${timeStr})`;

      console.log(`[MFA] Iniciando enrolamiento con nombre: ${uniqueName}`);
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'Bubble Pet Spa',
        friendlyName: uniqueName
      });

      if (enrollError) throw enrollError;

      console.log("[MFA] QR Generado con éxito");
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setStep('scanning');
    } catch (err) {
      console.error("[MFA] Error crítico:", err);
      setError("Error: " + (err.message || "No se pudo generar el QR"));
    } finally {
      setLoading(false);
    }
  };

  // El useEffect de checkExistingFactors maneja el arranque inicial

  const verifyAndActivate = async () => {
    if (code.length < 6) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Crear el challenge y verificar el código
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code
      });

      if (verifyError) throw verifyError;

      // 2. Si todo sale bien, actualizamos el perfil en nuestra tabla
      await updateProfile({ mfa_activado: true });
      
      setStep('success');
    } catch (err) {
      setError('Código inválido o error en la verificación');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <PopModal isOpen={isOpen} onClose={onClose} title="Configurar Doble Factor">
      <div className="p-2">
        {step === 'loading' && (
          <div className="flex flex-col items-center py-12">
            <Loader2 size={40} className="animate-spin text-[var(--primary)] mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verificando Seguridad...</p>
          </div>
        )}

        {step === 'verify_existing' && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-[2rem] border-[4px] border-black flex items-center justify-center mx-auto mb-6 rotate-3 shadow-[6px_6px_0px_0px_black]">
                <ShieldCheck size={36} strokeWidth={3} />
              </div>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-2">Verifica tu <span className="text-amber-600">MFA Actual</span></h3>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-relaxed">
                Para agregar un nuevo dispositivo, primero necesitamos confirmar tu identidad con tu código actual.
              </p>
            </div>

            <div className="space-y-4">
              <PopInput 
                label="Código de 6 dígitos" 
                icon={Smartphone} 
                placeholder="000 000" 
                value={verifyExistingCode}
                onChange={(e) => setVerifyExistingCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />

              {error && (
                <div className="bg-rose-100 border-2 border-black p-2 rounded-xl text-[9px] font-black text-rose-600 uppercase text-center">
                  {error}
                </div>
              )}

              <PopButton onClick={handleVerifyExisting} variant="primary" icon={loading ? Loader2 : ShieldCheck} disabled={loading || verifyExistingCode.length < 6}>
                {loading ? 'Verificando...' : 'Confirmar y Continuar'}
              </PopButton>
            </div>
          </div>
        )}

        {step === 'initial' && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-[2rem] border-[4px] border-black flex items-center justify-center mx-auto rotate-3 shadow-[6px_6px_0px_0px_black]">
              <Smartphone size={40} strokeWidth={3} />
            </div>
            <p className="text-[11px] font-black uppercase text-slate-500 leading-relaxed tracking-wider">
              Añade una capa extra de seguridad a tu cuenta usando una aplicación como Google Authenticator o Authy.
            </p>
            <PopButton onClick={startEnrollment} loading={loading} icon={ShieldCheck} variant="primary">
              Comenzar Configuración
            </PopButton>
          </div>
        )}

        {step === 'scanning' && (
          <div className="space-y-6">
            <div className="bg-slate-50 border-[4px] border-black p-6 rounded-[2.5rem] flex flex-col items-center">
              <p className="text-[10px] font-black uppercase mb-4 text-center">1. Escanea este código QR</p>
              <div className="bg-white p-4 border-[3px] border-black rounded-3xl shadow-[6px_6px_0px_0px_black] mb-2 overflow-hidden">
                {/* Usamos directamente la imagen que nos da Supabase */}
                <img 
                  src={qrCode} 
                  alt="QR Code" 
                  className="w-[180px] h-[180px] object-contain"
                />
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase text-center text-slate-400">2. Ingresa el código de 6 dígitos</p>
              {error && (
                <div className="bg-rose-100 border-2 border-black p-2 rounded-xl text-[9px] font-black text-rose-600 uppercase text-center">
                  {error}
                </div>
              )}
              <PopInput 
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="000 000"
                icon={ShieldCheck}
                className="text-center text-2xl tracking-[0.3em]"
                maxLength={6}
              />
              <PopButton onClick={verifyAndActivate} loading={loading} variant="dark">
                Verificar y Activar
              </PopButton>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center space-y-6 py-4">
            <div className="w-20 h-20 bg-emerald-500 text-white rounded-[2rem] border-[4px] border-black flex items-center justify-center mx-auto -rotate-3 shadow-[6px_6px_0px_0px_black]">
              <ShieldCheck size={40} strokeWidth={3} />
            </div>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter">¡Todo Listo!</h3>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-relaxed">
              El doble factor de autenticación ha sido activado con éxito en tu cuenta.
            </p>
            <PopButton onClick={onClose} variant="primary">
              Cerrar y Continuar
            </PopButton>
          </div>
        )}
      </div>
    </PopModal>
  );
};

export default MfaEnrollModal;
