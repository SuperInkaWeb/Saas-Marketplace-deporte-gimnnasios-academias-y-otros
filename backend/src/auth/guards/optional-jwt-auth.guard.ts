import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Autenticación opcional: identifica al usuario si trae un token válido (JWT local
 * o Auth0) y, si no, deja pasar como anónimo (request.user = null).
 * AUD-29: antes solo probaba 'jwt', así que los usuarios de Auth0 llegaban como anónimos.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard(['jwt', 'auth0']) {
  handleRequest<TUser = any>(err: unknown, user: TUser): TUser | null {
    if (err || !user) return null;
    // Una cuenta desactivada no obtiene los privilegios de su rol.
    if ((user as { isActive?: boolean }).isActive === false) return null;
    return user;
  }
}
