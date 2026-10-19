import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('healthCheck', () => {
    it('should return status ok', () => {
      const result = appController.healthCheck();
      expect(result.status).toBe('ok');
    });

    it('does not expose database details', () => {
      const result = appController.healthCheck();
      expect(JSON.stringify(result)).not.toMatch(/postgres|DATABASE_URL|userCount|stack/i);
    });
  });

  describe('AUD-05', () => {
    it('no longer exposes GET /health/db-debug', () => {
      const routes = Object.getOwnPropertyNames(AppController.prototype)
        .filter((name) => name !== 'constructor')
        .map((name) => Reflect.getMetadata('path', AppController.prototype[name]))
        .filter(Boolean);
      expect(routes).toEqual(['health']);
    });
  });
});

