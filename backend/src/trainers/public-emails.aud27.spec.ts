import { TrainersService } from './trainers.service';
import { GymsService } from '../gyms/gyms.service';
import { ProfessionalsService } from '../professionals/professionals.service';
import { PrismaService } from '../prisma/prisma.service';
import { GymAccessService } from '../common/gym-access/gym-access.service';
import { NotificationsService } from '../notifications/notifications.service';

// AUD-27: los listados públicos no deben devolver el email personal de dueños,
// entrenadores ni profesionales. Solo el dueño del gimnasio (o un ADMIN) ve el
// email de su propio staff en GET /trainers/gym/:gymId.

const fullUser = (id: string) => ({
  id,
  name: `Nombre ${id}`,
  email: `${id}@example.com`,
  avatarUrl: null,
  phone: '999999999',
  passwordHash: '$2b$10$hash-de-prueba',
});

// Simula Prisma: con `select` devuelve solo los campos pedidos.
const project = (row: Record<string, any>, arg: any) =>
  Object.fromEntries(Object.keys(arg.select).map((k) => [k, row[k]]));

describe('AUD-27: emails fuera de los listados públicos', () => {
  describe('TrainersService', () => {
    let service: TrainersService;
    let prisma: any;

    beforeEach(() => {
      prisma = {
        trainerProfile: {
          findMany: jest.fn((args: any) =>
            Promise.resolve([
              {
                id: 'tp-1',
                userId: 'trainer-1',
                specialties: ['Crossfit'],
                user: project(fullUser('trainer-1'), args.include.user),
              },
            ]),
          ),
        },
        gymTrainer: {
          findMany: jest.fn((args: any) =>
            Promise.resolve([
              {
                gymId: 'gym-1',
                trainerId: 'tp-1',
                canCreateClasses: true,
                trainer: {
                  id: 'tp-1',
                  user: project(fullUser('trainer-1'), args.include.trainer.include.user),
                },
              },
            ]),
          ),
        },
        gym: {
          findUnique: jest.fn().mockResolvedValue({ ownerId: 'owner-1' }),
        },
      };
      service = new TrainersService(prisma as unknown as PrismaService);
    });

    it('GET /trainers no devuelve el email de ningún entrenador', async () => {
      const [trainer] = await service.findAll();
      expect(trainer.user).toEqual({ id: 'trainer-1', name: 'Nombre trainer-1', avatarUrl: null });
      expect(trainer.user).not.toHaveProperty('email');
      expect(trainer.specialties).toEqual(['Crossfit']);
    });

    it('GET /trainers/gym/:id sin login no devuelve el email', async () => {
      const [link] = await service.getGymTrainers('gym-1', null);
      expect(link.trainer.user).not.toHaveProperty('email');
      expect(prisma.gym.findUnique).not.toHaveBeenCalled();
    });

    it('un atleta logueado no ve el email', async () => {
      const [link] = await service.getGymTrainers('gym-1', { id: 'athlete-1', role: 'USER' });
      expect(link.trainer.user).not.toHaveProperty('email');
    });

    it('el dueño de OTRO gimnasio no ve el email', async () => {
      const [link] = await service.getGymTrainers('gym-1', { id: 'owner-2', role: 'GYM_OWNER' });
      expect(link.trainer.user).not.toHaveProperty('email');
    });

    it('un entrenador no ve el email de sus compañeros', async () => {
      const [link] = await service.getGymTrainers('gym-1', { id: 'trainer-2', role: 'TRAINER' });
      expect(link.trainer.user).not.toHaveProperty('email');
    });

    it('si el gimnasio no existe no se devuelve el email', async () => {
      prisma.gym.findUnique.mockResolvedValueOnce(null);
      const [link] = await service.getGymTrainers('gym-x', { id: 'owner-1', role: 'GYM_OWNER' });
      expect(link.trainer.user).not.toHaveProperty('email');
    });

    it('el dueño del gimnasio sí ve el email de su staff', async () => {
      const [link] = await service.getGymTrainers('gym-1', { id: 'owner-1', role: 'GYM_OWNER' });
      expect(link.trainer.user.email).toBe('trainer-1@example.com');
      expect(link.trainer.user).not.toHaveProperty('passwordHash');
    });

    it('un ADMIN sí ve el email', async () => {
      const [link] = await service.getGymTrainers('gym-1', { id: 'admin-1', role: 'ADMIN' });
      expect(link.trainer.user.email).toBe('trainer-1@example.com');
      expect(prisma.gym.findUnique).not.toHaveBeenCalled();
    });
  });

  it('GymsService.findAll (GET /gyms y /gyms/nearby) no devuelve el email del dueño', async () => {
    const prisma = {
      gym: {
        findMany: jest.fn((args: any) =>
          Promise.resolve([
            {
              id: 'gym-1',
              name: 'Gym',
              owner: project(fullUser('owner-1'), args.include.owner),
              gymTrainers: [],
            },
          ]),
        ),
      },
    };
    const service = new GymsService(
      prisma as unknown as PrismaService,
      {} as unknown as GymAccessService,
    );
    const [gym] = await service.findAll();
    expect(gym.owner).toEqual({ id: 'owner-1', name: 'Nombre owner-1', avatarUrl: null });
  });

  it('ProfessionalsService.findAll (GET /professionals) no devuelve el email del profesional', async () => {
    const prisma = {
      professionalService: {
        findMany: jest.fn((args: any) =>
          Promise.resolve([
            {
              id: 'svc-1',
              providerId: 'pro-1',
              provider: project(fullUser('pro-1'), args.include.provider),
            },
          ]),
        ),
      },
    };
    const service = new ProfessionalsService(
      prisma as unknown as PrismaService,
      {} as unknown as NotificationsService,
    );
    const [svc] = await service.findAll();
    expect(svc.provider).toEqual({ id: 'pro-1', name: 'Nombre pro-1', avatarUrl: null });
  });
});
