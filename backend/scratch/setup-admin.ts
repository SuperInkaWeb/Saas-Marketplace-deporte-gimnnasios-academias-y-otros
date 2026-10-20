import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Script operativo: nunca contra producción; las credenciales llegan por variables de entorno.
if (process.env.NODE_ENV === 'production') {
  console.error('Este script no se puede ejecutar con NODE_ENV=production.');
  process.exit(1);
}
for (const name of ['SETUP_ADMIN_DATABASE_URL', 'SETUP_ADMIN_PASSWORD']) {
  if (!process.env[name]) {
    console.error(`Falta la variable de entorno ${name}.`);
    process.exit(1);
  }
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.SETUP_ADMIN_DATABASE_URL
    }
  }
});

async function main() {
  const email = 'admin@sportnexus.com';
  const password = process.env.SETUP_ADMIN_PASSWORD!;
  const hashedPassword = await bcrypt.hash(password, 10);

  // Check if user exists
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    await prisma.user.update({
      where: { email },
      data: { passwordHash: hashedPassword, role: 'ADMIN', isActive: true }
    });
    console.log('✅ Usuario ADMIN actualizado con éxito.');
  }

  // Ensure Gym exists
  let gym = await prisma.gym.findFirst({ where: { ownerId: existingUser?.id || '' } });
  if (!gym) {
    gym = await prisma.gym.create({
      data: {
        ownerId: existingUser?.id || '',
        name: 'Titan Fitness Black',
        description: 'Elite training facility.',
        address: 'Av. El Dorado #45-10',
        city: 'Bogotá',
        country: 'Colombia'
      }
    });
  }

  // Create real payments and invoices
  const invoicesData = [
    { num: 'INV-2026-001', amount: 142800, date: new Date('2026-04-01') },
    { num: 'INV-2026-002', amount: 142800, date: new Date('2026-03-01') },
    { num: 'INV-2026-003', amount: 95000, date: new Date('2026-02-15') },
  ];

  for (const data of invoicesData) {
    // Create a payment first
    const payment = await prisma.payment.create({
      data: {
        userId: existingUser!.id,
        amount: data.amount,
        status: 'COMPLETED',
        description: `Pago de membresía ${data.num}`,
        paidAt: data.date,
      }
    });

    // Create the invoice
    await prisma.invoice.upsert({
      where: { invoiceNum: data.num },
      update: {},
      create: {
        paymentId: payment.id,
        userId: existingUser!.id,
        gymId: gym.id,
        invoiceNum: data.num,
        amount: data.amount * 0.81, // Net
        tax: data.amount * 0.19,   // VAT
        total: data.amount,
        status: 'PAID',
        issuedAt: data.date,
      }
    });
  }
  console.log('✅ Facturas reales inyectadas satisfactoriamente.');

  // Also create some test products if they don't exist
  await prisma.product.upsert({
    where: { id: 'test-product-1' },
    update: {},
    create: {
      id: 'test-product-1',
      gymId: gym.id,
      name: 'Proteína Whey Isolate',
      description: 'Proteína de alta calidad para recuperación muscular.',
      price: 45.00,
      stock: 50,
      category: 'Suplementos',
      isActive: true
    }
  });
  console.log('✅ Producto de prueba añadido.');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
