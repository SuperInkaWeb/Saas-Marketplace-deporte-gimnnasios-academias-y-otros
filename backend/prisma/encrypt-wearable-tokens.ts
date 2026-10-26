// AUD-15: cifra los tokens de wearable_connections que siguen en texto plano (o con la clave anterior).
//
// Uso (desde backend/, con DATABASE_URL y TOKEN_ENCRYPTION_KEY en el entorno):
//   npx ts-node prisma/encrypt-wearable-tokens.ts           -> solo cuenta, no escribe nada
//   npx ts-node prisma/encrypt-wearable-tokens.ts --apply   -> cifra y guarda
//
// Nunca imprime tokens. Es idempotente: lo ya cifrado con la clave actual se salta.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { TokenCipher } from '../src/common/security/token-cipher';

const apply = process.argv.includes('--apply');

async function main() {
  const cipher = new TokenCipher();
  if (!cipher.enabled) {
    throw new Error('Falta TOKEN_ENCRYPTION_KEY: no hay con qué cifrar.');
  }

  const prisma = new PrismaClient();
  try {
    const rows = await prisma.wearableConnection.findMany({
      select: { id: true, accessToken: true, refreshToken: true },
    });

    let pending = 0;
    let updated = 0;
    for (const row of rows) {
      const access = cipher.needsReencrypt(row.accessToken);
      const refresh = cipher.needsReencrypt(row.refreshToken);
      if (!access && !refresh) continue;
      pending++;
      if (!apply) continue;

      await prisma.wearableConnection.update({
        where: { id: row.id },
        data: {
          ...(access ? { accessToken: cipher.encrypt(cipher.decrypt(row.accessToken)) } : {}),
          ...(refresh && row.refreshToken
            ? { refreshToken: cipher.encrypt(cipher.decrypt(row.refreshToken)) }
            : {}),
        },
      });
      updated++;
    }

    console.log(`Conexiones: ${rows.length} · por cifrar: ${pending} · cifradas ahora: ${updated}`);
    if (!apply && pending > 0) console.log('Modo simulación: repetir con --apply para guardar.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
