import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import api from '../api/api-client';
import type { ApiError } from '../types/api';
import { AuthContext, type LoginOptions, type User } from './auth-context';

const PORTAL_ROLE_KEY = 'portalRole';

// Contingencia local: si el backend no devolvió 'roles', se calcula en el cliente.
// (Antes estaba repetido en 4 lugares.)
const withRoles = (data: User): User => {
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
      // El acceso de Superadmin vuelve a su propia URL, sin nombrar el rol
      const returnTo =
        portalRole === 'ADMIN'
          ? `${window.location.origin}/admin?denied=1`
          : `${window.location.origin}/login?denied=role_mismatch&role=${portalRole}`;
      auth0Logout({ logoutParams: { returnTo } });
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
          if (!token) throw new Error('Auth0 no devolvió un token de acceso');
          localStorage.setItem('token', token);

          const profile = await fetchProfile();
          const checked = await enforcePortalRole(profile);
          if (!checked) return; // cerrando sesión por perfil incorrecto

          setUser(checked);
        } catch (error) {
          console.error('Error sincronizando usuario:', (error as ApiError).response?.data || (error as ApiError).message);
          if ((error as ApiError).response?.status === 401) {
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
          } catch (error) {
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
          // Permitir el registro no significa abrir el formulario de registro:
          // ingresar siempre empieza en "Iniciar sesión" salvo que se pida lo contrario.
          screen_hint: options?.screenHint ?? 'login',
        },
      });
    } catch (error) {
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
