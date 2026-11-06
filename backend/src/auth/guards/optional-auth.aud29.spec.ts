import { ExecutionContext } from '@nestjs/common';
import passport from 'passport';
import type { Request } from 'express';
import { Strategy } from 'passport-strategy';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

// AUD-29: la guard opcional (GET /gyms/:id) debe reconocer también a los usuarios de
// Auth0, que son la mayoría; antes solo probaba la estrategia jwt local.

// Estrategia de prueba: acepta el token "Bearer <nombre>-ok" con el usuario dado.
type TestUser = { id: string; role: string; isActive: boolean };

class FakeStrategy extends Strategy {
  constructor(
    public name: string,
    private readonly users: Record<string, TestUser>,
  ) {
    super();
  }
  authenticate(req: Request) {
    const token = String(req.headers.authorization ?? '').replace(
      'Bearer ',
      '',
    );
    const user = this.users[token];
    if (user) return this.success(user);
    return this.fail(401);
  }
}

const context = (authorization?: string) => {
  const req = {
    headers: authorization ? { authorization } : {},
  } as Request & { user?: TestUser | null };
  const ctx = {
    switchToHttp: () => ({ getRequest: () => req, getResponse: () => ({}) }),
  } as unknown as ExecutionContext;
  return { req, ctx };
};

describe('AUD-29: OptionalJwtAuthGuard acepta Auth0 y JWT local', () => {
  const auth0User = { id: 'owner-auth0', role: 'GYM_OWNER', isActive: true };
  const jwtUser = { id: 'owner-jwt', role: 'GYM_OWNER', isActive: true };
  const inactive = { id: 'off', role: 'USER', isActive: false };

  beforeAll(() => {
    passport.use(
      new FakeStrategy('jwt', { 'jwt-ok': jwtUser, 'jwt-off': inactive }),
    );
    passport.use(new FakeStrategy('auth0', { 'auth0-ok': auth0User }));
  });

  const guard = new OptionalJwtAuthGuard();

  it('reconoce a un usuario de Auth0', async () => {
    const { req, ctx } = context('Bearer auth0-ok');
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(req.user).toEqual(auth0User);
  });

  it('sigue reconociendo a un usuario con JWT local', async () => {
    const { req, ctx } = context('Bearer jwt-ok');
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(req.user).toEqual(jwtUser);
  });

  it('sin token o con token inválido deja pasar como anónimo', async () => {
    for (const header of [undefined, 'Bearer basura']) {
      const { req, ctx } = context(header);
      await expect(guard.canActivate(ctx)).resolves.toBe(true);
      expect(req.user ?? null).toBeNull();
    }
  });

  it('una cuenta desactivada se trata como anónima', async () => {
    const { req, ctx } = context('Bearer jwt-off');
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(req.user ?? null).toBeNull();
  });
});
