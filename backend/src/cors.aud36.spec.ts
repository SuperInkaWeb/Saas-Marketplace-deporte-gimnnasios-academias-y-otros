// AUD-36: la API solo acepta llamadas del navegador desde los dominios propios.
import { Controller, Get, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { configureCors, getAllowedOrigins } from './app.setup';

@Controller('ping')
class PingController {
  @Get()
  ping() {
    return { ok: true };
  }
}

const createApp = async (env: NodeJS.ProcessEnv): Promise<INestApplication> => {
  const moduleRef = await Test.createTestingModule({
    controllers: [PingController],
  }).compile();
  const app = moduleRef.createNestApplication();
  configureCors(app, env);
  await app.init();
  return app;
};

// Lo que el navegador mira para decidir si deja leer la respuesta
const allowOrigin = async (app: INestApplication, origin: string) => {
  const res = await request(app.getHttpServer())
    .options('/ping')
    .set('Origin', origin)
    .set('Access-Control-Request-Method', 'GET');
  return res.headers['access-control-allow-origin'];
};

describe('AUD-36 · CORS solo para dominios propios', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp({ FRONTEND_URL: 'https://www.hercix.com' });
  });
  afterAll(async () => {
    await app.close();
  });

  it.each([
    'https://hercix.com',
    'https://www.hercix.com',
    'http://localhost:5173',
  ])('acepta %s', async (origin) => {
    expect(await allowOrigin(app, origin)).toBe(origin);
  });

  it.each([
    'https://sitio-de-otra-persona.vercel.app',
    'https://otra-app.onrender.com',
    'https://hercix.com.atacante.com',
    'http://hercix.com',
  ])('rechaza %s', async (origin) => {
    expect(await allowOrigin(app, origin)).toBeUndefined();
  });

  it('una llamada sin Origin (servidor a servidor, p. ej. webhooks) sigue funcionando', async () => {
    const res = await request(app.getHttpServer()).get('/ping');
    expect(res.status).toBe(200);
  });

  it('incluye FRONTEND_URL y no deja valores vacíos si no está definido', () => {
    expect(
      getAllowedOrigins({ FRONTEND_URL: 'https://app.hercix.com' }),
    ).toContain('https://app.hercix.com');
    expect(getAllowedOrigins({})).not.toContain(undefined);
    expect(
      getAllowedOrigins({}).some(
        (o) => o.includes('vercel.app') || o.includes('onrender.com'),
      ),
    ).toBe(false);
  });
});
