import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import PopInput from './PopInput';
import PopButton from './PopButton';
import { useAuth } from '../../../store/AuthContext';
import { signInWithGoogle } from '../services/authService';
import InactiveAccountModal from './InactiveAccountModal';
import { supabase } from '../../../api/supabase';
import PwaInstallButton from '../../../components/common/PwaInstallButton';

const LoginForm = ({ setView }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInactiveModalOpen, setIsInactiveModalOpen] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const { user, error: loginError, mfaRequired } = await login(email, password);
      if (loginError) {
        if (loginError.message === 'USER_INACTIVE') {
          setIsInactiveModalOpen(true);
        } else {
          setError(loginError.message || 'Error al iniciar sesión');
          
          // Lógica de bloqueo por intentos
          const key = `intentos_${email}`;
          const currentAttempts = parseInt(localStorage.getItem(key) || '0', 10);
          const newAttempts = currentAttempts + 1;
          localStorage.setItem(key, newAttempts.toString());
          console.log(`[Intentos] Email: ${email}, Contador: ${newAttempts}`);

          if (newAttempts >= 5) {
            console.log(`[Intentos] Límite alcanzado para ${email}. Bloqueando...`);
            setError('Cuenta bloqueada por demasiados intentos fallidos.');
            localStorage.removeItem(key); // Resetear
            
            // Llamar a la función de la base de datos (RPC) para saltar RLS
            const { error: rpcError } = await supabase.rpc('deactivate_user_by_email', { email_param: email });
            console.log(`[Intentos] Respuesta de bloqueo DB:`, rpcError);
            
            setIsInactiveModalOpen(true); // Mostrar modal de inactivo
          }
        }
      } else {
        localStorage.removeItem(`intentos_${email}`); // Limpiar si es exitoso
        if (mfaRequired) {
          setView('verify_2fa');
        }
      }
    } catch (err) {
      setError('Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error: googleError } = await signInWithGoogle();
      if (googleError) setError(googleError.message);
    } catch (err) {
      setError('Error al conectar con Google');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white border-[5px] border-black p-10 rounded-[3.5rem] shadow-[15px_15px_0px_0px_black] relative">
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white px-8 py-2 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl">Acceso Seguro</div>
        <h2 className="text-4xl font-black uppercase italic mb-6 mt-6 text-center">¡Bienvenido!</h2>
        
        <div className="flex justify-center mb-8">
          <PwaInstallButton />
        </div>

        {error && (
          <div className="bg-rose-100 border-2 border-black p-3 rounded-2xl mb-6 text-[10px] font-black uppercase text-rose-600 text-center">
            {error}
          </div>
        )}

        <PopInput 
          label="Email de Usuario" 
          icon={Mail} 
          placeholder="hola@bubblepet.com" 
          value={email}
          onChange={(e) => setEmail(e.target.value)} 
        />
        <PopInput 
          label="Contraseña" 
          icon={Lock} 
          type="password" 
          placeholder="••••••••" 
          value={password}
          onChange={(e) => setPassword(e.target.value)} 
        />

        <div className="flex justify-between items-center mb-10 px-2">
          <button onClick={() => setView('reset_request')} className="text-[10px] font-black uppercase text-[var(--primary)] hover:underline">¿Clave olvidada?</button>
        </div>

        <PopButton 
          onClick={handleSubmit} 
          icon={loading ? Loader2 : ArrowRight}
          disabled={loading}
          className="mb-4"
        >
          {loading ? 'Validando...' : 'Iniciar Sesión'}
        </PopButton>

        <div className="flex items-center gap-4 my-6">
          <div className="h-px flex-1 bg-slate-200"></div>
          <span className="text-[9px] font-black uppercase text-slate-400">O ingresa con</span>
          <div className="h-px flex-1 bg-slate-200"></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="w-full py-4 border-[3px] border-black rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors shadow-[4px_4px_0px_0px_black] active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
          Continuar con Google
        </button>

        <div className="mt-10 pt-10 border-t-4 border-dashed border-slate-100 text-center">
          <p className="text-[10px] font-black uppercase text-slate-400 mb-6">¿Eres un cliente nuevo?</p>
          <PopButton variant="outline" onClick={() => setView('register')}>Crear Cuenta Cliente</PopButton>
        </div>
      </div>

      <InactiveAccountModal 
        isOpen={isInactiveModalOpen} 
        onClose={() => setIsInactiveModalOpen(false)} 
      />
    </div>
  );
};

export default LoginForm;
