import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      app: 'Sports SaaS Platform API',
      timestamp: new Date().toISOString(),
    };
  }
}

