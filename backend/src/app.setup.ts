import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import type { NestExpressApplication } from '@nestjs/platform-express';

// Swagger solo fuera de producción, salvo que se habilite explícitamente con SWAGGER_ENABLED=true
export const isSwaggerEnabled = (env: NodeJS.ProcessEnv = process.env) =>
  env.NODE_ENV !== 'production' || env.SWAGGER_ENABLED === 'true';

// Configuración de seguridad de la app (AUD-14), compartida por main.ts y los tests.
export function configureSecurity(
  app: INestApplication,
  env: NodeJS.ProcessEnv = process.env,
) {
  const swagger = isSwaggerEnabled(env);

  // Render pone un proxy delante: sin esto todas las peticiones tendrían la IP del proxy
  (app as NestExpressApplication).set(
    'trust proxy',
    Number(env.TRUST_PROXY_HOPS ?? 1),
  );

  app.use(
    helmet({
      // La API solo devuelve JSON; la CSP por defecto rompería la interfaz de Swagger
      contentSecurityPolicy: swagger ? false : undefined,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  if (swagger) {
    const config = new DocumentBuilder()
      .setTitle('Sports SaaS + Marketplace API')
      .setDescription(
        'The core API for managing gyms, trainers, classes, and marketplace products.',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  return { swagger };
}
