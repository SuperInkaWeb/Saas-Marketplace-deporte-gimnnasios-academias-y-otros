import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import api from '../api/api-client';

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

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (options?: { allowSignUp?: boolean }) => void;
  logout: () => void;
  updateUserProfile: (data: { name: string; phone?: string; dni?: string; role?: string }) => Promise<void>;
  switchUserRole: (role: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    isAuthenticated, 
    user: auth0User, 
    getAccessTokenSilently, 
    isLoading: auth0Loading,
    loginWithRedirect,
    logout: auth0Logout 
  } = useAuth0();
  
  const [user, setUser] = useState<User | null>(null);
  const [backendLoading, setBackendLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const syncUser = async () => {
      // Si hay un código de Auth0 en la URL, no hacemos nada todavía, dejamos que el SDK procese el callback
      const params = new URLSearchParams(window.location.search);
      const hasAuth0Params = params.has('code') || params.has('error') || params.has('state');
      
      console.log('Sincronizando con Backend:', { isAuthenticated, auth0Loading, hasUser: !!auth0User, hasAuth0Params });
      
      if (auth0Loading || (hasAuth0Params && !isAuthenticated)) {
        console.log('Esperando a que Auth0 procese el callback...');
        return; 
      }

      if (isAuthenticated && auth0User) {
        setBackendLoading(true);
        try {
          const token = await getAccessTokenSilently();
          console.log('Token de Auth0 obtenido con éxito');
          localStorage.setItem('token', token);
          
          const { data } = await api.get('/auth/me', { timeout: 60000 });
          console.log('Perfil sincronizado desde Backend:', data.email);
          
          // Contingencia local: si el backend no devolvió la propiedad 'roles' (por caché o falta de compilación), la calculamos en el cliente
          if (!data.roles) {
            const computedRoles: string[] = ['USER'];
            if (data.role === 'ADMIN') computedRoles.push('ADMIN');
            if (data.role === 'GYM_OWNER') computedRoles.push('GYM_OWNER');
            if (data.role === 'TRAINER') computedRoles.push('TRAINER');
            data.roles = computedRoles;
          }
          
          setUser(data);
        } catch (error: any) {
          console.error('Error sincronizando usuario:', error.response?.data || error.message);
          // Si el error es 401, significa que el backend rechazó el token de Auth0
          if (error.response?.status === 401) {
             console.warn('Backend rechazó el token. Verificando configuración...');
          }
          setUser(null);
          localStorage.removeItem('token');
        } finally {
          setBackendLoading(false);
        }
      } else {
        // Si no está autenticado en Auth0, pero tenemos un token en localStorage, intentamos restaurar la sesión del backend
        const token = localStorage.getItem('token');
        if (token) {
          setBackendLoading(true);
          try {
            const { data } = await api.get('/auth/me', { timeout: 60000 });
            console.log('Perfil restaurado con éxito desde localStorage:', data.email);
            
            if (!data.roles) {
              const computedRoles: string[] = ['USER'];
              if (data.role === 'ADMIN') computedRoles.push('ADMIN');
              if (data.role === 'GYM_OWNER') computedRoles.push('GYM_OWNER');
              if (data.role === 'TRAINER') computedRoles.push('TRAINER');
              data.roles = computedRoles;
            }
            
            setUser(data);
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

  const login = async (options?: { allowSignUp?: boolean }) => {
    try {
      sessionStorage.setItem('justLoggedIn', 'true');
      await loginWithRedirect({
        authorizationParams: {
          allow_signup: options?.allowSignUp === false ? 'false' : 'true',
          screen_hint: options?.allowSignUp ? 'signup' : 'login',
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
    setUser(prev => prev ? { ...prev, ...data } : data);
  } catch (error) {
    console.error('Error al actualizar el perfil:', error);
    throw error;
  }
};

  const switchUserRole = async (newRole: string) => {
    try {
      setBackendLoading(true);
      await api.post('/auth/switch-role', { role: newRole });
      console.log('Rol cambiado con éxito a:', newRole);
      
      const { data } = await api.get('/auth/me');
      
      // Contingencia local: si el backend no devolvió la propiedad 'roles' (por caché o falta de compilación), la calculamos en el cliente
      if (!data.roles) {
        const computedRoles: string[] = ['USER'];
        if (data.role === 'ADMIN') computedRoles.push('ADMIN');
        if (data.role === 'GYM_OWNER') computedRoles.push('GYM_OWNER');
        if (data.role === 'TRAINER') computedRoles.push('TRAINER');
        data.roles = computedRoles;
      }
      
      setUser(data);
    } catch (error) {
      console.error('Error al cambiar de rol:', error);
      throw error;
    } finally {
      setBackendLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading: auth0Loading || (isAuthenticated && backendLoading) || isLoggingOut, 
      login, 
      logout,
      updateUserProfile,
      switchUserRole
    }}>
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
