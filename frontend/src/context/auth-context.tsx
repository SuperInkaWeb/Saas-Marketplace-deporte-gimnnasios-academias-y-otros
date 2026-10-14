import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import api from '../api/api-client';

// 'ADMIN' es el valor interno del rol; en pantalla se muestra como "Superadmin"
export type Role = 'USER' | 'TRAINER' | 'GYM_OWNER' | 'ADMIN';

export const ROLE_LABELS: Record<Role, string> = {
  USER: 'Atleta',
  TRAINER: 'Coach / Entrenador',
  GYM_OWNER: 'Dueño (Owner)',
  ADMIN: 'Superadmin',
};

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  roles?: string[];
  avatarUrl?: string;
  phone?: string;
  dni?: string;
}

interface LoginOptions {
  allowSignUp?: boolean;
  /** Perfil elegido en el portal (/login). Se valida al volver de Auth0. */
  portalRole?: Role;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (options?: LoginOptions) => void;
  logout: () => void;
  updateUserProfile: (data: { name: string; phone?: string; dni?: string; role?: string }) => Promise<void>;
  switchUserRole: (role: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PORTAL_ROLE_KEY = 'portalRole';

// Contingencia local: si el backend no devolvió 'roles', se calcula en el cliente.
// (Antes estaba repetido en 4 lugares.)
const withRoles = (data: any): User => {
  if (Array.isArray(data.roles) && data.roles.length > 0) return data;
  const roles: string[] = ['USER'];
  if (['ADMIN', 'GYM_OWNER', 'TRAINER'].includes(data.role)) {
    roles.push(data.role);
  }
  return { ...data, roles };
};

const fetchProfile = async (): Promise<User> => {
  const { data } = await api.get('/auth/me', { timeout: 60000 });
  return withRoles(data);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    isAuthenticated,
    user: auth0User,
    getAccessTokenSilently,
    isLoading: auth0Loading,
    loginWithRedirect,
    logout: auth0Logout,
  } = useAuth0();

  const [user, setUser] = useState<User | null>(null);
  const [backendLoading, setBackendLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  /**
   * Compara el perfil elegido en el portal con los roles reales de la cuenta.
   * - Si la cuenta NO tiene ese rol: cierra sesión y vuelve a /login con un error.
   * - Si lo tiene: deja ese rol como activo.
   * Devuelve el perfil a usar, o null si se está cerrando sesión.
   */
  const enforcePortalRole = async (profile: User): Promise<User | null> => {
    const portalRole = sessionStorage.getItem(PORTAL_ROLE_KEY);
    sessionStorage.removeItem(PORTAL_ROLE_KEY);
    if (!portalRole) return profile;

    if (!profile.roles?.includes(portalRole)) {
      setIsLoggingOut(true);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setUser(null);
      // Limpia la sesión local SIN redirigir a Auth0 (no requiere "Allowed Logout URLs")
      try {
        await auth0Logout({ openUrl: false });
      } catch (error) {
        console.error('Error limpiando la sesión local:', error);
      }
      // Vuelve al portal, donde se muestra el error dentro de la página
      window.location.replace(`/login?denied=role_mismatch&role=${portalRole}`);
      return null;
    }

    if (profile.role !== portalRole) {
      try {
        await api.post('/auth/switch-role', { role: portalRole });
        return await fetchProfile();
      } catch (error) {
        console.error('No se pudo activar el perfil elegido:', error);
      }
    }
    return profile;
  };

  useEffect(() => {
    const syncUser = async () => {
      // Si hay un código de Auth0 en la URL, esperamos a que el SDK procese el callback
      const params = new URLSearchParams(window.location.search);
      const hasAuth0Params = params.has('code') || params.has('error') || params.has('state');

      if (auth0Loading || (hasAuth0Params && !isAuthenticated)) {
        return;
      }

      if (isAuthenticated && auth0User) {
        setBackendLoading(true);
        try {
          const token = await getAccessTokenSilently();
          localStorage.setItem('token', token);

          const profile = await fetchProfile();
          const checked = await enforcePortalRole(profile);
          if (!checked) return; // cerrando sesión por perfil incorrecto

          setUser(checked);
        } catch (error: any) {
          console.error('Error sincronizando usuario:', error.response?.data || error.message);
          if (error.response?.status === 401) {
            console.warn('Backend rechazó el token. Verificando configuración...');
          }
          setUser(null);
          localStorage.removeItem('token');
        } finally {
          setBackendLoading(false);
        }
      } else {
        // Sin sesión Auth0 pero con token guardado: intentamos restaurar la sesión del backend
        const token = localStorage.getItem('token');
        if (token) {
          setBackendLoading(true);
          try {
            setUser(await fetchProfile());
          } catch (error: any) {
            console.error('Error al restaurar perfil desde localStorage:', error);
            setUser(null);
            localStorage.removeItem('token');
          } finally {
            setBackendLoading(false);
          }
        } else {
          setUser(null);
          setBackendLoading(false);
        }
      }
    };

    syncUser();
  }, [isAuthenticated, auth0User, getAccessTokenSilently, auth0Loading]);

  const login = async (options?: LoginOptions) => {
    try {
      sessionStorage.setItem('justLoggedIn', 'true');

      // Se guarda el perfil elegido en el portal para validarlo al volver de Auth0
      if (options?.portalRole) {
        sessionStorage.setItem(PORTAL_ROLE_KEY, options.portalRole);
      } else {
        sessionStorage.removeItem(PORTAL_ROLE_KEY);
      }

      await loginWithRedirect({
        authorizationParams: {
          allow_signup: options?.allowSignUp === false ? 'false' : 'true',
          screen_hint: options?.allowSignUp ? 'signup' : 'login',
          // Desde el portal siempre pide credenciales, aunque Auth0 recuerde una sesión anterior
          ...(options?.portalRole ? { prompt: 'login' } : {}),
        },
      });
    } catch (error: any) {
      console.error('Error al redirigir a Auth0:', error);
    }
  };

  const logout = () => {
    setIsLoggingOut(true);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem(PORTAL_ROLE_KEY);
    if (isAuthenticated) {
      auth0Logout({ logoutParams: { returnTo: window.location.origin } });
    } else {
      setUser(null);
      setIsLoggingOut(false);
    }
  };

  const updateUserProfile = async (profileData: { name: string; phone?: string; dni?: string; role?: string }) => {
    try {
      const { data } = await api.patch('/auth/profile', profileData);
      setUser((prev) => (prev ? { ...prev, ...data } : data));
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
      throw error;
    }
  };

  const switchUserRole = async (newRole: string) => {
    try {
      setBackendLoading(true);
      await api.post('/auth/switch-role', { role: newRole });
      setUser(await fetchProfile());
    } catch (error) {
      console.error('Error al cambiar de rol:', error);
      throw error;
    } finally {
      setBackendLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: auth0Loading || (isAuthenticated && backendLoading) || isLoggingOut,
        login,
        logout,
        updateUserProfile,
        switchUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
