import { JwtService } from '@nestjs/jwt';

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
  const payload = { sub: '5dea10d6-6cf1-4291-8079-bc4f7a7237d6', email: 'st@gmail.com', role: 'GYM_OWNER' };
  const token = await jwtService.signAsync(payload, { expiresIn: '7d' });

  console.log('Sending request to /api/auth/me with local JWT token...');
  try {
    const res = await fetch('http://localhost:3000/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response:', text);
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

main();
