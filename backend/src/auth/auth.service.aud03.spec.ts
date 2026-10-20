import { UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../notifications/email.service';

// Correo que antes estaba en la lista fija ADMIN_EMAILS.
const FORMER_ADMIN_EMAIL = 'soporte@hercix-demo.com';

describe('AuthService.findOrCreateAuth0User (AUD-03)', () => {
  let service: AuthService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockImplementation(({ where, data }) => Promise.resolve({ id: where.id, ...data })),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'new', isActive: true, ...data })),
      },
      invitation: {
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
      },
      trainerProfile: { create: jest.fn() },
      gymTrainer: { create: jest.fn() },
    };
    service = new AuthService(
      prisma as PrismaService,
      {} as JwtService,
      {} as ConfigService,
      { sendWelcome: jest.fn().mockResolvedValue(undefined) } as unknown as EmailService,
    );
  });

  it('does not grant ADMIN to a new account just because of its email', async () => {
    const user = await service.findOrCreateAuth0User({
      auth0Id: 'auth0|attacker',
      email: FORMER_ADMIN_EMAIL,
      emailVerified: true,
      name: 'Atacante',
    });

    expect(user.role).toBe(UserRole.USER);
    expect(prisma.user.create.mock.calls[0][0].data.role).toBe(UserRole.USER);
  });

  it('does not promote an already linked account to ADMIN based on its email', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1', name: 'Soporte', email: FORMER_ADMIN_EMAIL, role: UserRole.USER, isActive: true, avatarUrl: null,
    });

    const user = await service.findOrCreateAuth0User({
      auth0Id: 'auth0|u1',
      email: FORMER_ADMIN_EMAIL,
      emailVerified: true,
      name: 'Soporte',
    });

    expect(user.role).toBe(UserRole.USER);
    const roleUpdates = prisma.user.update.mock.calls.filter(([args]: any[]) => 'role' in args.data);
    expect(roleUpdates).toHaveLength(0);
  });

  it('refuses to link an existing account by email when Auth0 has not verified the email', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'admin1', email: 'admin@hercix.com', role: UserRole.ADMIN, isActive: true, avatarUrl: null,
    });

    await expect(
      service.findOrCreateAuth0User({
        auth0Id: 'auth0|attacker',
        email: 'admin@hercix.com',
        emailVerified: false,
        name: 'Atacante',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('links an existing account by email when the email is verified, keeping its role', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'owner1', email: 'owner@gym.pe', role: UserRole.GYM_OWNER, isActive: true, avatarUrl: null,
    });

    const user = await service.findOrCreateAuth0User({
      auth0Id: 'auth0|owner1',
      email: 'owner@gym.pe',
      emailVerified: true,
      name: 'Dueño',
    });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'owner1' }, data: expect.objectContaining({ auth0Id: 'auth0|owner1' }) }),
    );
    expect(user).toMatchObject({ id: 'owner1', auth0Id: 'auth0|owner1' });
  });

  it('ignores pending invitations when the email is not verified', async () => {
    prisma.invitation.findFirst.mockResolvedValue({
      id: 'inv1', email: 'coach@gym.pe', role: UserRole.TRAINER, gymId: 'g1', status: 'PENDING',
    });

    const user = await service.findOrCreateAuth0User({
      auth0Id: 'auth0|coach',
      email: 'coach@gym.pe',
      emailVerified: false,
      name: 'Coach',
    });

    expect(user.role).toBe(UserRole.USER);
    expect(prisma.invitation.update).not.toHaveBeenCalled();
    expect(prisma.gymTrainer.create).not.toHaveBeenCalled();
  });

  it('still applies a pending invitation when the email is verified', async () => {
    prisma.invitation.findFirst.mockResolvedValue({
      id: 'inv1', email: 'coach@gym.pe', role: UserRole.TRAINER, gymId: 'g1', status: 'PENDING',
    });
    prisma.trainerProfile.create.mockResolvedValue({ id: 'tp1' });

    const user = await service.findOrCreateAuth0User({
      auth0Id: 'auth0|coach',
      email: 'coach@gym.pe',
      emailVerified: true,
      name: 'Coach',
    });

    expect(user.role).toBe(UserRole.TRAINER);
    expect(prisma.invitation.update).toHaveBeenCalledWith({ where: { id: 'inv1' }, data: { status: 'ACCEPTED' } });
    expect(prisma.gymTrainer.create).toHaveBeenCalled();
  });
});
