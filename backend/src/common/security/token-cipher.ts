import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// Cifrado de tokens OAuth guardados en la base (AUD-15).
// Formato: enc:v1:<iv>:<tag>:<texto cifrado>, todo en base64, con AES-256-GCM.
// Clave: TOKEN_ENCRYPTION_KEY = 32 bytes en base64 (openssl rand -base64 32).
// Rotación: la clave anterior va en TOKEN_ENCRYPTION_KEY_PREVIOUS y solo se usa para descifrar.

const PREFIX = 'enc:v1:';
const ALGORITHM = 'aes-256-gcm';

export class TokenCipherError extends Error {}

const parseKey = (value: string | undefined, name: string): Buffer | null => {
  if (!value) return null;
  const key = Buffer.from(value, 'base64');
  if (key.length !== 32) {
    throw new TokenCipherError(
      `${name} debe ser de 32 bytes en base64 (openssl rand -base64 32)`,
    );
  }
  return key;
};

export const isEncrypted = (value: string | null | undefined): boolean =>
  typeof value === 'string' && value.startsWith(PREFIX);

export class TokenCipher {
  private readonly key: Buffer | null;
  private readonly previousKey: Buffer | null;

  constructor(env: NodeJS.ProcessEnv = process.env) {
    this.key = parseKey(env.TOKEN_ENCRYPTION_KEY, 'TOKEN_ENCRYPTION_KEY');
    this.previousKey = parseKey(
      env.TOKEN_ENCRYPTION_KEY_PREVIOUS,
      'TOKEN_ENCRYPTION_KEY_PREVIOUS',
    );
  }

  get enabled(): boolean {
    return this.key !== null;
  }

  // Sin clave configurada se guarda como antes (texto plano); quien llame decide si avisar.
  encrypt(plain: string): string {
    if (!this.key) return plain;
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return PREFIX + [iv, tag, data].map((b) => b.toString('base64')).join(':');
  }

  // Acepta valores antiguos en texto plano (se devuelven tal cual) y los cifrados con la clave
  // actual o con la anterior.
  decrypt(value: string): string {
    if (!isEncrypted(value)) return value;
    const plain =
      this.tryDecrypt(value, this.key) ??
      this.tryDecrypt(value, this.previousKey);
    if (plain === null) {
      throw new TokenCipherError(
        'No se pudo descifrar el token con las claves configuradas',
      );
    }
    return plain;
  }

  // true si el valor debe volver a guardarse: está en texto plano o cifrado con la clave anterior.
  needsReencrypt(value: string | null | undefined): boolean {
    if (!this.key || !value) return false;
    return !isEncrypted(value) || this.tryDecrypt(value, this.key) === null;
  }

  private tryDecrypt(value: string, key: Buffer | null): string | null {
    if (!key) return null;
    try {
      const [iv, tag, data] = value
        .slice(PREFIX.length)
        .split(':')
        .map((p) => Buffer.from(p, 'base64'));
      const decipher = createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(data), decipher.final()]).toString(
        'utf8',
      );
    } catch {
      return null;
    }
  }
}
