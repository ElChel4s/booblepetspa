import { useState, useEffect } from 'react';

let globalDeferredPrompt = null;
const listeners = new Set();

const triggerListeners = () => {
  listeners.forEach(listener => listener(globalDeferredPrompt));
};

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDeferredPrompt = e;
    triggerListeners();
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    triggerListeners();
  });
}

export const usePwaInstall = () => {
  const [prompt, setPrompt] = useState(globalDeferredPrompt);

  useEffect(() => {
    const listener = (newPrompt) => {
      setPrompt(newPrompt);
    };
    listeners.add(listener);
    setPrompt(globalDeferredPrompt);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const installApp = async () => {
    if (!prompt) return false;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      globalDeferredPrompt = null;
      triggerListeners();
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!prompt,
    installApp,
  };
};
