/**
 * HERCIX – Script de Seed Masivo para Demo
 * Crea: 4 Admins, 30 Dueños (con locales), 20 Coaches, 70 Atletas
 * Distribuidos en 6 distritos de Lima: Callao, Puente Piedra, Magdalena,
 * La Molina, San Juan de Lurigancho (SJL), Los Olivos
 *
 * Ejecutar: npx ts-node -r tsconfig-paths/register prisma/seed-demo-mario.ts
 */

import { PrismaClient, UserRole, ServiceType } from '@prisma/client';
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

// ── Configuración ─────────────────────────────────────────────────────────────
const DISTRICTS = ['Callao', 'Puente Piedra', 'Magdalena', 'La Molina', 'San Juan de Lurigancho', 'Los Olivos'];
const DEFAULT_PASS = process.env.SEED_DEFAULT_PASSWORD!;

// Coordenadas aproximadas por distrito
const COORDS: Record<string, { lat: number; lng: number }> = {
  'Callao':                 { lat: -12.0566, lng: -77.1184 },
  'Puente Piedra':          { lat: -11.8677, lng: -77.0774 },
  'Magdalena':              { lat: -12.0918, lng: -77.0714 },
  'La Molina':              { lat: -12.0772, lng: -76.9341 },
  'San Juan de Lurigancho': { lat: -12.0017, lng: -76.9997 },
  'Los Olivos':             { lat: -11.9938, lng: -77.0664 },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const uuid4 = () => require('crypto').randomUUID();

const gymNames = [
  'Iron Forge Gym', 'EliteFit Center', 'PowerHouse Fitness', 'Peak Performance',
  'Urban Athletics', 'FitLife Studio', 'Olympus Gym', 'Thunder Fitness',
  'Nexus Sport Club', 'Apex Gym', 'Titan Fitness', 'Velocity Sport',
  'Vanguard Gym', 'Summit Fitness', 'Core & Beyond', 'ProZone Fitness',
  'Eclipse Gym', 'Kinetic Sport', 'Zenith Athletics', 'Meridian Fitness',
  'Forge Athletic', 'Alpha Gym', 'Delta Fitness', 'Omega Sport',
  'Hercules Gym', 'Atlas Fitness', 'Spartan Club', 'Phoenix Gym',
  'Gladiator Fitness', 'Champion Zone',
];

const classNames = [
  'CrossFit Avanzado', 'Spinning Intenso', 'Yoga Dinámico', 'Zumba Energía',
  'Box con Guantes', 'Pilates Core', 'Funcional Extremo', 'TRX Suspensión',
  'Kickboxing Básico', 'Aeróbicos Ritmo', 'Musculación Pesada', 'HIIT Quema Total',
  'GAP Express', 'Estiramiento Profundo', 'Salsa Sport', 'Muay Thai Iniciantes',
  'Calistenia Outdoor', 'Power Lifting', 'Atletismo Básico', 'Natación Adultos',
];

const productNames = [
  'Proteína Whey 2kg', 'Creatina Monohidrato 500g', 'BCAA 8:1:1 300g',
  'Pre-Workout Explosion', 'Glutamina Pura 300g', 'Multivitamínico Sport',
  'Omega-3 120 cápsulas', 'Colágeno Hidrolizado', 'Barra de Proteína x12',
  'Camiseta Hercix Performance', 'Short Compresión', 'Guantes de Gym',
  'Banda de Resistencia Kit', 'Cuerda para Saltar Pro', 'Botella Térmica 1L',
  'Rodilleras Sport Pro', 'Foam Roller 45cm', 'Toalla Microfibra XL',
  'Shaker Pro 700ml', 'Mochila Gym Bag',
];

const serviceTypes: ServiceType[] = [
  ServiceType.PERSONAL_TRAINING, ServiceType.NUTRITION_PLAN, ServiceType.PHYSIOTHERAPY, ServiceType.CONSULTATION,
];

const maleNames = ['Carlos', 'Luis', 'Javier', 'Andrés', 'Miguel', 'Roberto', 'Diego', 'Sebastián', 'Alejandro', 'Fernando', 'Jorge', 'Raúl', 'Pablo', 'Eduardo', 'Oscar'];
const femaleNames = ['María', 'Lucía', 'Valentina', 'Daniela', 'Ana', 'Carmen', 'Rosa', 'Patricia', 'Gabriela', 'Sofía', 'Isabel', 'Elena', 'Natalia', 'Paola', 'Claudia'];
const lastNames = ['García', 'Rodríguez', 'López', 'Martínez', 'González', 'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Cruz', 'Morales'];

function randomName() {
  const allFirst = [...maleNames, ...femaleNames];
  return `${pick(allFirst)} ${pick(lastNames)}`;
}

function randomEmail(name: string, suffix: string) {
  return `${name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '.')}.${suffix}@hercix-demo.com`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🏋️  HERCIX Seed Demo – Iniciando...\n');
  const passwordHash = await bcrypt.hash(DEFAULT_PASS, 10);

  // ── 1. Admins (máximo 4) ────────────────────────────────────────────────────
  console.log('👑 Creando 4 Administradores...');
  const admins: any[] = [];
  const adminData = [
    { name: 'Mario Solís (Super Admin)', email: 'mario123q@gmail.com' },
    { name: 'Sebastián Tixe (Dev)', email: 'sebastian.admin@hercix-demo.com' },
    { name: 'Soporte Técnico Hercix', email: 'soporte.tecnico@hercix-demo.com' },
    { name: 'Gerente Plataforma', email: 'gerente.plataforma@hercix-demo.com' },
  ];

  for (const ad of adminData) {
    const existing = await prisma.user.findUnique({ where: { email: ad.email } });
    if (!existing) {
      const a = await prisma.user.create({
        data: { name: ad.name, email: ad.email, passwordHash, role: UserRole.ADMIN, isActive: true, emailVerified: true },
      });
      admins.push(a);
      console.log(`  ✅ ${ad.name}`);
    } else {
      admins.push(existing);
      console.log(`  ⏭️  ${ad.name} (ya existe)`);
    }
  }

  // ── 2. Dueños de Gimnasio (30) ───────────────────────────────────────────────
  console.log('\n🏢 Creando 30 Dueños de Gimnasio...');
  const owners: any[] = [];

  for (let i = 0; i < 30; i++) {
    const name = randomName();
    const email = randomEmail(name, `owner${i + 1}`);
    const district = DISTRICTS[i % 6];
    const existing = await prisma.user.findUnique({ where: { email } });

    if (!existing) {
      const owner = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: UserRole.GYM_OWNER,
          phone: `+51 9${rnd(10, 99)} ${rnd(100, 999)} ${rnd(100, 999)}`,
          isActive: true,
          emailVerified: true,
        },
      });
      owners.push({ user: owner, district });
    } else {
      owners.push({ user: existing, district });
    }

    // Crear locales: primeros 5 owners tienen 1 local; los demás de 2 a 10
    const numGyms = i < 5 ? 1 : rnd(2, 10);
    const { lat, lng } = COORDS[district];

    for (let g = 0; g < numGyms; g++) {
      const gymName = g === 0 ? pick(gymNames) : `${pick(gymNames)} - Sede ${g + 1}`;
      const existingGym = await prisma.gym.findFirst({
        where: { ownerId: owners[i].user.id, name: { contains: gymName.split(' ')[0] } }
      });

      if (!existingGym) {
        const gym = await prisma.gym.create({
          data: {
            ownerId: owners[i].user.id,
            name: gymName,
            description: `Gimnasio de alta calidad en ${district}. Equipamiento de última tecnología.`,
            address: `Av. Principal ${rnd(100, 999)}, ${district}`,
            city: 'Lima',
            district,
            province: 'Lima',
            country: 'Perú',
            latitude: lat + (Math.random() - 0.5) * 0.02,
            longitude: lng + (Math.random() - 0.5) * 0.02,
            phone: `+51 1 ${rnd(100, 999)}-${rnd(1000, 9999)}`,
            status: 'ACTIVE',
          },
        });

        // Crear clases para cada gimnasio (mín 2, máx 10)
        const numClasses = rnd(2, 10);
        const shuffledClasses = [...classNames].sort(() => Math.random() - 0.5).slice(0, numClasses);
        const baseDate = new Date();
        for (let ci = 0; ci < shuffledClasses.length; ci++) {
          const classTitle = shuffledClasses[ci];
          const scheduledAt = new Date(baseDate.getTime() + ci * 24 * 60 * 60 * 1000); // dias futuros
          await prisma.class.create({
            data: {
              gymId: gym.id,
              title: classTitle,
              description: `Clase de ${classTitle} en ${gymName}. Todos los niveles bienvenidos.`,
              classType: pick(['IN_PERSON', 'ONLINE', 'HYBRID'] as const),
              capacity: rnd(10, 30),
              durationMin: pick([45, 60, 75, 90]),
              price: rnd(20, 80),
              scheduledAt,
            },
          });
        }

        // Crear productos para cada gimnasio (máx 2)
        const numProducts = rnd(1, 2);
        const shuffledProducts = [...productNames].sort(() => Math.random() - 0.5).slice(0, numProducts);
        for (const productName of shuffledProducts) {
          await prisma.product.create({
            data: {
              gymId: gym.id,
              name: productName,
              description: `${productName} de alta calidad. Disponible en tienda ${gymName}.`,
              price: rnd(25, 250),
              stock: rnd(10, 100),
              category: pick(['Suplementos', 'Ropa', 'Accesorios', 'Equipamiento']),
            },
          });
        }
      }
    }
    if ((i + 1) % 5 === 0) console.log(`  ✅ ${i + 1}/30 dueños creados...`);
  }

  // ── 3. Coaches (20) ──────────────────────────────────────────────────────────
  console.log('\n🏆 Creando 20 Entrenadores (Coaches)...');
  for (let i = 0; i < 20; i++) {
    const name = randomName();
    const email = randomEmail(name, `coach${i + 1}`);
    const existing = await prisma.user.findUnique({ where: { email } });

    if (!existing) {
      const coach = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: UserRole.TRAINER,
          phone: `+51 9${rnd(10, 99)} ${rnd(100, 999)} ${rnd(100, 999)}`,
          isActive: true,
          emailVerified: true,
        },
      });

      // Crear perfil de entrenador
      const trainerProfile = await prisma.trainerProfile.create({
        data: {
          userId: coach.id,
          bio: `Entrenador certificado con ${rnd(2, 15)} años de experiencia. Especialista en fitness y rendimiento deportivo.`,
          specialties: ['Musculación', 'Cardio', 'CrossFit', 'Funcional'].sort(() => Math.random() - 0.5).slice(0, rnd(2, 4)),
          certifications: ['ACE Certified', 'NASM CPT', 'CrossFit Level 1'].sort(() => Math.random() - 0.5).slice(0, rnd(1, 3)),
          experienceYears: rnd(2, 15),
          hourlyRate: rnd(30, 120),
          rating: rnd(35, 50) / 10,
        },
      });

      // Crear servicios profesionales (mín 2, máx 10)
      const numServices = rnd(2, 10);
      for (let s = 0; s < numServices; s++) {
        await prisma.professionalService.create({
          data: {
            providerId: coach.id,
            title: `${pick(['Entrenamiento', 'Sesión', 'Plan', 'Consulta'])} ${pick(['Personal', 'Grupal', 'Online', 'Intensivo'])} – ${coach.name.split(' ')[0]}`,
            description: `Servicio profesional personalizado. ${rnd(4, 12)} semanas de programa estructurado.`,
            serviceType: pick(serviceTypes),
            price: rnd(80, 500),
            durationMin: rnd(30, 120),
          },
        });
      }
    }

    if ((i + 1) % 5 === 0) console.log(`  ✅ ${i + 1}/20 coaches creados...`);
  }

  // ── 4. Atletas / Usuarios (70) ──────────────────────────────────────────────
  console.log('\n🏃 Creando 70 Atletas distribuidos en 6 distritos...');
  for (let i = 0; i < 70; i++) {
    const name = randomName();
    const district = DISTRICTS[i % 6];
    const email = randomEmail(name, `atleta${i + 1}`);
    const existing = await prisma.user.findUnique({ where: { email } });

    if (!existing) {
      await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: UserRole.USER,
          phone: `+51 9${rnd(10, 99)} ${rnd(100, 999)} ${rnd(100, 999)}`,
          isActive: true,
          emailVerified: true,
          weight: rnd(55, 100),
        },
      });
    }

    if ((i + 1) % 10 === 0) console.log(`  ✅ ${i + 1}/70 atletas creados...`);
  }

  // ── Resumen final ────────────────────────────────────────────────────────────
  const totalUsers = await prisma.user.count();
  const totalGyms = await prisma.gym.count();
  const totalClasses = await prisma.class.count();
  const totalProducts = await prisma.product.count();
  const totalServices = await prisma.professionalService.count();

  console.log('\n🎉 ¡SEED COMPLETADO EXITOSAMENTE!\n');
  console.log('────────────────────────────────────');
  console.log(`👥 Total Usuarios:    ${totalUsers}`);
  console.log(`🏢 Total Gimnasios:   ${totalGyms}`);
  console.log(`🏋️  Total Clases:      ${totalClasses}`);
  console.log(`📦 Total Productos:   ${totalProducts}`);
  console.log(`🎯 Total Servicios:   ${totalServices}`);
  console.log('────────────────────────────────────');
  console.log(`\n🔑 Contraseña de TODAS las cuentas demo: ${DEFAULT_PASS}`);
  console.log('🔑 Cuenta Admin Principal: mario.admin@hercix-demo.com');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
