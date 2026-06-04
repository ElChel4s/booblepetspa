import { createContext, useState, useContext, useCallback } from 'react';
import PropTypes from 'prop-types';
import { X, CheckCircle2, AlertOctagon, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Map type to neo-brutalist styles
  const getToastStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-[#4ade80]', // Vibrant lime/green
          text: 'text-black',
          icon: <CheckCircle2 className="w-5 h-5 shrink-0 stroke-[3]" />,
        };
      case 'error':
        return {
          bg: 'bg-[#f43f5e]', // Vibrant pink/rose
          text: 'text-white',
          icon: <AlertOctagon className="w-5 h-5 shrink-0 stroke-[3]" />,
        };
      case 'warning':
        return {
          bg: 'bg-[#fbbf24]', // Vibrant amber/yellow
          text: 'text-black',
          icon: <AlertTriangle className="w-5 h-5 shrink-0 stroke-[3]" />,
        };
      case 'info':
      default:
        return {
          bg: 'bg-[#38bdf8]', // Vibrant sky/blue
          text: 'text-black',
          icon: <Info className="w-5 h-5 shrink-0 stroke-[3]" />,
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Floating container for Toasts */}
      <div className="fixed top-6 right-6 z-[99999] flex flex-col gap-4 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const styles = getToastStyles(toast.type);
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 p-4 border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${styles.bg} ${styles.text} transition-all duration-300 transform translate-x-0 animate-in slide-in-from-right-10 duration-200`}
              role="alert"
            >
              <div className="flex items-center gap-3">
                {styles.icon}
                <span className="font-extrabold text-sm uppercase tracking-tight leading-snug">
                  {toast.message}
                </span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 hover:bg-black/10 border border-transparent hover:border-black rounded transition-all shrink-0"
                aria-label="Cerrar notificación"
              >
                <X className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de un ToastProvider');
  }
  return context;
};
