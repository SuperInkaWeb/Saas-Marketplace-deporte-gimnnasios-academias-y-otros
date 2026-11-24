import type { UserRole } from '@prisma/client';

/**
 * Usuario que dejan en request.user los guards de autenticación.
 * Son los campos que devuelven las dos estrategias: jwt (select explícito) y
 * auth0 (el usuario completo de la base de datos).
 */
export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

/** Request de un endpoint protegido: usar con @Request() o @Req(). */
export interface AuthenticatedRequest {
  user: AuthenticatedUser;
}
