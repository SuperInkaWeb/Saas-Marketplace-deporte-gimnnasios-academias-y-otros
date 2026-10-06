require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const host = (process.env.DATABASE_URL || '').split('@')[1]?.split('/')[0];
  console.log('HOST:', host);

  const total = await prisma.$queryRaw`SELECT count(*)::int AS n FROM payments`;
  console.log('TOTAL payments:', total[0].n);

  const byStatus = await prisma.$queryRaw`
    SELECT status::text AS status, count(*)::int AS n FROM payments GROUP BY status ORDER BY status`;
  console.log('POR ESTADO:', JSON.stringify(byStatus));

  const cols = await prisma.$queryRaw`
    SELECT column_name, is_nullable FROM information_schema.columns
    WHERE table_name='payments' AND column_name IN ('class_id','service_id','booking_notes')`;
  console.log('COLUMNAS NUEVAS:', JSON.stringify(cols));

  const idx = await prisma.$queryRaw`
    SELECT indexname FROM pg_indexes
    WHERE tablename='payments' AND indexname IN ('payments_class_id_idx','payments_service_id_idx')`;
  console.log('INDICES NUEVOS:', JSON.stringify(idx));

  const hist = await prisma.$queryRaw`
    SELECT to_regclass('public._prisma_migrations')::text AS tabla`;
  console.log('HISTORIAL:', JSON.stringify(hist));

  await prisma.$disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });