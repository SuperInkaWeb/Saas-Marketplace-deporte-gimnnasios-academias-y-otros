import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { configureSecurity } from './app.setup';
import { json, urlencoded } from 'express';
import { checkPaymentsEnv } from './payments/payments-env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Increase payload limit for Base64 local image uploads
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ limit: '10mb', extended: true }));

  // Global API prefix
  app.setGlobalPrefix('api');

  // Proxy, cabeceras de seguridad (helmet) y Swagger (solo fuera de producción)
  const { swagger } = configureSecurity(app);

  // Enable CORS for React frontend
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    /\.onrender\.com$/,
    /\.vercel\.app$/,
    /\.hercix\.com$/,
    'https://hercix.com',
    'https://www.hercix.com',
  ].filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}/api`);
  if (swagger) console.log(`📄 Documentation available at http://localhost:${port}/api/docs`);

  // AUD-10: avisar en los logs si falta configuración de Mercado Pago (no detiene la API)
  const paymentsLogger = new Logger('PaymentsConfig');
  const production = process.env.NODE_ENV === 'production';
  for (const problem of checkPaymentsEnv()) {
    if (production) paymentsLogger.error(problem);
    else paymentsLogger.warn(problem);
  }
}
bootstrap();


