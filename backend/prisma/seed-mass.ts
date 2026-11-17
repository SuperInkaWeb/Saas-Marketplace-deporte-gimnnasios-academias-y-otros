import { PrismaClient, UserRole, ClassType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Script operativo: nunca contra producción; las credenciales llegan por variables de entorno.
if (process.env.NODE_ENV === 'production') {
  console.error('Este script no se puede ejecutar con NODE_ENV=production.');
  process.exit(1);
}
for (const name of ['DATABASE_URL', 'SEED_DEFAULT_PASSWORD']) {
  if (!process.env[name]) {
    console.error(`Falta la variable de entorno ${name}.`);
    process.exit(1);
  }
}

async function main() {
  console.log('🚀 Iniciando Super-Poblamiento de SportNexus...');

  const passwordHash = await bcrypt.hash(process.env.SEED_DEFAULT_PASSWORD!, 10);

  const businessTypes = [
    { name: 'Gym Elite', type: 'GYM', category: 'Fitness & Bodybuilding' },
    { name: 'Soccer Academy', type: 'ACADEMY', category: 'Deportes de Equipo' },
    { name: 'Sport Shop', type: 'SHOP', category: 'Artículos Deportivos' },
  ];

  const suffixes = ['Norte', 'Sur', 'Premium', 'Pro', 'Express', 'Central', 'Plaza', 'Beach', 'Elite', 'Master'];

  for (let i = 1; i <= 15; i++) {
    const bType = businessTypes[i % 3];
    const bName = `${bType.name} ${suffixes[i % suffixes.length]} ${i}`;
    
    // 1. Crear Dueño
    const owner = await prisma.user.create({
      data: {
        email: `dueno${i}@sportnexus.com`,
        passwordHash,
        name: `Dueno ${bName}`,
        role: UserRole.GYM_OWNER,
      },
    });

    // 2. Crear Negocio
    const gym = await prisma.gym.create({
      data: {
        name: bName,
        ownerId: owner.id,
        address: `Calle Deportiva ${i}, Ciudad Central`,
        description: `El mejor centro de ${bType.category} de la zona. 100% equipado.`,
        phone: `+51 900 100 20${i}`,
        status: 'ACTIVE',
      },
    });

    // 3. Crear Membresía/Plán
    await prisma.membershipPlan.create({
      data: {
        gymId: gym.id,
        name: 'Plan Demo Black',
        description: 'Acceso total a las instalaciones y clases.',
        price: 99.99,
        durationDays: 30,
      },
    });

    // 4. Crear Productos (Marketplace)
    if (bType.type === 'SHOP' || bType.type === 'GYM') {
      await prisma.product.createMany({
        data: [
          {
            gymId: gym.id,
            name: `${bType.type === 'SHOP' ? 'Pack Ropa' : 'Proteína'} Pro ${i}`,
            description: 'Calidad superior para rendimiento máximo.',
            price: 45.00,
            stock: 50,
            category: bType.type === 'SHOP' ? 'CLOTHING' : 'SUPPLEMENTS',
          },
          {
            gymId: gym.id,
            name: `Accesorio ${i}`,
            description: 'Ideal para entrenar.',
            price: 15.00,
            stock: 100,
            category: 'GEAR',
          }
        ],
      });
    }

    // 5. Crear Clases (si es Academia o Gym)
    if (bType.type === 'ACADEMY' || bType.type === 'GYM') {
      await prisma.class.create({
        data: {
          gymId: gym.id,
          title: `Sesión de ${bType.category} ${i}`,
          description: 'Entrenamiento dirigido por especialistas.',
          capacity: 20,
          scheduledAt: new Date(),
          durationMin: 60,
          classType: ClassType.IN_PERSON,
        },
      });
    }

    // 6. Crear 10 Clientes
    for (let j = 1; j <= 10; j++) {
      await prisma.user.create({
        data: {
          email: `atleta${i}_${j}@example.com`,
          passwordHash,
          name: `Atleta ${j} de ${bName}`,
          role: UserRole.USER,
        },
      });
    }

    console.log(`✅ Negocio ${i}/15 creado: ${bName}`);
  }

  console.log('✨ Super-Poblamiento completado con éxito.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
