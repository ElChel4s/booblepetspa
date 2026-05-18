import { createContext, useState, useContext, useEffect } from 'react';
import { IS_REAL_AUTH } from '../config';
import { mockUsers, mockPets } from '../utils/data';
import * as authService from '../modules/auth/services/authService';
import * as profilesService from '../services/profilesService';
import * as sessionsService from '../modules/auth/services/sessionsService';
import * as logsService from '../modules/auth/services/logsService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [rolActual, setRolActual] = useState('recepcion');
  const [isAuthenticated, setIsAuthenticated] = useState(!IS_REAL_AUTH);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(IS_REAL_AUTH);
  const [petCount, setPetCount] = useState(0);
  const [profileMode, setProfileMode] = useState('self');
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        if (IS_REAL_AUTH) {
          const { user, error } = await authService.getCurrentUser();
          
          if (error || !user) {
             // Si hay un error de sesión (como 403), limpiamos el estado local
             if (error?.status === 403 || error?.message?.includes('403')) {
                await authService.logout();
                setCurrentUser(null);
                setIsAuthenticated(false);
             }
             setLoading(false);
             return;
          }

          if (user) {
            // Limpiar el hash de la URL si existe (evita errores 403 en recargas posteriores)
            if (window.location.hash) {
              window.history.replaceState(null, null, window.location.pathname);
            }

            // Bloquear si está inactivo
            if (user.activo === false) {
              await authService.logout();
              setCurrentUser(null);
              setIsAuthenticated(false);
            } else if (user.user_metadata?.clave_modificada === false) {
              const createdAt = new Date(user.created_at);
              const now = new Date();
              const diffMins = (now - createdAt) / (1000 * 60);

              if (diffMins > 30) {
                // Desactivar cuenta
                await profilesService.toggleUserStatus(user.id, false);
                await authService.logout();
                setCurrentUser(null);
                setIsAuthenticated(false);
              } else {
                // Forzar cambio de clave
                setMustChangePassword(true);
                setCurrentUser(user);
                setIsAuthenticated(true);
                setRolActual(user.rol || 'cliente');
                sessionsService.registerCurrentSession(user.id);
              }
            } else {
              setCurrentUser(user);
              setIsAuthenticated(true);
              setRolActual(user.rol || 'cliente');
              // Registrar sesión real en la DB
              sessionsService.registerCurrentSession(user.id);
            }
          }
          setLoading(false);
        }
      } catch (err) {
        console.error("[Auth] Error al inicializar:", err);
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (!IS_REAL_AUTH) {
      const user = mockUsers.find((u) => u.rol === rolActual) || mockUsers[0] || null;
      setCurrentUser(user);
      if (user?.id) {
        setPetCount(mockPets.filter((p) => p.owner_id === user.id).length);
      }
    }
  }, [rolActual]);

  const login = async (email, password) => {
    const { user, error } = await authService.login(email, password);
    
    if (user) {
      // ── VALIDACIÓN DE CUENTA ACTIVA ──
      if (user.activo === false) {
        await authService.logout();
        return { user: null, error: { message: 'USER_INACTIVE' } };
      }

      // Validar si es nueva cuenta y pasaron 30 min
      if (user.user_metadata?.clave_modificada === false) {
        const createdAt = new Date(user.created_at);
        const now = new Date();
        const diffMins = (now - createdAt) / (1000 * 60);

        if (diffMins > 30) {
          await profilesService.toggleUserStatus(user.id, false);
          await authService.logout();
          return { user: null, error: { message: 'USER_INACTIVE_EXPIRED' } };
        } else {
          setMustChangePassword(true);
        }
      }

      setCurrentUser(user);
      
      // Registrar sesión real
      sessionsService.registerCurrentSession(user.id);

      // Registrar en LOG Auditoría
      logsService.registerLog(user.id, user.rol, "INICIO DE SESIÓN");
      
      // Si el usuario tiene MFA activado, NO lo marcamos como autenticado todavía
      if (user.mfa_activado) {
        return { user, mfaRequired: true };
      }

      setIsAuthenticated(true);
      setRolActual(user.rol || 'cliente');
    }
    return { user, error };
  };

  const verifyMfaCode = async (code) => {
    try {
      // 1. Obtener los factores del usuario actual
      const { data: factorsData, error: factorsError } = await authService.listMfaFactors();
      if (factorsError) throw factorsError;
      
      const totpFactor = factorsData?.all?.find(f => f.status === 'verified');
      if (!totpFactor) throw new Error("No se encontró un factor de autenticación verificado");

      // 2. Crear el desafío
      const { data: challengeData, error: challengeError } = await authService.mfaChallenge(totpFactor.id);
      if (challengeError) throw challengeError;

      // 3. Verificar el código
      const { error: verifyError } = await authService.mfaVerify(totpFactor.id, challengeData.id, code);
      if (verifyError) throw verifyError;

      // 4. Si todo bien, ahora sí estamos autenticados al 100%
      setIsAuthenticated(true);
      setRolActual(currentUser?.rol || 'cliente');
      return { success: true };
    } catch (err) {
      console.error("[MFA Verify Error]:", err);
      return { error: err };
    }
  };


  const logout = async () => {
    if (currentUser) {
      logsService.registerLog(currentUser.id, rolActual, "CIERRE DE SESIÓN");
    }
    await authService.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
    if (!IS_REAL_AUTH) setRolActual('recepcion');
  };

  const updateProfile = async (updates, userId = null) => {
    const targetId = userId || currentUser?.id;
    if (!targetId) return { error: new Error('No se especificó un ID de usuario') };
    
    if (IS_REAL_AUTH) {
      const { error } = await profilesService.updateProfile(targetId, {
        ...updates
      });
      if (error) return { error };
    }
    
    // Solo actualizamos el estado local de currentUser si el ID coincide
    if (targetId === currentUser?.id) {
      setCurrentUser(prev => ({ ...prev, ...updates }));
    }
    return { error: null };
  };

  // ── LÓGICA DE CIERRE POR INACTIVIDAD (30 MIN) ──
  useEffect(() => {
    if (!isAuthenticated) return;

    let timeoutId;
    const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutos

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log("Sesión cerrada por inactividad");
        logout();
      }, INACTIVITY_LIMIT);
    };

    // Eventos que cuentan como "actividad"
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(name => document.addEventListener(name, resetTimer));

    resetTimer(); // Iniciar el primer timer

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(name => document.removeEventListener(name, resetTimer));
    };
  }, [isAuthenticated]);
  const unenrollMFA = async () => {
    if (!IS_REAL_AUTH) {
      return await updateProfile({ mfa_activado: false });
    }
    
    const { data: factors, error: listError } = await authService.listMfaFactors();
    if (listError) return { error: listError };
    
    if (factors && factors.all && factors.all.length > 0) {
      for (const factor of factors.all) {
        await authService.unenrollMfaFactor(factor.id);
      }
    }
    
    return await updateProfile({ mfa_activado: false });
  };


  const openSelfProfile = () => setProfileMode('self');
  const openDirectory = () => setProfileMode('directory');

  return (
    <AuthContext.Provider value={{
      rolActual,
      setRolActual,
      isAuthenticated,
      setIsAuthenticated,
      currentUser,
      loading,
      petCount,
      profileMode,
      setProfileMode,
      mustChangePassword,
      setMustChangePassword,
      openSelfProfile,
      openDirectory,
      login,
      logout,
      updateProfile,
      unenrollMFA,
      verifyMfaCode
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
