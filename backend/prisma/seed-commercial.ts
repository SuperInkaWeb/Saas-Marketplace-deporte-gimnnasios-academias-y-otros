import { PrismaClient, UserRole } from '@prisma/client';
import { fakerES as faker } from '@faker-js/faker';
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

const OWNER_CONFIGS = [
  { name: 'Academia de Fútbol', locations: 10, prefix: 'Fútbol' },
  { name: 'Academia de Fútbol', locations: 1, prefix: 'Fútbol' },
  { name: 'Gimnasio', locations: 1, prefix: 'Gym' },
  { name: 'Gimnasio', locations: 5, prefix: 'Gym' },
  { name: 'Gimnasio', locations: 20, prefix: 'Gym' },
  { name: 'Academia de Vóley', locations: 1, prefix: 'Vóley' },
  { name: 'Academia de Vóley', locations: 5, prefix: 'Vóley' },
  { name: 'Academia de Vóley', locations: 15, prefix: 'Vóley' },
  { name: 'Academia de Básquetbol', locations: 1, prefix: 'Básquet' },
  { name: 'Academia de Básquetbol', locations: 5, prefix: 'Básquet' },
  { name: 'Academia de Básquetbol', locations: 15, prefix: 'Básquet' },
  { name: 'Academia de Tenis', locations: 1, prefix: 'Tenis' },
  { name: 'Academia de Tenis', locations: 5, prefix: 'Tenis' },
  { name: 'Academia de Tenis', locations: 15, prefix: 'Tenis' },
  { name: 'Academia de Atletismo', locations: 1, prefix: 'Atletismo' },
  { name: 'Academia de Atletismo', locations: 5, prefix: 'Atletismo' },
  { name: 'Academia de Atletismo', locations: 15, prefix: 'Atletismo' },
  { name: 'Academia de Natación', locations: 1, prefix: 'Natación' },
  { name: 'Academia de Natación', locations: 5, prefix: 'Natación' },
  { name: 'Academia de Natación', locations: 15, prefix: 'Natación' },
  { name: 'Academia de Box', locations: 1, prefix: 'Box' },
];

