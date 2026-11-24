import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * RolesGuard — checks that the authenticated user has one of the required roles.
 * Must be used AFTER JwtAuthGuard so that request.user is already populated.
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles(UserRole.ADMIN)
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no @Roles() decorator, route is accessible to any authenticated user
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    const hasRole = requiredRoles.some((role) => user?.role === role);
    if (!hasRole) {
      if (
        user?.role === UserRole.GYM_OWNER &&
        requiredRoles.includes(UserRole.USER)
      ) {
        throw new ForbiddenException(
          'Acceso Restringido: Como dueño del local, tu cuenta tiene un rol B2B para gestionar sedes, clases y finanzas. Esta sección de entrenamiento interactivo, wearables y registro de marcas personales está optimizada y reservada exclusivamente para el perfil de tus Atletas.',
        );
      }
      throw new ForbiddenException(
        `Acceso restringido. Esta funcionalidad requiere el rol de: ${requiredRoles.join(', ')}.`,
      );
    }
    return true;
  }
}
