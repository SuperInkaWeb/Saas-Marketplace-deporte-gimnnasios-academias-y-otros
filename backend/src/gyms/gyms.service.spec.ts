import { ForbiddenException } from '@nestjs/common';
import { GymsService } from './gyms.service';
import { PrismaService } from '../prisma/prisma.service';

describe('GymsService.findMembers (HER-SEC-008)', () => {
  let service: GymsService;
  let userFindManyMock: jest.Mock;

  const gym = {
    id: 'gym-1',
    ownerId: 'owner-1',
    gymTrainers: [],
    membershipPlans: [],
  };

  beforeEach(() => {
    userFindManyMock = jest.fn().mockResolvedValue([]);
    const prisma = {
      gym: {
        findUnique: jest.fn().mockResolvedValue(gym),
      },
      user: {
        findMany: userFindManyMock,
      },
    } as unknown as PrismaService;

    service = new GymsService(prisma);
  });

  it('rejects a GYM_OWNER that does not own the gym', async () => {
    await expect(
      service.findMembers('gym-1', 'otro-owner', false),
    ).rejects.toThrow(ForbiddenException);
    expect(userFindManyMock).not.toHaveBeenCalled();
  });

  it('allows the gym owner to list their own members', async () => {
    await service.findMembers('gym-1', 'owner-1', false);
    expect(userFindManyMock).toHaveBeenCalledTimes(1);
  });

  it('allows ADMIN regardless of ownership', async () => {
    await service.findMembers('gym-1', 'otro-owner', true);
    expect(userFindManyMock).toHaveBeenCalledTimes(1);
  });
});
