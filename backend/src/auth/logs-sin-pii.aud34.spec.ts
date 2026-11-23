import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { AuthService } from './auth.service';
import { Auth0JwtStrategy } from './strategies/auth0-jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';
import { maskEmail } from '../common/utils/mask-email';

// jwks-rsa (ESM) no se puede cargar en jest; la prueba no valida firmas, solo los logs de validate().
jest.mock('jwks-rsa', () => ({ passportJwtSecret: () => jest.fn() }));

// AUD-34: el inicio de sesión no debe dejar datos personales (payload del token, correos, nombres) en los logs.

const EMAIL = 'persona.real@gmail.com';
const NAME = 'Persona Real Ejemplo';

/** Captura todo lo que se escribe por console.* y por el Logger de Nest. */
function captureLogs() {
  const lines: string[] = [];
  const push = (...args: unknown[]) => {
    lines.push(
      args
        .map((a) => (typeof a === 'string' ? a : JSON.stringify(a)))
        .join(' '),
    );
  };
  const spies = [
    ...(['log', 'info', 'warn', 'error', 'debug'] as const).map((m) =>
      jest.spyOn(console, m).mockImplementation(push),
    ),
    ...(['log', 'warn', 'error', 'debug', 'verbose'] as const).map((m) =>
      jest.spyOn(Logger.prototype, m).mockImplementation(push),
    ),
  ];
  return {
    text: () => lines.join('\n'),
    restore: () => spies.forEach((s) => s.mockRestore()),
  };
}

describe('maskEmail (AUD-34)', () => {
  it('deja ver solo el inicio y el dominio', () => {
    expect(maskEmail('walter.perez@gmail.com')).toBe('wa***@gmail.com');
    expect(maskEmail('ab@x.com')).toBe('a***@x.com');
  });

  it('no falla con valores vacíos o sin @', () => {
    expect(maskEmail(undefined)).toBe('***');
    expect(maskEmail('')).toBe('***');
    expect(maskEmail('sin-arroba')).toBe('***');
  });
});

describe('Auth0JwtStrategy.validate sin datos personales en logs (AUD-34)', () => {
  let strategy: Auth0JwtStrategy;
  let logs: ReturnType<typeof captureLogs>;
  const authService = {
    findOrCreateAuth0User: jest
      .fn()
      .mockResolvedValue({ id: 'u1', isActive: true, role: UserRole.USER }),
  };

  beforeEach(() => {
    strategy = new Auth0JwtStrategy(
      { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigService,
      authService as unknown as AuthService,
    );
    logs = captureLogs();
  });

  afterEach(() => logs.restore());

  it('no registra el payload del token ni el correo cuando vienen en el token', async () => {
    await strategy.validate(
      { headers: {} },
      {
        sub: 'auth0|abc123',
        email: EMAIL,
        email_verified: true,
        name: NAME,
        iss: 'x',
        aud: 'y',
      },
    );

    expect(logs.text()).not.toContain(EMAIL);
    expect(logs.text()).not.toContain(NAME);
    expect(logs.text()).not.toContain('email_verified');
  });

  it('no registra el correo obtenido de /userinfo', async () => {
    jest
      .spyOn(strategy as any, 'fetchUserInfo')
      .mockResolvedValue({ email: EMAIL, email_verified: true, name: NAME });

    await strategy.validate(
      { headers: { authorization: 'Bearer token-de-prueba' } },
      { sub: 'auth0|abc123', iss: 'x', aud: 'y' },
    );

    expect(authService.findOrCreateAuth0User).toHaveBeenLastCalledWith(
      expect.objectContaining({ email: EMAIL }),
    );
    expect(logs.text()).not.toContain(EMAIL);
    expect(logs.text()).not.toContain(NAME);
  });
});

describe('AuthService.findOrCreateAuth0User sin correos completos en logs (AUD-34)', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof makePrisma>;
  let logs: ReturnType<typeof captureLogs>;

  type UpdateArgs = { where: { id: string }; data: Record<string, unknown> };
  type CreateArgs = { data: Record<string, unknown> };

  const makePrisma = () => ({
    user: {
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn().mockResolvedValue(null),
      update: jest
        .fn()
        .mockImplementation(({ where, data }: UpdateArgs) =>
          Promise.resolve({ id: where.id, ...data }),
        ),
      create: jest
        .fn()
        .mockImplementation(({ data }: CreateArgs) =>
          Promise.resolve({ id: 'nuevo', isActive: true, ...data }),
        ),
    },
    invitation: {
      findFirst: jest.fn().mockResolvedValue(null),
      update: jest.fn(),
    },
    trainerProfile: { create: jest.fn().mockResolvedValue({ id: 'tp1' }) },
    gymTrainer: { create: jest.fn() },
  });

  beforeEach(() => {
    prisma = makePrisma();
    service = new AuthService(
      prisma as unknown as PrismaService,
      {} as JwtService,
      {} as ConfigService,
      {
        sendWelcome: jest.fn().mockResolvedValue(undefined),
      } as unknown as EmailService,
    );
    logs = captureLogs();
  });

  afterEach(() => logs.restore());

  it('alta sin invitación: no registra el correo completo', async () => {
    await service.findOrCreateAuth0User({
      auth0Id: 'auth0|n1',
      email: EMAIL,
      emailVerified: true,
      name: NAME,
    });

    expect(logs.text()).not.toContain(EMAIL);
    expect(logs.text()).toContain(maskEmail(EMAIL));
  });

  it('alta con invitación de entrenador: no registra el correo completo', async () => {
    prisma.invitation.findFirst.mockResolvedValue({
      id: 'inv1',
      email: EMAIL,
      role: UserRole.TRAINER,
      gymId: 'g1',
      status: 'PENDING',
    });

    await service.findOrCreateAuth0User({
      auth0Id: 'auth0|n2',
      email: EMAIL,
      emailVerified: true,
      name: NAME,
    });

    expect(prisma.gymTrainer.create).toHaveBeenCalled();
    expect(logs.text()).not.toContain(EMAIL);
  });

  it('vinculación de una cuenta existente por correo: no registra el correo completo', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'u-existente',
      email: EMAIL,
      role: UserRole.USER,
      isActive: true,
      avatarUrl: null,
    });

    await service.findOrCreateAuth0User({
      auth0Id: 'auth0|n3',
      email: EMAIL,
      emailVerified: true,
      name: NAME,
    });

    expect(logs.text()).not.toContain(EMAIL);
    expect(logs.text()).toContain('u-existente');
  });
});
