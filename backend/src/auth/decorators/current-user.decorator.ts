import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest } from '../types/authenticated-request';

/**
 * @CurrentUser() — injects the authenticated user from request.user
 * Usage: async getProfile(@CurrentUser() user: User) {}
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