async function main() {
  console.log('🚀 Iniciando Seed Comercial Masivo...');

  // 1. Limpieza de base de datos
  console.log('🧹 Limpiando base de datos (preservando Administradores)...');
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.userMembership.deleteMany();
  await prisma.membershipPlan.deleteMany();
  await prisma.product.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.class.deleteMany();
  await prisma.gymTrainer.deleteMany();
  await prisma.trainerProfile.deleteMany();
  await prisma.marketingCampaign.deleteMany();
  await prisma.crmNote.deleteMany();
  await prisma.vendorApplication.deleteMany();
  await prisma.sponsorshipDeal.deleteMany();
  await prisma.gym.deleteMany();
  await prisma.user.deleteMany({
    where: { role: { not: UserRole.ADMIN } }
  });

  const passwordHash = await bcrypt.hash(process.env.SEED_DEFAULT_PASSWORD!, 10);

  // 2. Crear 50 Instructores
  console.log('👥 Creando 50 Instructores...');
  const trainers: any[] = [];
  for (let i = 0; i < 50; i++) {
    const trainerUser = await prisma.user.create({
      data: {
        name: `Instructor ${faker.person.firstName()} ${faker.person.lastName()}`,
        email: faker.internet.email().toLowerCase(),
        passwordHash,
        role: UserRole.TRAINER,
        phone: faker.phone.number(),
        isActive: true,
        trainerProfile: {
          create: {
            bio: faker.lorem.paragraph(),
            specialties: [faker.helpers.arrayElement(['CrossFit', 'Personal Training', 'Yoga', 'HIIT', 'Técnica'])],
            certifications: ['Certificación Nacional'],
            experienceYears: faker.number.int({ min: 1, max: 15 }),
            rating: faker.number.float({ min: 4.0, max: 5.0, fractionDigits: 1 })
          }
        }
      },
      include: { trainerProfile: true }
    });
    trainers.push(trainerUser);
  }

  // 3. Crear Dueños y sus Gimnasios
  console.log('🏢 Creando 21 Dueños y sus 143 Locales...');
  const allGyms: any[] = [];
  
  for (let i = 0; i < OWNER_CONFIGS.length; i++) {
    const config = OWNER_CONFIGS[i];
    
    // Crear Dueño
    const owner = await prisma.user.create({
      data: {
        name: `Dueño ${i + 1} (${config.name})`,
        email: `dueno${i + 1}@sportnexus.com`,
        passwordHash,
        role: UserRole.GYM_OWNER,
        phone: faker.phone.number(),
        isActive: true,
      }
    });

    const brandName = `${faker.company.name()} ${config.prefix}`;

    // Crear locales
    for (let j = 0; j < config.locations; j++) {
      const gym = await prisma.gym.create({
        data: {
          ownerId: owner.id,
          name: `${brandName} - Sede ${faker.location.city()}`,
          description: faker.lorem.paragraph(),
          address: faker.location.streetAddress(),
          city: faker.location.city(),
          phone: faker.phone.number(),
          email: faker.internet.email().toLowerCase(),
          status: 'ACTIVE'
        }
      });
      allGyms.push(gym);

      // Asignar entre 1 y 3 instructores aleatorios a este local
      const numTrainers = faker.number.int({ min: 1, max: 3 });
      const selectedTrainers = faker.helpers.arrayElements(trainers, numTrainers);
      
      for (const t of selectedTrainers) {
        await prisma.gymTrainer.create({
          data: {
            gymId: gym.id,
            trainerId: t.trainerProfile!.id,
            canCreateClasses: true
          }
        });
      }
    }
  }

  // 4. Crear Clases (10-30 por local)
  console.log('📅 Generando miles de clases (esto puede tardar un poco)...');
  const allClasses: any[] = [];
  const now = new Date();

  for (const gym of allGyms) {
    const numClasses = faker.number.int({ min: 10, max: 30 });
    
    // Obtener los entrenadores de este gimnasio
    const gymTrainers = await prisma.gymTrainer.findMany({
      where: { gymId: gym.id },
      include: { trainer: true }
    });

    const gymTrainerIds = gymTrainers.map(gt => gt.trainerId);
    
    const classData: any[] = [];
    for (let c = 0; c < numClasses; c++) {
      const daysToAdd = faker.number.int({ min: -2, max: 10 });
      const hour = faker.number.int({ min: 6, max: 21 });
      const scheduledAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysToAdd, hour, 0, 0);

      const assignedTrainerId = gymTrainerIds.length > 0 ? faker.helpers.arrayElement(gymTrainerIds) : null;

      classData.push({
        gymId: gym.id,
        trainerId: assignedTrainerId,
        title: `Clase de ${faker.commerce.department()} - Nivel ${faker.helpers.arrayElement(['Básico', 'Intermedio', 'Avanzado'])}`,
        description: faker.lorem.sentence(),
        classType: 'IN_PERSON',
        capacity: faker.number.int({ min: 10, max: 50 }),
        durationMin: faker.helpers.arrayElement([45, 60, 90]),
        price: faker.number.int({ min: 10, max: 50 }),
        scheduledAt: scheduledAt,
        isActive: true,
      });
    }

    // Bulk insert classes for this gym
    const created = await prisma.class.createManyAndReturn({
      data: classData as any
    });
    allClasses.push(...created);
  }

  // 5. Crear 50 Usuarios Finales (Atletas)
  console.log('🏃‍♂️ Creando 50 Atletas...');
  const athletes: any[] = [];
  for (let i = 0; i < 50; i++) {
    const athlete = await prisma.user.create({
      data: {
        name: `Atleta ${faker.person.firstName()}`,
        email: `atleta${i + 1}@correo.com`,
        passwordHash,
        role: UserRole.USER,
        phone: faker.phone.number(),
        isActive: true,
      }
    });
    athletes.push(athlete);
  }

  // 6. Generar Reservas cruzadas
  console.log('🎟️ Generando tráfico de reservas cruzadas...');
  const reservationsData: any[] = [];
  
  // Para cada atleta, hacer entre 5 y 15 reservas en clases aleatorias
  for (const athlete of athletes) {
    const numReservations = faker.number.int({ min: 5, max: 15 });
    const selectedClasses = faker.helpers.arrayElements(allClasses, numReservations);
    
    for (const cls of selectedClasses) {
      reservationsData.push({
        userId: athlete.id,
        classId: cls.id,
        status: faker.helpers.arrayElement(['CONFIRMED', 'ATTENDED', 'CONFIRMED']),
      });
    }
  }

  // Bulk insert reservations
  // Prisma doesn't have createMany with ignore duplicates for Postgres without native unique constraints sometimes failing if overlapping arrayElements.
  // We'll use a standard loop to avoid unique constraint crashes if an athlete picked the same class twice by chance.
  let reservationCount = 0;
  for (const res of reservationsData) {
    try {
      await prisma.reservation.create({ data: res as any });
      reservationCount++;
    } catch (e) {
      // Ignore unique constraint violations (user booking same class twice)
    }
  }

  console.log(`\n✅ ¡Seed Comercial Completado con Éxito!`);
  console.log(`- Instructores: 50`);
  console.log(`- Dueños: 21`);
  console.log(`- Gimnasios/Sucursales: ${allGyms.length}`);
  console.log(`- Clases Programadas: ${allClasses.length}`);
  console.log(`- Atletas: 50`);
  console.log(`- Reservas Realizadas: ${reservationCount}`);
  console.log(`\n¡El Sr. Mario va a alucinar con este volumen de datos!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
