import { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from './AuthContext';
import { canAccess, getDefaultModule } from '../utils/rbac';

/**
 * NavigationContext — Módulo activo de la aplicación con persistencia.
 */
const NavigationContext = createContext();

export const NavigationProvider = ({ children }) => {
  const { rolActual } = useAuth();
  const storageKey = useMemo(() => `activeModule:${rolActual || 'guest'}`, [rolActual]);

  const [activeModule, setActiveModuleState] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved && canAccess(rolActual, saved)) {
      return saved;
    }
    return getDefaultModule(rolActual);
  });

  // Sincronizar activeModule inmediatamente durante el render al cambiar de rol
  const [prevRol, setPrevRol] = useState(rolActual);
  if (rolActual !== prevRol) {
    setPrevRol(rolActual);
    const savedModule = localStorage.getItem(storageKey);
    const nextModule = savedModule && canAccess(rolActual, savedModule)
      ? savedModule
      : getDefaultModule(rolActual);
    if (nextModule !== activeModule) {
      setActiveModuleState(nextModule);
    }
  }

  const setActiveModule = useCallback((module) => {
    setActiveModuleState(module);
    localStorage.setItem(storageKey, module);
  }, [storageKey]);

  useEffect(() => {
    if (!rolActual) return;
    const savedModule = localStorage.getItem(storageKey);
    const nextModule = savedModule && canAccess(rolActual, savedModule)
      ? savedModule
      : getDefaultModule(rolActual);

    if (nextModule !== activeModule) {
      setActiveModuleState(nextModule);
    }
  }, [rolActual, storageKey, activeModule]);

  const providerValue = useMemo(() => ({ activeModule, setActiveModule }), [activeModule, setActiveModule]);

  return (
    <NavigationContext.Provider value={providerValue}>
      {children}
    </NavigationContext.Provider>
  );
};

NavigationProvider.propTypes = {
  children: PropTypes.node,
};

export const useNavigation = () => useContext(NavigationContext);

