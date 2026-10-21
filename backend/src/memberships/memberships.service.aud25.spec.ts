import { MembershipsService } from './memberships.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MembershipsService.findAllPlans (AUD-25)', () => {
  let service: MembershipsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      membershipPlan: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn(),
      },
      gym: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'gym-x' }),
      },
      user: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'admin-x' }),
      },
    };
    service = new MembershipsService(prisma as PrismaService);
  });

  it('con la base vacía devuelve [] sin crear usuario ADMIN, gimnasio ni planes', async () => {
    const plans = await service.findAllPlans();

    expect(plans).toEqual([]);
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.gym.create).not.toHaveBeenCalled();
    expect(prisma.membershipPlan.create).not.toHaveBeenCalled();
  });

  it('sin planes activos no inventa planes en un gimnasio real', async () => {
    prisma.gym.findFirst.mockResolvedValue({
      id: 'gym-real',
      ownerId: 'owner-real',
    });

    await service.findAllPlans();

    expect(prisma.membershipPlan.create).not.toHaveBeenCalled();
  });

  it('filtra por gimnasio y solo planes activos', async () => {
    const plan = {
      id: 'p1',
      gymId: 'g1',
      isActive: true,
      gym: { name: 'Gym' },
    };
    prisma.membershipPlan.findMany.mockResolvedValue([plan]);

    await expect(service.findAllPlans('g1')).resolves.toEqual([plan]);
    expect(prisma.membershipPlan.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { gymId: 'g1', isActive: true } }),
    );
  });
});
