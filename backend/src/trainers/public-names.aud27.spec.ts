import { TrainersService } from './trainers.service';
import { GymsService } from '../gyms/gyms.service';
import { ProfessionalsService } from '../professionals/professionals.service';
import { PrismaService } from '../prisma/prisma.service';
import { GymAccessService } from '../common/gym-access/gym-access.service';
import { NotificationsService } from '../notifications/notifications.service';
import { publicName } from '../common/utils/normalize-name';

// AUD-27 (residual): en cuentas antiguas el nombre quedó guardado como el email.
// Las respuestas públicas no deben exponerlo a través del campo `name`.

const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;

const user = (id: string, name: string) => ({ id, name, avatarUrl: null });

const project = (row: Record<string, any>, arg: any) =>
  Object.fromEntries(Object.keys(arg.select).map((k) => [k, row[k]]));

const fullUser = (id: string, name: string) => ({
  ...user(id, name),
  email: `${id}@example.com`,
});

describe('AUD-27: nombres con forma de email en respuestas públicas', () => {
  describe('publicName', () => {
    it('reemplaza un nombre que es un email', () => {
      expect(publicName('juan.perez@gmail.com', 'Entrenador')).toBe(
        'Entrenador',
      );
    });
    it('reemplaza un nombre que contiene un email', () => {
      expect(publicName('Juan juan@gmail.com', 'Entrenador')).toBe(
        'Entrenador',
      );
    });
    it('conserva un nombre normal', () => {
      expect(publicName('  Juan   Pérez ', 'Entrenador')).toBe('Juan Pérez');
    });
    it('conserva un nombre con @ que no es email', () => {
      expect(publicName('Team @Hercix', 'Entrenador')).toBe('Team @Hercix');
    });
    it('deja vacío un nombre vacío', () => {
      expect(publicName(null, 'Entrenador')).toBe('');
    });
  });

  describe('TrainersService', () => {
    let service: TrainersService;
    let prisma: any;

    beforeEach(() => {
      prisma = {
        trainerProfile: {
          findMany: jest.fn().mockResolvedValue([
            { id: 'tp-1', user: user('t-1', 'cl.trainer@hercix-demo.com') },
            { id: 'tp-2', user: user('t-2', 'María López') },
          ]),
        },
        gymTrainer: {
          findMany: jest.fn((args: any) =>
            Promise.resolve([
              {
                gymId: 'gym-1',
                trainer: {
                  id: 'tp-1',
                  user: project(
                    fullUser('t-1', 'cl.trainer@hercix-demo.com'),
                    args.include.trainer.include.user,
                  ),
                },
              },
            ]),
          ),
        },
        gym: {
          findUnique: jest.fn().mockResolvedValue({ ownerId: 'owner-1' }),
        },
      };
      service = new TrainersService(prisma);
    });

    it('GET /trainers no expone el email en el nombre', async () => {
      const [a, b] = await service.findAll();
      expect(a.user.name).toBe('Entrenador');
      expect(b.user.name).toBe('María López');
    });

    it('GET /trainers/gym/:id sin login no expone el email en el nombre', async () => {
      const [link] = await service.getGymTrainers('gym-1', null);
      expect(JSON.stringify(link)).not.toMatch(EMAIL);
      expect(link.trainer.user.name).toBe('Entrenador');
    });

    it('el dueño del gimnasio sigue viendo los datos de su staff', async () => {
      const [link] = await service.getGymTrainers('gym-1', {
        id: 'owner-1',
        role: 'GYM_OWNER',
      });
      expect((link.trainer.user as { email?: string }).email).toBe(
        't-1@example.com',
      );
      expect(link.trainer.user.name).toBe('cl.trainer@hercix-demo.com');
    });
  });

  describe('GymsService', () => {
    const prisma = {
      gym: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'gym-1',
            name: 'Gym',
            ownerId: 'o-1',
            status: 'ACTIVE',
            latitude: -12.05,
            longitude: -77.04,
            owner: user('o-1', 'al.owner@hercix-demo.com'),
            gymTrainers: [],
          },
          {
            id: 'gym-2',
            name: 'Gym 2',
            ownerId: 'o-2',
            status: 'ACTIVE',
            latitude: -12.05,
            longitude: -77.04,
            owner: user('o-2', 'Ana Ruiz'),
            gymTrainers: [],
          },
        ]),
        findUnique: jest.fn().mockResolvedValue({
          id: 'gym-1',
          ownerId: 'o-1',
          status: 'ACTIVE',
          membershipPlans: [],
          gymTrainers: [
            {
              trainerId: 'tp-1',
              trainer: { id: 'tp-1', user: user('t-1', 'x.y@gmail.com') },
            },
          ],
        }),
      },
    };
    const service = new GymsService(
      prisma as unknown as PrismaService,
      {} as unknown as GymAccessService,
    );

    it('GET /gyms no expone el email del dueño en el nombre', async () => {
      const [a, b] = await service.findAll();
      expect(a.owner.name).toBe('Dueño de gimnasio');
      expect(b.owner.name).toBe('Ana Ruiz');
    });

    it('GET /gyms/nearby tampoco', async () => {
      const gyms = await service.findNearby(-12.0464, -77.0428, 50);
      expect(gyms).toHaveLength(2);
      expect(JSON.stringify(gyms)).not.toMatch(EMAIL);
    });

    it('GET /gyms/:id no expone el email de los entrenadores en el nombre', async () => {
      const gym: any = await service.findOneForViewer('gym-1', null);
      expect(gym.gymTrainers[0].trainer.user.name).toBe('Entrenador');
      expect(gym.ownerId).toBe('o-1');
    });
  });

  describe('ProfessionalsService', () => {
    const prisma = {
      professionalService: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { id: 'svc-1', provider: user('p-1', 'ma.pro@hercix-demo.com') },
          ]),
        findUnique: jest.fn().mockResolvedValue({
          id: 'svc-1',
          providerId: 'p-1',
          provider: user('p-1', 'ma.pro@hercix-demo.com'),
        }),
      },
    };
    const service = new ProfessionalsService(
      prisma as unknown as PrismaService,
      {} as unknown as NotificationsService,
    );

    it('GET /professionals no expone el email en el nombre', async () => {
      const [svc] = await service.findAll();
      expect(svc.provider.name).toBe('Profesional');
    });

    it('GET /professionals/:id tampoco', async () => {
      const svc = await service.findOne('svc-1');
      expect(svc.provider.name).toBe('Profesional');
      expect(svc.providerId).toBe('p-1');
    });
  });
});
