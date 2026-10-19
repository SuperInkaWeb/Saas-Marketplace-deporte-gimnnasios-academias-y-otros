import { PrismaClient } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';

const prisma = new PrismaClient();

// Script operativo: nunca contra producción; las credenciales llegan por variables de entorno.
if (process.env.NODE_ENV === 'production') {
  console.error('Este script no se puede ejecutar con NODE_ENV=production.');
  process.exit(1);
}
for (const name of ['JWT_SECRET']) {
  if (!process.env[name]) {
    console.error(`Falta la variable de entorno ${name}.`);
    process.exit(1);
  }
}
const jwtService = new JwtService({
  secret: process.env.JWT_SECRET!,
});

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'sofia.vargas.atleta4@hercix-demo.com' },
  });
  if (!user) {
    console.error('User sofia.vargas.atleta4@hercix-demo.com not found');
    return;
  }
  const payload = { sub: user.id, email: user.email, role: user.role };
  const token = await jwtService.signAsync(payload, { expiresIn: '7d' });
  console.log('\n--- TOKEN FOR SOFIA VARGAS ---');
  console.log(token);
}

main().finally(() => prisma.$disconnect());
