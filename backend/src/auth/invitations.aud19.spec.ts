import 'reflect-metadata';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../notifications/email.service';
import { InviteUserDto } from './dto/invite-user.dto';

const OWNER = { id: 'owner-1', role: UserRole.GYM_OWNER };
const OTHER_OWNER = { id: 'owner-2', role: UserRole.GYM_OWNER };
const ADMIN = { id: 'admin-1', role: UserRole.ADMIN };
const OWN_GYM = { id: 'gym-own', ownerId: OWNER.id };
const FOREIGN_GYM = { id: 'gym-foreign', ownerId: OTHER_OWNER.id };

describe('Invitaciones (AUD-19)', () => {
  let service: AuthService;
  let prisma: any;
  let email: { sendInvitation: jest.Mock; sendWelcome: jest.Mock };
  const originalFrontendUrl = process.env.FRONTEND_URL;

  beforeEach(() => {
    process.env.FRONTEND_URL = 'https://www.hercix.com/';
    prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest
          .fn()
          .mockImplementation(({ data }) =>
            Promise.resolve({ id: 'new', isActive: true, ...data }),
          ),
      },
      gym: {
        findUnique: jest
          .fn()
          .mockImplementation(({ where }) =>
            Promise.resolve(
              [OWN_GYM, FOREIGN_GYM].find((g) => g.id === where.id) ?? null,
            ),
          ),
      },
      invitation: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(null),
        deleteMany: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
        create: jest
          .fn()
          .mockImplementation(({ data }) =>
            Promise.resolve({ id: 'inv-new', ...data }),
          ),
      },
      trainerProfile: { create: jest.fn().mockResolvedValue({ id: 'tp-1' }) },
      gymTrainer: { create: jest.fn() },
    };
    email = {
      sendInvitation: jest.fn().mockResolvedValue(true),
      sendWelcome: jest.fn().mockResolvedValue(true),
    };
    service = new AuthService(
      prisma as PrismaService,
      {} as JwtService,
      {} as ConfigService,
      email as unknown as EmailService,
    );
  });

  afterAll(() => {
    process.env.FRONTEND_URL = originalFrontendUrl;
  });

  describe('enlace del correo', () => {
    it('usa FRONTEND_URL y no localhost', async () => {
      await service.inviteUser(
        OWNER,
        'coach@test.com',
        UserRole.TRAINER,
        OWN_GYM.id,
      );

      const link: string = email.sendInvitation.mock.calls[0][2];
      expect(link.startsWith('https://www.hercix.com/login?')).toBe(true);
      expect(link).not.toContain('localhost');
    });

    it('informa si el correo no se pudo enviar', async () => {
      email.sendInvitation.mockResolvedValue(false);
      const res = await service.inviteUser(
        OWNER,
        'coach@test.com',
        UserRole.TRAINER,
        OWN_GYM.id,
      );
      expect(res.emailSent).toBe(false);
    });
  });

  describe('gimnasio de la invitación', () => {
    it('un dueño no puede invitar a un entrenador a un gimnasio ajeno', async () => {
      await expect(
        service.inviteUser(
          OWNER,
          'coach@test.com',
          UserRole.TRAINER,
          FOREIGN_GYM.id,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.invitation.create).not.toHaveBeenCalled();
    });

    it('rechaza un gimnasio inexistente', async () => {
      await expect(
        service.inviteUser(
          OWNER,
          'coach@test.com',
          UserRole.TRAINER,
          'no-existe',
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.invitation.create).not.toHaveBeenCalled();
    });

    it('un dueño debe indicar el gimnasio del entrenador', async () => {
      await expect(
        service.inviteUser(OWNER, 'coach@test.com', UserRole.TRAINER),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('permite invitar a su propio gimnasio (regresión)', async () => {
      await service.inviteUser(
        OWNER,
        'Coach@Test.com',
        UserRole.TRAINER,
        OWN_GYM.id,
      );
      expect(prisma.invitation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'coach@test.com',
          role: UserRole.TRAINER,
          gymId: OWN_GYM.id,
          invitedById: OWNER.id,
        }),
      });
    });

    it('ADMIN puede invitar entrenadores a cualquier gimnasio (regresión)', async () => {
      await service.inviteUser(
        ADMIN,
        'coach@test.com',
        UserRole.TRAINER,
        FOREIGN_GYM.id,
      );
      expect(prisma.invitation.create).toHaveBeenCalled();
    });
  });

  describe('roles', () => {
    it('no permite invitar como ADMIN, ni siquiera un ADMIN', async () => {
      await expect(
        service.inviteUser(ADMIN, 'nuevo@test.com', UserRole.ADMIN),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.invitation.create).not.toHaveBeenCalled();
    });

    it('un dueño no puede invitar a otro dueño', async () => {
      await expect(
        service.inviteUser(OWNER, 'nuevo@test.com', UserRole.GYM_OWNER),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('una invitación antigua con rol ADMIN no otorga ADMIN al registrarse', async () => {
      prisma.invitation.findFirst.mockResolvedValue({
        id: 'inv-old',
        email: 'nuevo@test.com',
        role: UserRole.ADMIN,
        gymId: null,
        status: 'PENDING',
      });
      const user = await service.findOrCreateAuth0User({
        auth0Id: 'auth0|nuevo',
        email: 'nuevo@test.com',
        emailVerified: true,
        name: 'Nuevo',
      });
      expect(user.role).toBe(UserRole.USER);
    });
  });

  describe('invitaciones de otros invitadores', () => {
    const pendingFromOther = () => ({
      id: 'inv-other',
      email: 'coach@test.com',
      role: UserRole.TRAINER,
      gymId: FOREIGN_GYM.id,
      status: 'PENDING',
      invitedById: OTHER_OWNER.id,
      expiresAt: new Date(Date.now() + 86_400_000),
    });

    it('no borra la invitación vigente de otro dueño', async () => {
      prisma.invitation.findUnique.mockResolvedValue(pendingFromOther());
      await expect(
        service.inviteUser(
          OWNER,
          'coach@test.com',
          UserRole.TRAINER,
          OWN_GYM.id,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.invitation.delete).not.toHaveBeenCalled();
      expect(prisma.invitation.deleteMany).not.toHaveBeenCalled();
    });

    it('reemplaza una invitación vencida de otro dueño (regresión)', async () => {
      prisma.invitation.findUnique.mockResolvedValue({
        ...pendingFromOther(),
        expiresAt: new Date(Date.now() - 1000),
      });
      await service.inviteUser(
        OWNER,
        'coach@test.com',
        UserRole.TRAINER,
        OWN_GYM.id,
      );
      expect(prisma.invitation.delete).toHaveBeenCalledWith({
        where: { id: 'inv-other' },
      });
      expect(prisma.invitation.create).toHaveBeenCalled();
    });

    it('el mismo dueño puede reenviar su invitación (regresión)', async () => {
      prisma.invitation.findUnique.mockResolvedValue({
        ...pendingFromOther(),
        invitedById: OWNER.id,
      });
      await service.inviteUser(
        OWNER,
        'coach@test.com',
        UserRole.TRAINER,
        OWN_GYM.id,
      );
      expect(prisma.invitation.create).toHaveBeenCalled();
    });
  });

  describe('DTO de POST /auth/invite', () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });
    const validate = (body: unknown) =>
      pipe.transform(body, { type: 'body', metatype: InviteUserDto });

    it('rechaza un rol inexistente con 400 (antes 500)', async () => {
      await expect(
        validate({ email: 'a@test.com', role: 'SUPERHERO' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza rol ADMIN o USER', async () => {
      await expect(
        validate({ email: 'a@test.com', role: 'ADMIN' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        validate({ email: 'a@test.com', role: 'USER' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza correo inválido y campos extra', async () => {
      await expect(
        validate({ email: 'no-es-correo', role: 'TRAINER' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        validate({
          email: 'a@test.com',
          role: 'TRAINER',
          gymId: 'g',
          status: 'ACCEPTED',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('acepta un cuerpo válido y normaliza el correo', async () => {
      const dto = await validate({
        email: ' Coach@Test.com ',
        role: 'TRAINER',
        gymId: 'gym-own',
      });
      expect(dto).toMatchObject({
        email: 'coach@test.com',
        role: 'TRAINER',
        gymId: 'gym-own',
      });
    });
  });
});
