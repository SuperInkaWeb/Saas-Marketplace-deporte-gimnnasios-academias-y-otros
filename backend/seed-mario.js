const { PrismaClient, UserRole, ServiceType } = require('@prisma/client');
const bcrypt = require('bcrypt');
const fs = require('fs');

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

const DISTRICTS = ['Callao', 'Puente Piedra', 'Magdalena', 'La Molina', 'San Juan de Lurigancho', 'Los Olivos'];
const COORDS = {
  'Callao': { lat: -12.0566, lng: -77.1184 },
  'Puente Piedra': { lat: -11.8677, lng: -77.0774 },
  'Magdalena': { lat: -12.0918, lng: -77.0714 },
  'La Molina': { lat: -12.0772, lng: -76.9341 },
  'San Juan de Lurigancho': { lat: -12.0017, lng: -76.9997 },
  'Los Olivos': { lat: -11.9938, lng: -77.0664 },
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// ─── FIXED data — these never change, so seed can run multiple times safely ───
const GYM_NAMES = ['Iron Forge Gym','EliteFit Center','PowerHouse Fitness','Peak Performance','Urban Athletics','FitLife Studio','Olympus Gym','Thunder Fitness','Nexus Sport Club','Apex Gym','Titan Fitness','Velocity Sport','Vanguard Gym','Summit Fitness','Core & Beyond','ProZone Fitness','Eclipse Gym','Kinetic Sport','Zenith Athletics','Meridian Fitness','Forge Athletic','Alpha Gym','Delta Fitness','Omega Sport','Hercules Gym','Atlas Fitness','Spartan Club','Phoenix Gym','Gladiator Fitness','Champion Zone'];
const CLASS_NAMES = ['CrossFit Avanzado','Spinning Intenso','Yoga Dinamico','Zumba Energia','Box con Guantes','Pilates Core','Funcional Extremo','TRX Suspension','Kickboxing Basico','Aerobicos Ritmo','Musculacion Pesada','HIIT Quema Total','GAP Express','Estiramiento Profundo','Salsa Sport','Muay Thai Iniciantes','Calistenia Outdoor','Power Lifting','Atletismo Basico','Natacion Adultos'];
const PRODUCT_NAMES = ['Proteina Whey 2kg','Creatina Monohidrato 500g','BCAA 8:1:1 300g','Pre-Workout Explosion','Glutamina Pura 300g','Multivitaminico Sport','Omega-3 120 capsulas','Colageno Hidrolizado','Barra de Proteina x12','Camiseta Hercix Performance'];

// ─── FIXED owner list (deterministic emails) ───
const OWNER_NAMES = [
  'Carlos Garcia','Luis Rodriguez','Javier Lopez','Andres Martinez','Miguel Gonzalez',
  'Roberto Perez','Diego Sanchez','Alejandro Ramirez','Fernando Torres','Patricia Flores',
  'Maria Rivera','Lucia Gomez','Valentina Diaz','Daniela Cruz','Ana Morales',
  'Carmen Chavez','Rosa Silva','Sofia Mendoza','Gabriela Vega','Jorge Reyes',
  'Alberto Castillo','Eduardo Vargas','Ricardo Romero','Manuel Guerrero','Pablo Herrera',
  'Oscar Jimenez','Victor Medina','Hugo Delgado','Raul Soto','Ivan Aguilar'
];
const COACH_NAMES = [
  'Mateo Rios','Nicolas Fuentes','Sebastian Mora','Andres Pizarro','Felipe Navarro',
  'Camila Ortega','Valeria Rojas','Isabella Castro','Natalia Espinoza','Claudia Rueda',
  'Juan Paredes','Diego Suarez','Fabian Acosta','Emilio Calderon','Marco Lara',
  'Carla Vidal','Paula Cabrera','Diana Montes','Beatriz Zamora','Ignacio Salazar'
];
const ATHLETE_NAMES = [
  'Mateo Perez','Ana Flores','Carlos Mendez','Sofia Vargas','Luis Castillo',
  'Maria Torres','Roberto Diaz','Valentina Rios','Javier Mora','Camila Garcia',
  'Diego Fuentes','Patricia Lopez','Miguel Sanchez','Lucia Martinez','Andres Gomez',
  'Rosa Herrera','Fernando Cruz','Daniela Jimenez','Jorge Romero','Carmen Guerrero',
  'Victor Chavez','Isabel Silva','Pedro Medina','Gabriela Vega','Oscar Reyes',
  'Paula Castillo','Eduardo Vargas','Beatriz Ruiz','Raul Aguilar','Natalia Soto',
  'Marco Paredes','Claudia Acosta','Felipe Castro','Diana Espinoza','Emilio Rojas',
  'Valeria Mora','Nicolas Pizarro','Isabella Navarro','Sebastian Calderon','Carla Lara',
  'Juan Vidal','Fabian Cabrera','Ignacio Montes','Andrea Zamora','Hugo Salazar',
  'Renata Delgado','Alejandro Suarez','Luciana Rivera','Gonzalo Ortega','Elena Quispe',
  'Alvaro Ponce','Yasmin Meza','Brenda Palomino','Kevin Huanca','Sandra Condori',
  'Frank Mamani','Lisbeth Ccopa','Bryan Quispe','Milagros Apaza','Cesar Mamani',
  'Diana Callata','Ronald Flores','Nancy Cutipa','Jhon Lipa','Silvia Ticona',
  'Renzo Zapana','Paola Coaquira','Wilson Turpo','Karina Calisaya','Julio Mamani'
];

function toEmail(name, suffix) {
  return name.toLowerCase().replace(/\s+/g, '.').replace(/[áàä]/g,'a').replace(/[éèë]/g,'e').replace(/[íìï]/g,'i').replace(/[óòö]/g,'o').replace(/[úùü]/g,'u').replace(/[^a-z.]/g,'') + '.' + suffix + '@hercix-demo.com';
}

function log(msg) {
  process.stdout.write(msg + '\n');
  try { fs.appendFileSync('seed-progress.json', JSON.stringify({ status: msg, timestamp: new Date() }) + '\n'); } catch(e) {}
}

async function main() {
  log('=== HERCIX Clean Seed - Iniciando limpieza ===');
  const hash = await bcrypt.hash(process.env.SEED_DEFAULT_PASSWORD, 10);

  // ── 1. CLEAN demo data (keep real Auth0 registered users) ──────────────────
  log('Limpiando datos demo anteriores...');
  // Delete all hercix-demo.com users and their related data (cascade)
  const demoUsers = await prisma.user.findMany({ where: { email: { endsWith: '@hercix-demo.com' } }, select: { id: true } });
  const demoIds = demoUsers.map(u => u.id);
  if (demoIds.length > 0) {
    // Delete in order due to FK constraints
    await prisma.reservation.deleteMany({ where: { userId: { in: demoIds } } });
    await prisma.userMembership.deleteMany({ where: { userId: { in: demoIds } } });
    await prisma.roleRequest.deleteMany({ where: { userId: { in: demoIds } } });
    await prisma.trainerProfile.deleteMany({ where: { userId: { in: demoIds } } });
    await prisma.professionalService.deleteMany({ where: { providerId: { in: demoIds } } });
    // Delete gyms owned by demo owners (classes and products cascade)
    const demoOwnerGyms = await prisma.gym.findMany({ where: { ownerId: { in: demoIds } }, select: { id: true } });
    const gymIds = demoOwnerGyms.map(g => g.id);
    if (gymIds.length > 0) {
      await prisma.reservation.deleteMany({ where: { class: { gymId: { in: gymIds } } } });
      await prisma.class.deleteMany({ where: { gymId: { in: gymIds } } });
      await prisma.product.deleteMany({ where: { gymId: { in: gymIds } } });
      await prisma.gym.deleteMany({ where: { id: { in: gymIds } } });
    }
    await prisma.user.deleteMany({ where: { id: { in: demoIds } } });
    log(`  Eliminados ${demoIds.length} usuarios demo y sus datos.`);
  } else {
    log('  No habia datos demo anteriores.');
  }

  // ── 2. ADMIN accounts ──────────────────────────────────────────────────────
  log('Creando administradores...');
  const admins = [
    { name: 'Mario Solis', email: 'mario123q@gmail.com' },
    { name: 'Sebastian Tixe (Dev)', email: 'sebastian.admin@hercix-demo.com' },
    { name: 'Soporte Tecnico Hercix', email: 'soporte.tecnico@hercix-demo.com' },
    { name: 'Gerente Plataforma', email: 'gerente.plataforma@hercix-demo.com' },
  ];
  for (const a of admins) {
    const ex = await prisma.user.findUnique({ where: { email: a.email } });
    if (!ex) await prisma.user.create({ data: { name: a.name, email: a.email, passwordHash: hash, role: UserRole.ADMIN, isActive: true, emailVerified: true } });
    log(`  Admin: ${a.name}`);
  }

  // ── 3. OWNERS (30 fixed) ───────────────────────────────────────────────────
  log('Creando 30 duenos de gimnasio...');
  for (let i = 0; i < OWNER_NAMES.length; i++) {
    const name = OWNER_NAMES[i];
    const email = toEmail(name, `owner${i+1}`);
    const district = DISTRICTS[i % 6];
    const { lat, lng } = COORDS[district];

    let owner = await prisma.user.findUnique({ where: { email } });
    if (!owner) {
      owner = await prisma.user.create({ data: { name, email, passwordHash: hash, role: UserRole.GYM_OWNER, phone: `+51 9${rnd(10,99)} ${rnd(100,999)} ${rnd(100,999)}`, isActive: true, emailVerified: true } });
    }

    // Create gyms only if owner has none
    const existingGyms = await prisma.gym.count({ where: { ownerId: owner.id } });
    if (existingGyms === 0) {
      const numGyms = i < 5 ? 1 : rnd(2, 10);
      for (let g = 0; g < numGyms; g++) {
        const gymName = GYM_NAMES[i] + (g > 0 ? ` Sede ${g+1}` : '');
        const gym = await prisma.gym.create({ data: {
          ownerId: owner.id, name: gymName,
          description: `Centro deportivo en ${district}, Lima.`,
          address: `Av. Principal ${rnd(100,999)}, ${district}`,
          city: 'Lima', district, province: 'Lima', country: 'Peru',
          latitude: lat + (Math.random()-0.5)*0.02,
          longitude: lng + (Math.random()-0.5)*0.02,
          phone: `+51 1 ${rnd(100,999)}-${rnd(1000,9999)}`,
          status: 'ACTIVE'
        }});

        const numClasses = rnd(2, 10);
        const classes = [...CLASS_NAMES].sort(() => Math.random()-0.5).slice(0, numClasses);
        const base = new Date();
        for (let ci = 0; ci < classes.length; ci++) {
          const scheduledAt = new Date(base.getTime() + (ci+1) * 86400000);
          await prisma.class.create({ data: { gymId: gym.id, title: classes[ci], description: `Clase en ${gymName}.`, classType: pick(['IN_PERSON','ONLINE','HYBRID']), capacity: rnd(10,30), durationMin: pick([45,60,75,90]), price: rnd(20,80), scheduledAt } });
        }

        const numProd = rnd(1, 2);
        const prods = [...PRODUCT_NAMES].sort(() => Math.random()-0.5).slice(0, numProd);
        for (const pname of prods) {
          await prisma.product.create({ data: { gymId: gym.id, name: pname, description: `Producto en ${gymName}.`, price: rnd(25,250), stock: rnd(10,100), category: pick(['Suplementos','Ropa','Accesorios']) } });
        }
      }
    }
    if ((i+1) % 5 === 0) log(`  ${i+1}/30 duenos...`);
  }

  // ── 4. COACHES (20 fixed) ──────────────────────────────────────────────────
  log('Creando 20 entrenadores...');
  for (let i = 0; i < COACH_NAMES.length; i++) {
    const name = COACH_NAMES[i];
    const email = toEmail(name, `coach${i+1}`);
    let coach = await prisma.user.findUnique({ where: { email } });
    if (!coach) {
      coach = await prisma.user.create({ data: { name, email, passwordHash: hash, role: UserRole.TRAINER, phone: `+51 9${rnd(10,99)} ${rnd(100,999)} ${rnd(100,999)}`, isActive: true, emailVerified: true } });
      const tp = await prisma.trainerProfile.findUnique({ where: { userId: coach.id } });
      if (!tp) {
        await prisma.trainerProfile.create({ data: { userId: coach.id, bio: `Entrenador certificado con ${rnd(2,15)} anos de experiencia en Lima.`, specialties: ['Musculacion','Cardio','CrossFit','Funcional'].slice(0,rnd(2,4)), certifications: ['ACE Certified','NASM CPT','CrossFit L1'].slice(0,rnd(1,3)), experienceYears: rnd(2,15), hourlyRate: rnd(30,120), rating: rnd(35,50)/10 } });
      }
      const numSvc = rnd(2, 10);
      for (let s = 0; s < numSvc; s++) {
        await prisma.professionalService.create({ data: { providerId: coach.id, title: `${pick(['Entrenamiento','Plan','Sesion','Programa'])} ${pick(['Personal','Grupal','Online','Presencial'])} - ${name.split(' ')[0]}`, description: `Servicio profesional de ${name}. Duracion: ${rnd(4,12)} semanas.`, serviceType: pick([ServiceType.PERSONAL_TRAINING, ServiceType.NUTRITION_PLAN, ServiceType.PHYSIOTHERAPY, ServiceType.CONSULTATION]), price: rnd(80,500), durationMin: rnd(30,120) } });
      }
    }
    if ((i+1) % 5 === 0) log(`  ${i+1}/20 coaches...`);
  }

  // ── 5. ATHLETES (70 fixed in 6 districts) ─────────────────────────────────
  log('Creando 70 atletas en 6 distritos...');
  for (let i = 0; i < ATHLETE_NAMES.length; i++) {
    const name = ATHLETE_NAMES[i];
    const district = DISTRICTS[i % 6];
    const email = toEmail(name, `atleta${i+1}`);
    const ex = await prisma.user.findUnique({ where: { email } });
    if (!ex) {
      await prisma.user.create({ data: { name, email, passwordHash: hash, role: UserRole.USER, phone: `+51 9${rnd(10,99)} ${rnd(100,999)} ${rnd(100,999)}`, isActive: true, emailVerified: true, weight: rnd(55,100) } });
    }
    if ((i+1) % 10 === 0) log(`  ${i+1}/70 atletas...`);
  }

  const [tu, tg, tc] = await Promise.all([prisma.user.count(), prisma.gym.count(), prisma.class.count()]);
  log(`\n=== SEED COMPLETADO ===`);
  log(`  Usuarios: ${tu} | Gimnasios: ${tg} | Clases: ${tc}`);
  log(`  Password demo: (valor de SEED_DEFAULT_PASSWORD)`);
  try { fs.writeFileSync('seed-progress.json', JSON.stringify({ status: 'COMPLETADO', percent: 100, users: tu, gyms: tg, classes: tc, timestamp: new Date() })); } catch(e) {}
}

main().catch(e => {
  console.error(e);
  try { fs.writeFileSync('seed-progress.json', JSON.stringify({ status: 'ERROR: ' + e.message, percent: -1 })); } catch(ex) {}
  process.exit(1);
}).finally(() => prisma.$disconnect());
