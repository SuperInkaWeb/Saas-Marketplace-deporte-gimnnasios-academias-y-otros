import { createContext, useContext } from 'react';

// 'ADMIN' es el valor interno del rol; en pantalla se muestra como "Superadmin"
export type Role = 'USER' | 'TRAINER' | 'GYM_OWNER' | 'ADMIN';

export const ROLE_LABELS: Record<Role, string> = {
  USER: 'Atleta',
  TRAINER: 'Coach / Entrenador',
  GYM_OWNER: 'Dueño (Owner)',
  ADMIN: 'Superadmin',
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  roles?: string[];
  avatarUrl?: string;
  phone?: string;
  dni?: string;
}

export interface LoginOptions {
  /** Si el perfil puede crear cuenta (muestra el enlace "Regístrate" en Auth0). */
  allowSignUp?: boolean;
  /** Pantalla inicial de Auth0. Por defecto, "Iniciar sesión". */
  screenHint?: 'login' | 'signup';
  /** Perfil elegido en el portal (/login). Se valida al volver de Auth0. */
  portalRole?: Role;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (options?: LoginOptions) => void;
  logout: () => void;
  updateUserProfile: (data: { name: string; phone?: string; dni?: string; role?: string }) => Promise<void>;
  switchUserRole: (role: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
