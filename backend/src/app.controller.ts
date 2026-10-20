import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  // AUD-05: se eliminó GET /health/db-debug, que era público y exponía el host y
  // usuario de la base, el conteo de usuarios y trazas de error.
  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      app: 'Sports SaaS Platform API',
      timestamp: new Date().toISOString(),
    };
  }
}
