import { PrismaClient, UserRole, ClassType, TicketCategory, TicketStatus } from '@prisma/client';
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

async function clearDB() {
  console.log('🗑️ Limpiando base de datos (excepto Admin)...');
  await prisma.supportTicket.deleteMany({});
  await prisma.reservation.deleteMany({});
  await prisma.class.deleteMany({});
  await prisma.membershipPlan.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.professionalService.deleteMany({});
  await prisma.gym.deleteMany({});
  await prisma.trainerProfile.deleteMany({});
  
  // Keep the ADMIN admin@sportnexus.com
  await prisma.user.deleteMany({
    where: { role: { not: 'ADMIN' } }
  });
  console.log('✅ Base de datos limpia.');
}

async function main() {
  await clearDB();
  const password = await bcrypt.hash(process.env.SEED_DEFAULT_PASSWORD!, 10);

  console.log('🚀 Creando 50 Atletas (Usuarios Finales)...');
  const athletes: any[] = [];
  for (let i = 1; i <= 50; i++) {
    const user = await prisma.user.create({
      data: {
        email: `atleta${i}@correo.com`,
        name: `Atleta ${i}`,
        passwordHash: password,
        role: UserRole.USER,
      }
    });
    athletes.push(user);
  }

  console.log('🚀 Creando 50 Entrenadores (Coaches)...');
  const coaches: any[] = [];
  for (let i = 1; i <= 50; i++) {
    const user = await prisma.user.create({
      data: {
        email: `coach${i}@yahoo.com`,
        name: `Coach ${i} Profesional`,
        passwordHash: password,
        role: UserRole.TRAINER,
        trainerProfile: {
          create: {
            bio: `Entrenador profesional con años de experiencia.`,
            specialties: ['Fitness', 'Entrenamiento Funcional'],
          }
        }
      },
      include: { trainerProfile: true }
    });
    coaches.push(user);
  }

  console.log('🚀 Creando 20 Dueños y sus Franquicias...');
  
  const ownerConfig = [
    { email: 'd1@sportnexus.com', name: 'Academia de Fútbol D1', type: 'Fútbol', locales: 10 },
    { email: 'd2@sportnexus.com', name: 'Academia de Fútbol D2', type: 'Fútbol', locales: 1 },
    { email: 'd3@sportnexus.com', name: 'Gimnasio D3', type: 'Gym', locales: 1 },
    { email: 'd4@sportnexus.com', name: 'Gimnasio D4', type: 'Gym', locales: 5 },
    { email: 'd5@sportnexus.com', name: 'Gimnasio D5', type: 'Gym', locales: 20 },
    { email: 'd6@sportnexus.com', name: 'Academia Vóley D6', type: 'Vóley', locales: 1 },
    { email: 'd7@sportnexus.com', name: 'Academia Vóley D7', type: 'Vóley', locales: 5 },
    { email: 'd8@sportnexus.com', name: 'Academia Vóley D8', type: 'Vóley', locales: 15 },
    { email: 'd9@sportnexus.com', name: 'Básquetbol D9', type: 'Básquet', locales: 1 },
    { email: 'd10@sportnexus.com', name: 'Básquetbol D10', type: 'Básquet', locales: 5 },
    { email: 'd11@sportnexus.com', name: 'Básquetbol D11', type: 'Básquet', locales: 15 },
    { email: 'd12@sportnexus.com', name: 'Tenis D12', type: 'Tenis', locales: 1 },
    { email: 'd13@sportnexus.com', name: 'Tenis D13', type: 'Tenis', locales: 5 },
    { email: 'd14@sportnexus.com', name: 'Tenis D14', type: 'Tenis', locales: 15 },
    { email: 'd15@sportnexus.com', name: 'Atletismo D15', type: 'Atletismo', locales: 1 },
    { email: 'd16@sportnexus.com', name: 'Atletismo D16', type: 'Atletismo', locales: 5 },
    { email: 'd17@sportnexus.com', name: 'Atletismo D17', type: 'Atletismo', locales: 15 },
    { email: 'd18@sportnexus.com', name: 'Natación D18', type: 'Natación', locales: 1 },
    { email: 'd19@sportnexus.com', name: 'Natación D19', type: 'Natación', locales: 5 },
    { email: 'd20@sportnexus.com', name: 'Box D20', type: 'Box', locales: 1 },
  ];

  const allLocales: any[] = [];
  const allClasses: any[] = [];

  for (let i = 0; i < ownerConfig.length; i++) {
    const config = ownerConfig[i];
    const owner = await prisma.user.create({
      data: {
        email: config.email,
        name: `Dueño ${i + 1} (${config.type})`,
        passwordHash: password,
        role: UserRole.GYM_OWNER,
      }
    });

    for (let j = 1; j <= config.locales; j++) {
      const gym = await prisma.gym.create({
        data: {
          name: `${config.name} - Sede ${j}`,
          description: `Sede número ${j} de ${config.name}, con las mejores instalaciones de ${config.type}.`,
          address: `Av. Principal ${Math.floor(Math.random() * 1000)}, Distrito ${j}`,
          city: 'Lima',
          ownerId: owner.id,
        }
      });
      allLocales.push(gym);

      // Generar de 10 a 30 clases por local
      const numClasses = Math.floor(Math.random() * 21) + 10;
      for (let k = 1; k <= numClasses; k++) {
        const coach = coaches[Math.floor(Math.random() * coaches.length)];
        const scheduledAt = new Date();
        scheduledAt.setDate(scheduledAt.getDate() + Math.floor(Math.random() * 7)); // Next 7 days
        scheduledAt.setHours(7 + Math.floor(Math.random() * 12), 0, 0, 0); // 7am to 7pm
        
        const classItem = await prisma.class.create({
          data: {
            title: `Clase de ${config.type} - Nivel ${Math.random() > 0.5 ? 'Básico' : 'Avanzado'}`,
            description: `Entrenamiento intensivo en nuestra sede ${j}.`,
            price: 20 + Math.floor(Math.random() * 30),
            capacity: 15 + Math.floor(Math.random() * 15),
            durationMin: 60,
            scheduledAt,
            gymId: gym.id,
            trainerId: coach.trainerProfile?.id,
            classType: ClassType.IN_PERSON,
            isActive: true,
          }
        });
        allClasses.push(classItem);
      }
    }
    console.log(`✅ ${config.name}: ${config.locales} sedes creadas.`);
  }

  console.log(`✅ Total de Locales creados: ${allLocales.length}`);
  console.log(`✅ Total de Clases creadas: ${allClasses.length}`);

  console.log('🚀 Generando reservas e interacciones...');
  let reservationsCount = 0;
  for (const athlete of athletes) {
    // Each athlete books 3 to 6 classes
    const numBookings = 3 + Math.floor(Math.random() * 4);
    for (let b = 0; b < numBookings; b++) {
      const randomClass = allClasses[Math.floor(Math.random() * allClasses.length)];
      await prisma.reservation.create({
        data: {
          userId: athlete.id,
          classId: randomClass.id,
          status: 'CONFIRMED',
        }
      });
      reservationsCount++;
    }
  }
  console.log(`✅ ${reservationsCount} reservas creadas.`);

  console.log('🚀 Creando Tienda Deportiva (Productos)...');
  const products = [
    { name: 'Proteína Whey 2kg', type: 'suplementos', price: 60 },
    { name: 'Quemador de Grasa', type: 'suplementos', price: 35 },
    { name: 'Multivitamínico Pro', type: 'vitaminas', price: 25 },
    { name: 'Pesas Hexagonales 10kg', type: 'equipos', price: 45 },
    { name: 'Bicicleta Estacionaria', type: 'equipos', price: 250 },
    { name: 'Guantes de Box Profesionales', type: 'equipos', price: 40 },
    { name: 'Kimono para Karate (Gi)', type: 'articulos', price: 55 },
    { name: 'Gafas de Natación Speedo', type: 'articulos', price: 20 },
    { name: 'Gorro de Silicona', type: 'articulos', price: 10 },
    { name: 'Camiseta Dry-Fit', type: 'ropa', price: 25 },
  ];
  
  for (const prod of products) {
    await prisma.product.create({
      data: {
        name: prod.name,
        description: `El mejor producto para tus entrenamientos. Categoría: ${prod.type}`,
        price: prod.price,
        stock: 50,
        imageUrl: `https://via.placeholder.com/300x200?text=${prod.name.replace(/ /g, '+')}`,
        gymId: allLocales[0].id // Assigned to the first gym as a generic store for now
      }
    });
  }

  console.log('🚀 Creando Tickets de Soporte (Quejas)...');
  // Atleta 1 complains about Dueño 1's Gym
  await prisma.supportTicket.create({
    data: {
      userId: athletes[0].id,
      subject: 'Problema con las instalaciones en Sede 1',
      description: 'El gimnasio Sebas (Sede 1) tenía los vestidores cerrados durante mi clase.',
      category: TicketCategory.FACILITY,
      status: TicketStatus.OPEN,
    }
  });
  
  await prisma.supportTicket.create({
    data: {
      userId: athletes[1].id,
      subject: 'Cobro duplicado en mi tarjeta',
      description: 'Reservé la clase de Box pero me cobraron dos veces.',
      category: TicketCategory.PAYMENT,
      status: TicketStatus.IN_REVIEW,
    }
  });
  console.log('✅ Tickets creados.');

  console.log('🎉 SEED MASIVO COMPLETADO EXITOSAMENTE PARA EL GERENTE!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
