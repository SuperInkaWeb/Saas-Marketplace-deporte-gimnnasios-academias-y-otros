require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  console.log('HOST:', (process.env.DATABASE_URL || '').split('@')[1]?.split('/')[0]);
  console.log('COUNT users:', await prisma.user.count());
  console.log('COUNT payments:', await prisma.payment.count());
  try {
    await prisma.user.findMany({ take: 1 });
    console.log('LECTURA COMPLETA: OK');
  } catch (e) {
    co1nsole.log('LECTURA COMPLETA: FALLA ->', e.message.split('\n').slice(-3).join(' | '));
  }
  await prisma.$disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });