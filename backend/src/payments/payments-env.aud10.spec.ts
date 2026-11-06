import { checkPaymentsEnv } from './payments-env';

// AUD-10: las variables de Mercado Pago faltantes deben detectarse al arrancar.
describe('AUD-10: chequeo de variables de Mercado Pago', () => {
  const prodOk: NodeJS.ProcessEnv = {
    NODE_ENV: 'production',
    MP_ACCESS_TOKEN: 'APP_USR-123',
    MP_WEBHOOK_SECRET: 'secreto',
    BACKEND_URL: 'https://api.example.com',
    FRONTEND_URL: 'https://www.example.com',
  };

  it('producción completa no reporta problemas', () => {
    expect(checkPaymentsEnv(prodOk)).toEqual([]);
  });

  it.each([
    ['MP_ACCESS_TOKEN', { MP_ACCESS_TOKEN: undefined }],
    ['MP_WEBHOOK_SECRET', { MP_WEBHOOK_SECRET: '' }],
    ['BACKEND_URL', { BACKEND_URL: undefined }],
    ['BACKEND_URL', { BACKEND_URL: 'http://api.example.com' }],
    ['FRONTEND_URL', { FRONTEND_URL: undefined }],
  ])('en producción reporta %s', (name, override) => {
    const problems = checkPaymentsEnv({ ...prodOk, ...override });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain(name);
  });

  it('en producción reporta un token de prueba', () => {
    const problems = checkPaymentsEnv({
      ...prodOk,
      MP_ACCESS_TOKEN: 'TEST-123',
    });
    expect(problems).toEqual([expect.stringContaining('token de prueba')]);
  });

  it('en local acepta token de prueba, sin secreto y con BACKEND_URL http', () => {
    expect(
      checkPaymentsEnv({
        NODE_ENV: 'development',
        MP_ACCESS_TOKEN: 'TEST-123',
        BACKEND_URL: 'http://localhost:3000',
        FRONTEND_URL: 'http://localhost:5173',
      }),
    ).toEqual([]);
  });
});
