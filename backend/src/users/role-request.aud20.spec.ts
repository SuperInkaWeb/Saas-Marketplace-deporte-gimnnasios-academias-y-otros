import 'reflect-metadata';
import {
  BadRequestException,
  ConflictException,
  ValidationPipe,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleRequestDto } from './dto/role-request.dto';

describe('Solicitudes de rol (AUD-20)', () => {
  let service: UsersService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({ role: UserRole.USER }),
      },
      roleRequest: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest
          .fn()
          .mockImplementation(({ data }) =>
            Promise.resolve({ id: 'rr-1', ...data }),
          ),
      },
    };
    service = new UsersService(prisma as PrismaService);
  });

  describe('servicio', () => {
    it('crea la solicitud PENDIENTE de un atleta (regresión)', async () => {
      const req = await service.createRoleRequest(
        'u1',
        UserRole.TRAINER,
        'Solicitado al completar el perfil',
      );
      expect(req).toMatchObject({
        userId: 'u1',
        requestedRole: UserRole.TRAINER,
        status: 'PENDING',
        reason: 'Solicitado al completar el perfil',
      });
    });

    it('no duplica: si ya hay una solicitud pendiente responde 409', async () => {
      prisma.roleRequest.findFirst.mockResolvedValue({ id: 'rr-prev' });
      await expect(
        service.createRoleRequest('u1', UserRole.GYM_OWNER),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.roleRequest.create).not.toHaveBeenCalled();
    });

    it('no permite solicitar un rol que ya se tiene', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: UserRole.TRAINER });
      await expect(
        service.createRoleRequest('u1', UserRole.TRAINER),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.roleRequest.create).not.toHaveBeenCalled();
    });

    it('permite volver a solicitar si la anterior fue rechazada (regresión)', async () => {
      // findFirst solo busca PENDING; una rechazada no bloquea
      await service.createRoleRequest('u1', UserRole.GYM_OWNER);
      expect(prisma.roleRequest.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'u1', status: 'PENDING' },
        }),
      );
      expect(prisma.roleRequest.create).toHaveBeenCalled();
    });

    it('sigue rechazando ADMIN y USER (regresión)', async () => {
      await expect(
        service.createRoleRequest('u1', UserRole.ADMIN),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        service.createRoleRequest('u1', UserRole.USER),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('DTO de POST /users/role-requests', () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });
    const validate = (body: unknown) =>
      pipe.transform(body, { type: 'body', metatype: CreateRoleRequestDto });

    it('rechaza un rol inexistente con 400 (antes 500)', async () => {
      await expect(
        validate({ requestedRole: 'SUPERHERO' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza ADMIN, USER y la ausencia de rol', async () => {
      for (const body of [
        { requestedRole: 'ADMIN' },
        { requestedRole: 'USER' },
        {},
      ]) {
        await expect(validate(body)).rejects.toBeInstanceOf(
          BadRequestException,
        );
      }
    });

    it('rechaza campos extra y motivos de más de 500 caracteres', async () => {
      await expect(
        validate({ requestedRole: 'TRAINER', status: 'APPROVED' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        validate({ requestedRole: 'TRAINER', reason: 'x'.repeat(501) }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('acepta un cuerpo válido', async () => {
      const dto = await validate({
        requestedRole: 'GYM_OWNER',
        reason: '  Tengo un gimnasio  ',
      });
      expect(dto).toMatchObject({
        requestedRole: 'GYM_OWNER',
        reason: 'Tengo un gimnasio',
      });
    });
  });
});
