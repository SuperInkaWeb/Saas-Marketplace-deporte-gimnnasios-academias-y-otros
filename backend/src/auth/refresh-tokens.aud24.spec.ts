/* eslint-disable @typescript-eslint/require-await --
   La tabla refresh_tokens falsa en memoria trabaja con objetos sin tipar a propósito: sirve tanto para el
   código anterior (bcrypt) como para el corregido (jti + SHA-256). */
import {
  UnauthorizedException,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';
import { LogoutDto, RefreshTokenDto } from './dto/refresh-token.dto';

const ACCESS_SECRET = 'access-secret-de-prueba-aud24-xxxxxxxxxxxx';
const REFRESH_SECRET = 'refresh-secret-de-prueba-aud24-yyyyyyyyyyy';
const USER_ID = 'a3f1c2d4-5b6e-4f70-8a9b-0c1d2e3f4a5b';
const OTHER_ID = 'b4e2d3c5-6c7f-4a81-9bac-1d2e3f4a5b6c';

type Row = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revoked: boolean;
};

function matches(row: Row, where: any): boolean {
  return Object.entries(where).every(([k, v]: [string, any]) => {
    if (v && typeof v === 'object' && 'lt' in v) return (row as any)[k] < v.lt;
    return (row as any)[k] === v;
  });
}

/** Tabla refresh_tokens en memoria + usuarios mínimos. */
function makePrisma() {
  const rows: Row[] = [];
  const users: Record<string, any> = {
    [USER_ID]: {
      id: USER_ID,
      email: 'admin@example.com',
      role: UserRole.ADMIN,
      isActive: true,
      passwordHash: 'x',
    },
    [OTHER_ID]: {
      id: OTHER_ID,
      email: 'otro@example.com',
      role: UserRole.USER,
      isActive: true,
      passwordHash: 'x',
    },
  };
  const prisma = {
    rows,
    users,
    user: { findUnique: jest.fn(async ({ where }) => users[where.id] ?? null) },
    refreshToken: {
      findUnique: jest.fn(
        async ({ where }) => rows.find((r) => r.id === where.id) ?? null,
      ),
      create: jest.fn(async ({ data }) => {
        const row = { revoked: false, ...data } as Row;
        rows.push(row);
        return row;
      }),
      updateMany: jest.fn(async ({ where, data }) => {
        const hit = rows.filter((r) => matches(r, where));
        hit.forEach((r) => Object.assign(r, data));
        return { count: hit.length };
      }),
      deleteMany: jest.fn(async ({ where }) => {
        let count = 0;
        for (let i = rows.length - 1; i >= 0; i--)
          if (matches(rows[i], where)) {
            rows.splice(i, 1);
            count++;
          }
        return { count };
      }),
      findMany: jest.fn(async ({ where }) =>
        rows.filter((r) => r.userId === where.userId),
      ),
    },
  };
  return prisma;
}

function makeService(
  prisma: any,
  env: Record<string, string | undefined> = {},
) {
  const values: Record<string, string | undefined> = {
    JWT_SECRET: ACCESS_SECRET,
    JWT_REFRESH_SECRET: REFRESH_SECRET,
    ...env,
  };
  const config = { get: (k: string) => values[k] } as unknown as ConfigService;
  const jwt = new JwtService({ secret: ACCESS_SECRET });
  const service = new AuthService(prisma as PrismaService, jwt, config, {
    sendWelcome: jest.fn().mockResolvedValue(undefined),
  } as unknown as EmailService);
  return { service, jwt };
}

async function login(service: AuthService, userId = USER_ID) {
  return (service as any).generateTokens(
    userId,
    'x@example.com',
    UserRole.ADMIN,
  ) as Promise<{
    accessToken: string;
    refreshToken: string;
  }>;
}

