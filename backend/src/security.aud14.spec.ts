import {
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './app.module';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { RecommendationsController } from './recommendations/recommendations.controller';
import { RecommendationsService } from './recommendations/recommendations.service';
import { GeminiService } from './recommendations/gemini.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

// jwks-rsa (estrategia de Auth0) depende de un paquete ESM que Jest no transforma; aquí no se usa.
jest.mock('jwks-rsa', () => ({ passportJwtSecret: jest.fn() }));

// La configuración de seguridad de main.ts vive en app.setup.ts (AUD-14); en main no existe.
let setup: any = null;
try {
  setup = require('./app.setup');
} catch {
  setup = null;
}

// Se arma la app con lo que AppModule declara de verdad: módulo de throttling y guards globales.
const fromAppModule = (
  key: 'imports' | 'providers',
  match: (m: any) => boolean,
) =>
  (Reflect.getMetadata(key, AppModule) ?? []).filter((m: any) => m && match(m));

const createApp = async (): Promise<INestApplication> => {
  const moduleRef = await Test.createTestingModule({
    imports: fromAppModule(
      'imports',
      (m) => m.module?.name === 'ThrottlerModule',
    ),
    controllers: [AuthController, RecommendationsController],
    providers: [
      ...fromAppModule('providers', (p) => p.provide === APP_GUARD),
      {
        provide: AuthService,
        useValue: {
          login: jest.fn(async () => {
            throw new UnauthorizedException('Credenciales inválidas');
          }),
          register: jest.fn(async () => ({ id: 'nuevo' })),
        },
      },
      { provide: RecommendationsService, useValue: {} },
      {
        provide: GeminiService,
        useValue: {
          enabled: false,
          chatWithAssistant: jest.fn(async () => 'ok'),
        },
      },
    ],
  })
    .overrideGuard(JwtAuthGuard)
    .useValue({
      canActivate: (ctx: any) => {
        ctx.switchToHttp().getRequest().user = {
          id: 'u1',
          name: 'Atleta',
          role: 'USER',
        };
        return true;
      },
    })
    .compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  setup?.configureSecurity(app, { NODE_ENV: 'production' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();
  return app;
};

const login = (app: INestApplication, email: string, ip?: string) => {
  const r = request(app.getHttpServer()).post('/api/auth/login');
  if (ip) r.set('X-Forwarded-For', ip);
  return r.send({ email, password: 'contraseña-incorrecta' });
};

const repeat = async (n: number, fn: () => Promise<request.Response>) => {
  const codes: number[] = [];
  for (let i = 0; i < n; i++) codes.push((await fn()).status);
  return codes;
};

describe('AUD-14: límite de peticiones y cabeceras de seguridad', () => {
  let app: INestApplication;
  beforeEach(async () => {
    app = await createApp();
  });
  afterEach(async () => {
    await app.close();
  });

  describe('H-42: fuerza bruta en el login', () => {
    it('al 6.º intento fallido en un minuto contra la misma cuenta responde 429', async () => {
      const codes = await repeat(6, () => login(app, 'victima@example.com'));
      expect(codes).toEqual([401, 401, 401, 401, 401, 429]);
    });

    it('el bloqueo no afecta a otra cuenta desde la misma IP', async () => {
      await repeat(6, () => login(app, 'victima@example.com'));
      expect((await login(app, 'otra@example.com')).status).toBe(401);
    });

    it('detrás del proxy de Render cada cliente tiene su propio contador', async () => {
      await repeat(6, () => login(app, 'victima@example.com', '200.1.1.1'));
      expect(
        (await login(app, 'victima@example.com', '200.1.1.1')).status,
      ).toBe(429);
      expect(
        (await login(app, 'victima@example.com', '200.2.2.2')).status,
      ).toBe(401);
    });

    it('el 429 trae un mensaje en español', async () => {
      await repeat(5, () => login(app, 'victima@example.com'));
      const res = await login(app, 'victima@example.com');
      expect(res.body.message).toMatch(/Demasiadas solicitudes/);
    });
  });

  it('registro: al 6.º en 10 minutos desde la misma IP responde 429', async () => {
    const codes = await repeat(6, () =>
      request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: `n${Math.random()}@example.com`,
          password: 'Password123!',
          name: 'Nuevo',
        }),
    );
    expect(codes[5]).toBe(429);
  });

  describe('chat de IA (coste en Gemini)', () => {
    it('al 11.º mensaje en un minuto responde 429', async () => {
      const codes = await repeat(11, () =>
        request(app.getHttpServer())
          .post('/api/recommendations/chat')
          .send({ message: 'hola' }),
      );
      expect(codes.slice(0, 10).every((c) => c === 201)).toBe(true);
      expect(codes[10]).toBe(429);
    });

    it('rechaza un mensaje de más de 2000 caracteres', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/recommendations/chat')
        .send({ message: 'a'.repeat(2001) });
      expect(res.status).toBe(400);
    });
  });

  it('las respuestas llevan cabeceras de seguridad y no revelan Express', async () => {
    const res = await login(app, 'cualquiera@example.com');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
    expect(res.headers['strict-transport-security']).toBeDefined();
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('Swagger queda deshabilitado en producción (y activo en desarrollo)', () => {
    expect(setup?.isSwaggerEnabled({ NODE_ENV: 'production' })).toBe(false);
    expect(
      setup?.isSwaggerEnabled({
        NODE_ENV: 'production',
        SWAGGER_ENABLED: 'true',
      }),
    ).toBe(true);
    expect(setup?.isSwaggerEnabled({ NODE_ENV: 'development' })).toBe(true);
  });
});
