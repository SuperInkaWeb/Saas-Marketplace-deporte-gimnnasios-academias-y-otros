import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedUser } from '../types/authenticated-request';

/**
 * JwtAuthGuard — protects routes requiring a valid JWT.
 * Usage: @UseGuards(JwtAuthGuard)
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard(['jwt', 'auth0']) {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<TUser = AuthenticatedUser>(
    err: Error | null,
    user: AuthenticatedUser | false,
  ): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('Token inválido o expirado');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Cuenta desactivada');
    }
    return user as TUser;
  }
}
