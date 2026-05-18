import React, { useState } from 'react';
import { Mail, Key, ShieldCheck, Loader2, ArrowLeft } from 'lucide-react';
import PopInput from '../components/PopInput';
import PopButton from '../components/PopButton';
import * as authService from '../services/authService';
import { useAuth } from '../../../store/AuthContext';

const VerifyEmailView = ({ setView, emailForVerification }) => {
  const { setIsAuthenticated, setCurrentUser, setRolActual } = useAuth();
  const [code, setCode] = useState('');
  const [email, setEmail] = useState(emailForVerification || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleVerify = async () => {
    if (!code || code.length < 6) {
      setError('El código debe tener 6 dígitos');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { error: verifyError } = await authService.verifyEmailCode(email, code);
      if (verifyError) {
        setError(verifyError.message);
      } else {
        setSuccess(true);
        
        // Al estar verificado, obtenemos el perfil completo para iniciar sesión automáticamente
        const { user, error: userError } = await authService.getCurrentUser();
        
        if (user) {
          setCurrentUser(user);
          setRolActual(user.rol || 'cliente');
          
          // Damos un pequeño respiro para mostrar el mensaje de éxito antes de cambiar a la App principal
          setTimeout(() => {
            setIsAuthenticated(true);
          }, 2000);
        } else {
          setError('Email verificado, pero hubo un problema al cargar tu perfil. Por favor intenta iniciar sesión.');
          setTimeout(() => setView('login'), 3000);
        }
      }
    } catch (err) {
      setError('Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    const { error: resendError } = await authService.resendOtp(email);
    if (resendError) {
      setError(resendError.message);
    } else {
      alert('¡Código reenviado! Revisa tu correo.');
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-emerald-500 text-white border-[4px] border-black rounded-[2rem] shadow-[8px_8px_0px_0px_black] flex items-center justify-center mx-auto mb-8 rotate-3">
          <ShieldCheck size={40} strokeWidth={3} />
        </div>
        <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-4">¡Verificado!</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
          Tu cuenta está lista. Redirigiendo...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-20 animate-in fade-in zoom-in-95 duration-500 text-center">
      <div className="w-24 h-24 bg-[var(--primary)] text-white border-[4px] border-black rounded-[2rem] shadow-[8px_8px_0px_0px_black] flex items-center justify-center mx-auto mb-8 rotate-3">
        <Mail size={40} strokeWidth={3} />
      </div>
      <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-4">Confirma tu <span className="text-[var(--primary)]">Email</span></h2>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-10 leading-relaxed px-4">
        Ingresa el código enviado a <span className="text-black">{email}</span>
      </p>
      
      <div className="bg-white border-[5px] border-black p-8 rounded-[3rem] shadow-[15px_15px_0px_0px_black]">
        {error && (
          <div className="bg-rose-100 border-2 border-black p-3 rounded-2xl mb-6 text-[10px] font-black uppercase text-rose-600">
            {error}
          </div>
        )}

        {!emailForVerification && (
          <PopInput 
            label="Email" 
            icon={Mail} 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="tu@email.com"
          />
        )}

        <PopInput 
          label="Código" 
          icon={Key} 
          placeholder="000000" 
          value={code}
          onChange={(e) => setCode(e.target.value)} 
        />
        
        <PopButton 
          onClick={handleVerify} 
          variant="dark" 
          icon={loading ? Loader2 : ShieldCheck}
          disabled={loading}
        >
          {loading ? 'Verificando...' : 'Confirmar'}
        </PopButton>

        <div className="mt-8 flex flex-col gap-4">
          <button onClick={handleResend} className="text-[9px] font-black uppercase text-slate-400 hover:text-black transition-colors">
            Reenviar Código
          </button>
          <button 
            onClick={() => setView('login')}
            className="flex items-center justify-center gap-2 text-[9px] font-black uppercase text-slate-400 hover:text-[var(--primary)] transition-colors"
          >
            <ArrowLeft size={12} strokeWidth={3} /> Volver al Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailView;
