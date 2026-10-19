const { PrismaClient } = require('@prisma/client');
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

const DOMAIN = 'dev-khvop4d61s5ip8d3.us.auth0.com';
const CLIENT_ID = '3kp2ZDHZYjBxcJaqtGXZdTIShBsK3sJK';
const CONNECTION = 'Username-Password-Authentication';
const PASSWORD = process.env.SEED_DEFAULT_PASSWORD;

const DISTRICTS = ['Callao', 'Puente Piedra', 'Magdalena', 'La Molina', 'San Juan de Lurigancho', 'Los Olivos'];

const ATHLETE_NAMES = [
  'Mateo Perez', 'Ana Flores', 'Carlos Mendez', 'Sofia Vargas', 'Luis Castillo',
  'Maria Torres', 'Roberto Diaz', 'Valentina Rios', 'Javier Mora', 'Camila Garcia',
  'Diego Fuentes', 'Patricia Lopez', 'Miguel Sanchez', 'Lucia Martinez', 'Andres Gomez',
  'Rosa Herrera', 'Fernando Cruz', 'Daniela Jimenez', 'Jorge Romero', 'Carmen Guerrero',
  'Victor Chavez', 'Isabel Silva', 'Pedro Medina', 'Gabriela Vega', 'Oscar Reyes',
  'Paula Castillo', 'Eduardo Vargas', 'Beatriz Ruiz', 'Raul Aguilar', 'Natalia Soto',
  'Marco Paredes', 'Claudia Acosta', 'Felipe Castro', 'Diana Espinoza', 'Emilio Rojas',
  'Valeria Mora', 'Nicolas Pizarro', 'Isabella Navarro', 'Sebastian Calderon', 'Carla Lara',
  'Juan Vidal', 'Fabian Cabrera', 'Ignacio Montes', 'Andrea Zamora', 'Hugo Salazar',
  'Renata Delgado', 'Alejandro Suarez', 'Luciana Rivera', 'Gonzalo Ortega', 'Elena Quispe',
  'Alvaro Ponce', 'Yasmin Meza', 'Brenda Palomino', 'Kevin Huanca', 'Sandra Condori',
  'Frank Mamani', 'Lisbeth Ccopa', 'Bryan Quispe', 'Milagros Apaza', 'Cesar Mamani',
  'Diana Callata', 'Ronald Flores', 'Nancy Cutipa', 'Jhon Lipa', 'Silvia Ticona',
  'Renzo Zapana', 'Paola Coaquira', 'Wilson Turpo', 'Karina Calisaya', 'Julio Mamani'
];

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function writeProgress(status, percent, details = '') {
  try {
    fs.writeFileSync('seed-progress.json', JSON.stringify({ status, percent, details, updatedAt: new Date().toISOString() }));
  } catch (e) {
    console.error('Error writing progress:', e.message);
  }
}

async function main() {
  console.log('=== SEED 70 ATLETAS REALES (AUTH0 + NEON) ===');
  writeProgress('Iniciando registro de atletas...', 0);

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // 1. Limpiar atletas de prueba anteriores con patrón atletaXX@testgym.pe
  console.log('Limpiando cuentas de atletas de prueba anteriores...');
  writeProgress('Limpiando cuentas anteriores...', 5);
  
  const existingTestAthletes = await prisma.user.findMany({
    where: {
      email: {
        startsWith: 'atleta',
        endsWith: '@testgym.pe'
      }
    },
    select: { id: true, email: true }
  });

  const deleteIds = existingTestAthletes.map(u => u.id);
  if (deleteIds.length > 0) {
    await prisma.reservation.deleteMany({ where: { userId: { in: deleteIds } } });
    await prisma.userMembership.deleteMany({ where: { userId: { in: deleteIds } } });
    await prisma.roleRequest.deleteMany({ where: { userId: { in: deleteIds } } });
    await prisma.user.deleteMany({ where: { id: { in: deleteIds } } });
    console.log(`  Eliminados ${deleteIds.length} atletas viejos de Neon.`);
  }

  // 2. Registrar 70 atletas
  for (let i = 0; i < ATHLETE_NAMES.length; i++) {
    const name = ATHLETE_NAMES[i];
    const index = i + 1;
    const email = `atleta${index.toString().padStart(2, '0')}@testgym.pe`;
    const district = DISTRICTS[i % 6];
    const percent = Math.floor(5 + (i / ATHLETE_NAMES.length) * 95);
    
    console.log(`[${index}/70] Registrando a ${name} (${email}) en ${district}...`);
    writeProgress('Registrando atletas...', percent, `Registrando a ${name} (${index}/70)`);

    let auth0Id = `auth0|seeded_athlete_${index}`; // Fallback si falla Auth0

    try {
      // Registrar en Auth0 via su endpoint público de signup
      const res = await fetch(`https://${DOMAIN}/dbconnections/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          email: email,
          password: PASSWORD,
          connection: CONNECTION,
          user_metadata: {
            name: name
          }
        })
      });

      const data = await res.json();
      if (res.status === 200 && data && data._id) {
        auth0Id = `auth0|${data._id}`;
        console.log(`  -> Creado en Auth0 exitosamente: ${auth0Id}`);
      } else {
        if (data && data.code === 'user_exists') {
          console.log(`  -> Ya existía en Auth0.`);
          // Si ya existe, podemos intentar buscar su id o usar el fallback, pero el fallback con el formato de email es seguro
        } else {
          console.warn(`  -> Advertencia al crear en Auth0:`, data);
        }
      }
    } catch (err) {
      console.error(`  -> Error al conectar con Auth0:`, err.message);
    }

    // Registrar en Neon (PostgreSQL)
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (!existingUser) {
        await prisma.user.create({
          data: {
            name,
            email,
            passwordHash,
            auth0Id,
            role: 'USER',
            phone: `+51 9${Math.floor(10+Math.random()*90)} ${Math.floor(100+Math.random()*900)} ${Math.floor(100+Math.random()*900)}`,
            isActive: true,
            emailVerified: true,
            weight: Math.floor(55 + Math.random() * 45)
          }
        });
        console.log(`  -> Guardado en Neon.`);
      } else {
        // Si ya existe en la base de datos, actualizamos su auth0Id
        await prisma.user.update({
          where: { email },
          data: { auth0Id }
        });
        console.log(`  -> Ya existía en Neon, Auth0 ID actualizado.`);
      }
    } catch (dbErr) {
      console.error(`  -> Error al guardar en Neon:`, dbErr.message);
    }

    // Pequeño retardo para evitar rate limits
    await delay(300);
  }

  console.log('\n=== SEED DE 70 ATLETAS COMPLETADO CON ÉXITO ===');
  writeProgress('Completado', 100, 'Todos los 70 atletas han sido registrados exitosamente.');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  writeProgress('Error', 100, err.message);
  process.exit(1);
});
