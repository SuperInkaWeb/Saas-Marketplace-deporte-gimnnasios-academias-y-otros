import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedUser } from '../types/authenticated-request';

/**
 * AnyAuthGuard — acepta tokens tanto de JWT propio como de Auth0.
 * Intenta primero JWT local; si falla, intenta Auth0.
 * Esto permite que el endpoint /auth/me funcione con ambos sistemas.
 */
@Injectable()
export class AnyAuthGuard extends AuthGuard(['auth0', 'jwt']) {
  handleRequest<TUser = AuthenticatedUser>(
    err: Error | null,
    user: AuthenticatedUser | false,
  ): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('Token inválido o expirado');
    }
    if (user.isActive === false) {
      throw new UnauthorizedException('Cuenta desactivada');
    }
    return user as TUser;
  }
}
