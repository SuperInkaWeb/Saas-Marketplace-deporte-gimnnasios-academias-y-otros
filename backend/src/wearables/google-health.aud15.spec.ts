import { BadRequestException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { GoogleHealthService } from './google-health.service';
import { PrismaService } from '../prisma/prisma.service';

// El módulo de cifrado es parte de la corrección (AUD-15); en main no existe.
let cipherModule: any = null;
try {
  cipherModule = require('../common/security/token-cipher');
} catch {
  cipherModule = null;
}
const newCipher = (env: Record<string, string | undefined>) =>
  cipherModule ? new cipherModule.TokenCipher(env) : undefined;

const KEY = randomBytes(32).toString('base64');
const OLD_KEY = randomBytes(32).toString('base64');
const ACCESS = 'ya29.token-de-acceso-de-prueba';
const REFRESH = '1//token-de-renovacion-de-prueba';

const build = (stored: Record<string, any> | null, env: Record<string, string | undefined> = { TOKEN_ENCRYPTION_KEY: KEY }) => {
  const prisma = {
    wearableConnection: {
      findUnique: jest.fn(async () => stored),
      upsert: jest.fn(async () => ({})),
      update: jest.fn(async () => ({})),
    },
  };
  const service = new (GoogleHealthService as any)(prisma as unknown as PrismaService, newCipher(env));
  return { prisma, service: service as GoogleHealthService };
};

const fresh = { tokenExpiry: new Date(Date.now() + 3_600_000) };
const expired = { tokenExpiry: new Date(Date.now() - 60_000) };

const googleResponds = (body: any) =>
  jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => body } as Response);

afterEach(() => jest.restoreAllMocks());
beforeAll(() => {
  process.env.GOOGLE_HEALTH_CLIENT_ID = 'client-id';
  process.env.GOOGLE_HEALTH_CLIENT_SECRET = 'client-secret';
});

describe('AUD-15: tokens de Google Health cifrados', () => {
  describe('cifrado (AES-256-GCM)', () => {
    it('el valor guardado no contiene el token y se recupera igual', () => {
      const cipher = newCipher({ TOKEN_ENCRYPTION_KEY: KEY });
      const stored = cipher.encrypt(ACCESS);
      expect(stored.startsWith('enc:v1:')).toBe(true);
      expect(stored).not.toContain(ACCESS);
      expect(cipher.decrypt(stored)).toBe(ACCESS);
    });

    it('cifrar dos veces el mismo token da valores distintos (IV aleatorio)', () => {
      const cipher = newCipher({ TOKEN_ENCRYPTION_KEY: KEY });
      expect(cipher.encrypt(ACCESS)).not.toBe(cipher.encrypt(ACCESS));
    });

    it('un valor alterado en la base no se acepta', () => {
      const cipher = newCipher({ TOKEN_ENCRYPTION_KEY: KEY });
      const stored: string = cipher.encrypt(ACCESS);
      const tampered = stored.slice(0, -4) + (stored.endsWith('AAAA') ? 'BBBB' : 'AAAA');
      expect(() => cipher.decrypt(tampered)).toThrow();
    });

    it('rotación: lee lo cifrado con la clave anterior y lo marca para recifrar', () => {
      const before = newCipher({ TOKEN_ENCRYPTION_KEY: OLD_KEY }).encrypt(ACCESS);
      const cipher = newCipher({ TOKEN_ENCRYPTION_KEY: KEY, TOKEN_ENCRYPTION_KEY_PREVIOUS: OLD_KEY });
      expect(cipher.decrypt(before)).toBe(ACCESS);
      expect(cipher.needsReencrypt(before)).toBe(true);
      expect(cipher.needsReencrypt(cipher.encrypt(ACCESS))).toBe(false);
    });

    it('una clave mal formada se rechaza al arrancar', () => {
      expect(cipherModule).not.toBeNull();
      expect(() => newCipher({ TOKEN_ENCRYPTION_KEY: 'corta' })).toThrow(/32 bytes/);
    });
  });

  describe('GoogleHealthService', () => {
    it('al conectar la cuenta guarda los tokens cifrados', async () => {
      googleResponds({ access_token: ACCESS, refresh_token: REFRESH, expires_in: 3600, scope: 's' });
      const { prisma, service } = build(null);
      await service.exchangeCodeForTokens('u1', 'code', 'https://hercix.com/cb');

      const { create, update } = prisma.wearableConnection.upsert.mock.calls[0][0];
      for (const data of [create, update]) {
        expect(data.accessToken).toMatch(/^enc:v1:/);
        expect(data.refreshToken).toMatch(/^enc:v1:/);
        expect(JSON.stringify(data)).not.toContain(ACCESS);
        expect(JSON.stringify(data)).not.toContain(REFRESH);
      }
    });

    it('usa el token descifrado para llamar a Google', async () => {
      const cipher = newCipher({ TOKEN_ENCRYPTION_KEY: KEY });
      const { service } = build({ ...fresh, accessToken: cipher?.encrypt(ACCESS), refreshToken: cipher?.encrypt(REFRESH) });
      await expect(service.getValidAccessToken('u1')).resolves.toBe(ACCESS);
    });

    it('migración progresiva: un token antiguo en texto plano se cifra al usarse', async () => {
      const { prisma, service } = build({ ...fresh, accessToken: ACCESS, refreshToken: REFRESH });
      await expect(service.getValidAccessToken('u1')).resolves.toBe(ACCESS);

      expect(prisma.wearableConnection.update).toHaveBeenCalledTimes(1);
      const { data } = prisma.wearableConnection.update.mock.calls[0][0];
      expect(data.accessToken).toMatch(/^enc:v1:/);
      expect(data.refreshToken).toMatch(/^enc:v1:/);
    });

    it('al renovar envía a Google el refresh token descifrado y guarda el nuevo cifrado', async () => {
      const cipher = newCipher({ TOKEN_ENCRYPTION_KEY: KEY });
      const fetchMock = googleResponds({ access_token: 'ya29.nuevo', expires_in: 3600 });
      const { prisma, service } = build({ ...expired, accessToken: cipher?.encrypt(ACCESS), refreshToken: cipher?.encrypt(REFRESH) });

      await expect(service.getValidAccessToken('u1')).resolves.toBe('ya29.nuevo');
      const sent = new URLSearchParams(String((fetchMock.mock.calls[0][1] as RequestInit).body));
      expect(sent.get('refresh_token')).toBe(REFRESH);
      expect(prisma.wearableConnection.update.mock.calls[0][0].data.accessToken).toMatch(/^enc:v1:/);
    });

    it('si el token no se puede descifrar pide reconectar la cuenta', async () => {
      const other = newCipher({ TOKEN_ENCRYPTION_KEY: OLD_KEY });
      const { service } = build({ ...fresh, accessToken: other?.encrypt(ACCESS) ?? 'enc:v1:x:y:z', refreshToken: null });
      await expect(service.getValidAccessToken('u1')).rejects.toThrow(BadRequestException);
    });

    it('sin TOKEN_ENCRYPTION_KEY sigue funcionando como antes (texto plano)', async () => {
      const { service } = build({ ...fresh, accessToken: ACCESS, refreshToken: REFRESH }, {});
      await expect(service.getValidAccessToken('u1')).resolves.toBe(ACCESS);
    });
  });
});
