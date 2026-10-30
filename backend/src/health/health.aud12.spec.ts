import { ForbiddenException, NotFoundException, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { PrismaService } from '../prisma/prisma.service';
import { RolesGuard } from '../auth/guards/roles.guard';

// Escenario (AUD-12): 'athlete' tiene membresía activa en un gimnasio donde entrena 'coach'.
// 'intruder' es otro atleta y 'other-coach' un entrenador de otro gimnasio.
const USERS = { athlete: 'USER', intruder: 'USER', coach: 'TRAINER', 'other-coach': 'TRAINER', admin: 'ADMIN' };
const req = (id: keyof typeof USERS) => ({ user: { id, role: USERS[id] } });

const build = () => {
  const prisma = {
    healthMetric: { findMany: jest.fn(async () => [{ type: 'WEIGHT', value: 80 }]) },
    userGoal: {
      findUnique: jest.fn(async () => ({ userId: 'athlete', targetCalories: 600 })),
      create: jest.fn(),
      upsert: jest.fn(async (args: any) => args.create),
    },
    coachRecommendation: {
      create: jest.fn(async (args: any) => ({ id: 'rec-1', ...args.data })),
      findMany: jest.fn(async () => [{ observation: 'Dormir 8 h' }]),
    },
    userMembership: {
      findFirst: jest.fn(async (args: any) => {
        const coach = args?.where?.plan?.gym?.gymTrainers?.some?.trainer?.userId;
        return args?.where?.userId === 'athlete' && coach === 'coach' ? { id: 'm-1' } : null;
      }),
    },
    user: { findUnique: jest.fn(async (args: any) => (args.where.id in USERS ? { id: args.where.id } : null)) },
    activityMET: { upsert: jest.fn(), findUnique: jest.fn(), delete: jest.fn() },
  };
  const service = new HealthService(prisma as unknown as PrismaService);
  return { prisma, controller: new HealthController(service) };
};

// Mismo ValidationPipe que main.ts, con el tipo que declara el controlador
const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
const validateBody = (method: keyof HealthController, index: number, body: any) => {
  const metatype = Reflect.getMetadata('design:paramtypes', HealthController.prototype, method)[index];
  return pipe.transform(body, { type: 'body', metatype });
};

// Ejecuta los guards declarados en la ruta (además del JwtAuthGuard del controlador)
const routeAllows = (method: keyof HealthController, role: string) => {
  const guards: any[] = Reflect.getMetadata(GUARDS_METADATA, HealthController.prototype[method]) ?? [];
  if (!guards.includes(RolesGuard)) return true;
  const ctx: any = {
    getHandler: () => HealthController.prototype[method],
    getClass: () => HealthController,
    switchToHttp: () => ({ getRequest: () => ({ user: { id: 'u', role } }) }),
  };
  try {
    return new RolesGuard(new Reflector()).canActivate(ctx);
  } catch {
    return false;
  }
};

describe('AUD-12: control de acceso en health', () => {
  describe('H-04: configuración MET solo para ADMIN', () => {
    it.each(['upsertMET', 'deleteMET', 'getMETs'] as const)('%s: un USER o TRAINER no pasa, ADMIN sí', (method) => {
      expect(routeAllows(method, 'USER')).toBe(false);
      expect(routeAllows(method, 'TRAINER')).toBe(false);
      expect(routeAllows(method, 'ADMIN')).toBe(true);
    });

    it('POST admin/met rechaza un metValue negativo', async () => {
      await expect(
        validateBody('upsertMET', 0, { name: 'Yoga', metValue: -5, intensity: 'BAJA' }),
      ).rejects.toThrow();
    });
  });

  describe('H-05: métricas y metas de otro usuario', () => {
    it('GET metrics/:userId: otro atleta recibe 403', async () => {
      const { controller } = build();
      await expect(controller.findUserMetrics(req('intruder'), 'athlete')).rejects.toThrow(ForbiddenException);
    });

    it('GET goals/:userId: un entrenador de otro gimnasio recibe 403', async () => {
      const { controller } = build();
      await expect(controller.findUserGoal(req('other-coach'), 'athlete')).rejects.toThrow(ForbiddenException);
    });

    it.each(['athlete', 'coach', 'admin'] as const)('GET metrics/:userId y goals/:userId: %s sí accede', async (who) => {
      const { controller } = build();
      await expect(controller.findUserMetrics(req(who), 'athlete')).resolves.toHaveLength(1);
      await expect(controller.findUserGoal(req(who), 'athlete')).resolves.toMatchObject({ userId: 'athlete' });
    });
  });

  describe('H-40: recomendaciones de coach', () => {
    it('POST recommendations: un atleta cualquiera no puede escribirle a otro (403)', async () => {
      const { controller, prisma } = build();
      await expect(
        controller.addRecommendation(req('intruder'), { athleteId: 'athlete', observation: 'Compra mis suplementos' }),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.coachRecommendation.create).not.toHaveBeenCalled();
    });

    it('POST recommendations: el coach vinculado sí puede', async () => {
      const { controller } = build();
      await expect(
        controller.addRecommendation(req('coach'), { athleteId: 'athlete', observation: 'Subir agua a 2 L' }),
      ).resolves.toMatchObject({ coachId: 'coach', athleteId: 'athlete' });
    });

    it('POST recommendations: ADMIN con un atleta inexistente recibe 404 (antes 500)', async () => {
      const { controller } = build();
      await expect(
        controller.addRecommendation(req('admin'), { athleteId: 'no-existe', observation: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('POST recommendations: rechaza una observación de 200 KB', async () => {
      await expect(
        validateBody('addRecommendation', 1, { athleteId: 'athlete', observation: 'a'.repeat(200_000) }),
      ).rejects.toThrow();
    });

    it('GET recommendations/:athleteId: otro atleta recibe 403', async () => {
      const { controller } = build();
      await expect(controller.getRecommendations(req('intruder'), 'athlete')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('H-39: asignación masiva en POST /health/goals', () => {
    it('el body no puede traer userId (el ValidationPipe lo rechaza)', async () => {
      await expect(
        validateBody('updateGoal', 1, { targetCalories: 1, targetSteps: 1, targetWater: 1, userId: 'athlete' }),
      ).rejects.toThrow();
    });

    it('la meta siempre se guarda para el usuario del token', async () => {
      const { controller, prisma } = build();
      const body: any = { targetCalories: 1, targetSteps: 1, targetWater: 1, userId: 'athlete' };
      await controller.updateGoal(req('intruder'), body);

      const args = prisma.userGoal.upsert.mock.calls[0][0];
      expect(args.where).toEqual({ userId: 'intruder' });
      expect(args.create.userId).toBe('intruder');
      expect(args.update).not.toHaveProperty('userId');
    });
  });
});