describe('AUD-24 — refresh tokens', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: AuthService;
  let jwt: JwtService;

  beforeEach(() => {
    prisma = makePrisma();
    ({ service, jwt } = makeService(prisma));
  });

  describe('token forjado (falla de bcrypt y 72 bytes)', () => {
    it('rechaza un token inventado con solo el userId aunque la víctima tenga una sesión activa', async () => {
      await login(service); // la víctima inició sesión: hay una fila vigente
      const header = Buffer.from(
        JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
      ).toString('base64url');
      const body = Buffer.from(
        JSON.stringify({ sub: USER_ID, email: 'cualquiera' }),
      ).toString('base64url');
      const forged = (header + '.' + body).slice(0, 72) + 'basura.inventada';

      await expect(
        service.refreshTokens(USER_ID, forged),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rechaza un token firmado con otra clave', async () => {
      const { refreshToken } = await login(service);
      const { jti } = jwt.decode<any>(refreshToken);
      const fake = await jwt.signAsync(
        { sub: USER_ID, jti, type: 'refresh' },
        { secret: 'otra-clave' },
      );

      await expect(service.refreshTokens(USER_ID, fake)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('no acepta el access token como refresh token', async () => {
      const { accessToken } = await login(service);
      await expect(
        service.refreshTokens(USER_ID, accessToken),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rechaza el token de otro usuario', async () => {
      const { refreshToken } = await login(service, OTHER_ID);
      await expect(
        service.refreshTokens(USER_ID, refreshToken),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('almacenamiento', () => {
    it('guarda la huella SHA-256 del token completo, con id = jti y el vencimiento del token', async () => {
      const { refreshToken } = await login(service);
      const { jti, exp } = jwt.decode<any>(refreshToken);
      const row = prisma.rows[0];

      expect(row.id).toBe(jti);
      expect(row.tokenHash).toMatch(/^[0-9a-f]{64}$/);
      expect(row.tokenHash).not.toContain(refreshToken.slice(0, 20));
      expect(row.expiresAt.getTime()).toBe(exp * 1000);
    });

    it('borra los tokens vencidos del usuario al emitir uno nuevo', async () => {
      prisma.rows.push({
        id: 'viejo',
        userId: USER_ID,
        tokenHash: 'h',
        expiresAt: new Date(Date.now() - 1000),
        revoked: false,
      });
      prisma.rows.push({
        id: 'ajeno',
        userId: OTHER_ID,
        tokenHash: 'h2',
        expiresAt: new Date(Date.now() - 1000),
        revoked: false,
      });
      await login(service);

      expect(prisma.rows.map((r) => r.id)).not.toContain('viejo');
      expect(prisma.rows.map((r) => r.id)).toContain('ajeno');
    });

    it('rechaza los tokens del formato anterior (sin jti)', async () => {
      const legacy = await jwt.signAsync(
        { sub: USER_ID, email: 'x', role: 'ADMIN' },
        { secret: REFRESH_SECRET },
      );
      await expect(
        service.refreshTokens(USER_ID, legacy),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('falla de forma explícita si falta JWT_REFRESH_SECRET', async () => {
      const { service: noSecret } = makeService(prisma, {
        JWT_REFRESH_SECRET: undefined,
      });
      await expect(login(noSecret)).rejects.toThrow('JWT_REFRESH_SECRET');
    });
  });

  describe('rotación y reuso', () => {
    it('entrega tokens nuevos y revoca el usado', async () => {
      const first = await login(service);
      const res = await service.refreshTokens(USER_ID, first.refreshToken);

      expect(res.refreshToken).not.toBe(first.refreshToken);
      expect(res.user).not.toHaveProperty('passwordHash');
      const oldRow = prisma.rows.find(
        (r) => r.id === jwt.decode<any>(first.refreshToken).jti,
      )!;
      expect(oldRow.revoked).toBe(true);
    });

    it('reusar un token ya rotado cierra todas las sesiones del usuario', async () => {
      const first = await login(service);
      const second = await service.refreshTokens(USER_ID, first.refreshToken);

      await expect(
        service.refreshTokens(USER_ID, first.refreshToken),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      // el token legítimo más nuevo también queda invalidado
      await expect(
        service.refreshTokens(USER_ID, second.refreshToken),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('si dos peticiones usan el mismo token a la vez, solo una obtiene tokens', async () => {
      const first = await login(service);
      const results = await Promise.allSettled([
        service.refreshTokens(USER_ID, first.refreshToken),
        service.refreshTokens(USER_ID, first.refreshToken),
      ]);
      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    });

    it('rechaza si la fila está vencida', async () => {
      const { refreshToken } = await login(service);
      prisma.rows[0].expiresAt = new Date(Date.now() - 1000);
      await expect(
        service.refreshTokens(USER_ID, refreshToken),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rechaza si el usuario está desactivado', async () => {
      const { refreshToken } = await login(service);
      prisma.users[USER_ID].isActive = false;
      await expect(
        service.refreshTokens(USER_ID, refreshToken),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('invalida el refresh token', async () => {
      const { refreshToken } = await login(service);
      await service.logout(refreshToken);
      await expect(
        service.refreshTokens(USER_ID, refreshToken),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('no falla con un token inválido ni toca otras sesiones', async () => {
      const { refreshToken } = await login(service);
      await expect(service.logout('no-es-un-token')).resolves.toBeUndefined();
      await expect(
        service.refreshTokens(USER_ID, refreshToken),
      ).resolves.toHaveProperty('accessToken');
    });
  });

  describe('validación del cuerpo (antes 500, ahora 400)', () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });

    it('POST /auth/refresh sin refreshToken → 400', async () => {
      await expect(
        pipe.transform(
          { userId: USER_ID },
          { type: 'body', metatype: RefreshTokenDto },
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('POST /auth/refresh sin userId → 400', async () => {
      await expect(
        pipe.transform(
          { refreshToken: 'x' },
          { type: 'body', metatype: RefreshTokenDto },
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('POST /auth/logout sin refreshToken → 400', async () => {
      await expect(
        pipe.transform({}, { type: 'body', metatype: LogoutDto }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
