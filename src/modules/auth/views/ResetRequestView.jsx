import React, { useState } from 'react';
import { Mail, ArrowRight, ChevronLeft, CheckCircle, Loader2 } from 'lucide-react';
import PopInput from '../components/PopInput';
import PopButton from '../components/PopButton';
import * as authService from '../services/authService';

const ResetRequestView = ({ setView }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  const handleSendReset = async () => {
    if (!email) return;
    setLoading(true);
    setError(null);

    const { error: resetError } = await authService.sendPasswordResetEmail(email);

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20 animate-in fade-in zoom-in-95 duration-500">
      <header className="flex items-center gap-4 mb-10">
        <button onClick={() => setView('login')} className="p-3 bg-white border-2 border-black rounded-xl hover:bg-slate-50"><ChevronLeft size={20} strokeWidth={3} /></button>
        <h2 className="text-3xl font-black italic uppercase tracking-tighter">Recuperar <span className="text-[var(--primary)]">Acceso</span></h2>
      </header>
      <div className="bg-white border-[4px] border-black p-8 rounded-[3rem] shadow-[12px_12px_0px_0px_black]">
        {!sent ? (
          <>
            <div className="bg-amber-100 text-amber-700 p-4 rounded-2xl border-2 border-amber-300 text-[10px] font-black uppercase mb-8 leading-relaxed">
              Ingresa tu correo y te enviaremos un enlace para reiniciar tu contraseña.
            </div>
            <PopInput 
              label="Correo Registrado" 
              icon={Mail} 
              placeholder="usuario@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
            />
            {error && (
              <div className="bg-rose-100 border-2 border-black p-2 rounded-xl text-[9px] font-black text-rose-600 uppercase text-center mb-4">
                {error}
              </div>
            )}
            <PopButton 
              variant="dark" 
              icon={loading ? Loader2 : ArrowRight} 
              onClick={handleSendReset}
              disabled={loading || !email}
            >
              {loading ? 'Enviando...' : 'Enviar Instrucciones'}
            </PopButton>
          </>
        ) : (
          <div className="text-center py-4 space-y-6">
            <div className="w-16 h-16 bg-emerald-500 text-white rounded-[1.5rem] border-[3px] border-black flex items-center justify-center mx-auto -rotate-3 shadow-[4px_4px_0px_0px_black]">
              <CheckCircle size={30} strokeWidth={3} />
            </div>
            <h3 className="text-xl font-black italic uppercase tracking-tighter">¡Correo Enviado!</h3>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-relaxed">
              Hemos enviado un enlace de recuperación a <span className="text-black">{email}</span>. Revisa tu bandeja de entrada.
            </p>
            <PopButton variant="outline" onClick={() => setView('login')}>
              Volver al Login
            </PopButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetRequestView;
