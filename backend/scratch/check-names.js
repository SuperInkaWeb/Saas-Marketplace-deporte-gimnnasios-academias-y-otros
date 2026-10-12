require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  console.log('HOST:', (process.env.DATABASE_URL || '').split('@')[1]?.split('/')[0]);
  const r = await prisma.$queryRaw`
    SELECT count(*)::int AS total,
           count(*) FILTER (WHERE lower(trim(name)) = lower(trim(email)))::int AS nombre_igual_email
    FROM users`;
  console.log(JSON.stringify(r));
  const u = await prisma.user.findUnique({
    where: { email: 'javier@gmail.com' },
    select: { name: true, email: true, role: true, auth0Id: true, createdAt: true },
  });
  console.log(JSON.stringify(u));
  await prisma.$disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });