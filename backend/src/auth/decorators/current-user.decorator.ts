import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * @CurrentUser() — injects the authenticated user from request.user
 * Usage: async getProfile(@CurrentUser() user: User) {}
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
