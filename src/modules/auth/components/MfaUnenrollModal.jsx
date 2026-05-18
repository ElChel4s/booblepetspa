import React, { useState } from 'react';
import { ShieldOff, Smartphone, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import PopModal from './PopModal';
import PopInput from './PopInput';
import PopButton from './PopButton';
import { useAuth } from '../../../store/AuthContext';
import * as authService from '../services/authService';

/**
 * MfaUnenrollModal — Modal para desactivar el Doble Factor con seguridad.
 */
const MfaUnenrollModal = ({ isOpen, onClose }) => {
  const { unenrollMFA } = useAuth();
  const [step, setStep] = useState('verify'); // 'verify', 'success'
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleClose = () => {
    setStep('verify');
    setCode('');
    setError(null);
    setLoading(false);
    onClose();
  };

  const handleUnenroll = async () => {
    if (code.length !== 6) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Primero verificamos que el código sea correcto mediante un desafío
      const { data: factorsData } = await authService.listMfaFactors();
      const factor = factorsData?.all?.find(f => f.status === 'verified');
      
      if (!factor) throw new Error("No se encontró un factor activo");

      const { data: challengeData, error: challengeError } = await authService.mfaChallenge(factor.id);
      if (challengeError) throw challengeError;

      const { error: verifyError } = await authService.mfaVerify(factor.id, challengeData.id, code);
      if (verifyError) {
        setError("Código incorrecto. Inténtalo de nuevo.");
        setLoading(false);
        return;
      }

      // 2. Si el código es correcto, procedemos a desvincular todo
      const { error: unenrollError } = await unenrollMFA();
      if (unenrollError) throw unenrollError;

      setStep('success');
    } catch (err) {
      console.error("[MFA Unenroll Error]:", err);
      setError(err.message || "Error al desactivar el 2FA");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <PopModal isOpen={isOpen} onClose={handleClose} title="Desactivar 2FA" isDanger={true}>
      
      {step === 'verify' && (
        <div className="space-y-6">
          <div className="bg-rose-50 border-2 border-rose-200 p-4 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="text-rose-600 shrink-0 mt-1" size={18} />
            <p className="text-[10px] font-black uppercase text-rose-600 leading-relaxed">
              Estás a punto de desactivar la protección de Doble Factor. Tu cuenta será menos segura. Ingresa tu código actual para confirmar.
            </p>
          </div>

          <PopInput 
            label="Código de Autenticador" 
            icon={Smartphone} 
            placeholder="000 000" 
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />

          {error && (
            <div className="bg-rose-100 border-2 border-black p-2 rounded-xl text-[9px] font-black text-rose-600 uppercase text-center">
              {error}
            </div>
          )}

          <PopButton 
            onClick={handleUnenroll} 
            variant="danger" 
            icon={loading ? Loader2 : ShieldOff} 
            disabled={loading || code.length < 6}
          >
            {loading ? 'Procesando...' : 'Desactivar Seguridad'}
          </PopButton>

          <button onClick={handleClose} className="w-full text-[9px] font-black uppercase text-slate-400 hover:text-black tracking-widest py-2">
            Cancelar y mantener activado
          </button>
        </div>
      )}

      {step === 'success' && (
        <div className="text-center py-6 space-y-6">
          <div className="w-20 h-20 bg-emerald-500 text-white rounded-[2rem] border-[4px] border-black flex items-center justify-center mx-auto -rotate-3 shadow-[6px_6px_0px_0px_black]">
            <CheckCircle size={36} strokeWidth={3} />
          </div>
          <h3 className="text-2xl font-black italic uppercase tracking-tighter">¡2FA Desactivado!</h3>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-relaxed">
            Hemos desactivado correctamente el Doble Factor de tu cuenta.
          </p>
          <PopButton onClick={handleClose} variant="primary">
            Entendido
          </PopButton>
        </div>
      )}

    </PopModal>
  );
};

export default MfaUnenrollModal;
