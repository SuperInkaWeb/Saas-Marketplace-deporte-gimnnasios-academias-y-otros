import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../notifications/email.service';

describe('AuthService.updateProfile (HER-SEC-002)', () => {
  let service: AuthService;
  let userUpdateMock: jest.Mock;

  beforeEach(() => {
    userUpdateMock = jest.fn().mockResolvedValue({ id: 'u1' });
    const prisma = {
      user: {
        findUnique: jest.fn(),
        update: userUpdateMock,
      },
      roleRequest: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    } as unknown as PrismaService;

    service = new AuthService(
      prisma,
      {} as JwtService,
      {} as ConfigService,
      {} as EmailService,
    );
  });

  it('never forwards a role field to the database, even if the caller injects one', async () => {
    // Simula un USER que intenta auto-escalar a ADMIN enviando `role` en el body,
    // como permitía el endpoint antes del fix.
    await service.updateProfile('u1', {
      name: 'Walter',
      role: 'ADMIN',
    } as any);

    expect(userUpdateMock).toHaveBeenCalledTimes(1);
    const callArgs = userUpdateMock.mock.calls[0][0];
    expect(callArgs.data).not.toHaveProperty('role');
    expect(callArgs.data).toEqual({
      name: 'Walter',
      phone: undefined,
      dni: undefined,
    });
  });

  it('updates only name/phone/dni for a normal profile edit', async () => {
    await service.updateProfile('u1', {
      name: 'Walter',
      phone: '999999999',
      dni: '12345678',
    });

    const callArgs = userUpdateMock.mock.calls[0][0];
    expect(callArgs.data).toEqual({
      name: 'Walter',
      phone: '999999999',
      dni: '12345678',
    });
  });
});
