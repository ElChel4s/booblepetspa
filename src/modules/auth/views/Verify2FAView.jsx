import React, { useState } from 'react';
import { Smartphone, ArrowRight, Key, Loader2 } from 'lucide-react';
import PopInput from '../components/PopInput';
import PopButton from '../components/PopButton';
import { useAuth } from '../../../store/AuthContext';

const Verify2FAView = ({ onValidate }) => {
  const { verifyMfaCode } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleVerify = async () => {
    if (code.length < 6) return;
    setLoading(true);
    setError(null);
    
    const { error: verifyError } = await verifyMfaCode(code);
    
    if (verifyError) {
      setError("Código incorrecto o expirado");
      setLoading(false);
    } else {
      // Si onValidate está definido (usado en AuthApp), lo llamamos
      if (onValidate) onValidate();
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20 animate-in fade-in zoom-in-95 duration-500 text-center">
      <div className="w-24 h-24 bg-black text-white border-[4px] border-[var(--secondary)] rounded-[2rem] shadow-[8px_8px_0px_0px_var(--secondary)] flex items-center justify-center mx-auto mb-8 -rotate-3">
        <Smartphone size={40} strokeWidth={3} />
      </div>
      <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-4">Paso <span className="text-[var(--secondary)]">Seguro</span></h2>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-10 leading-relaxed px-4">
        Abre tu app autenticadora e ingresa el código generado para continuar.
      </p>
      <div className="bg-white border-[5px] border-black p-8 rounded-[3rem] shadow-[15px_15px_0px_0px_black]">
        {error && (
          <div className="bg-rose-100 border-2 border-black p-2 rounded-xl text-[9px] font-black text-rose-600 uppercase mb-4">
            {error}
          </div>
        )}
        <PopInput 
          label="Autenticador 2FA" 
          icon={Key} 
          placeholder="123456" 
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={6}
          className="text-center text-2xl tracking-[0.3em]"
        />
        <PopButton 
          onClick={handleVerify} 
          variant="secondary" 
          icon={loading ? Loader2 : ArrowRight}
          disabled={loading || code.length < 6}
        >
          {loading ? 'Verificando...' : 'Validar Acceso'}
        </PopButton>
      </div>
    </div>
  );
};

export default Verify2FAView;
