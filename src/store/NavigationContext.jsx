import { createContext, useState, useContext, useEffect } from 'react';

/**
 * NavigationContext — Módulo activo de la aplicación con persistencia.
 */
const NavigationContext = createContext();

export const NavigationProvider = ({ children }) => {
  // Inicializar desde localStorage o default 'tienda'
  const [activeModule, setActiveModuleState] = useState(() => {
    return localStorage.getItem('activeModule') || 'tienda';
  });

  const setActiveModule = (module) => {
    setActiveModuleState(module);
    localStorage.setItem('activeModule', module);
  };

  return (
    <NavigationContext.Provider value={{ activeModule, setActiveModule }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => useContext(NavigationContext);

