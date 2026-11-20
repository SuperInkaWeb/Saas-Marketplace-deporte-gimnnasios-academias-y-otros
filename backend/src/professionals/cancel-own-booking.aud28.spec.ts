/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access,
   @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument,
   @typescript-eslint/require-await --
   Prisma falso en memoria, sin tipar a propósito. */
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ProfessionalsService } from './professionals.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const ATHLETE = 'athlete-1';
const PROVIDER = 'provider-1';

function makeService(opts: { status?: string; paid?: boolean } = {}) {
  const booking = {
    id: 'b1',
    userId: ATHLETE,
    serviceId: 's1',
    status: opts.status ?? 'PENDING',
    bookedAt: new Date(),
  };
  const notifications = { create: jest.fn().mockResolvedValue(undefined) };
  const prisma: any = {
    booking,
    payment: {
      findMany: jest.fn(async ({ where }) =>
        opts.paid && where.userId === ATHLETE ? [{ serviceId: 's1' }] : [],
      ),
    },
    professionalBooking: {
      findUnique: jest.fn(async () => ({
        ...booking,
        service: { title: 'Plan', providerId: PROVIDER },
      })),
      findMany: jest.fn(async () => [
        { ...booking, service: { provider: { id: PROVIDER } } },
      ]),
      updateMany: jest.fn(async ({ where, data }) => {
        if (where.status !== booking.status) return { count: 0 };
        Object.assign(booking, data);
        return { count: 1 };
      }),
    },
  };
  const service = new ProfessionalsService(
    prisma as PrismaService,
    notifications as unknown as NotificationsService,
  );
  return { service, prisma, notifications };
}

describe('AUD-28 — el atleta cancela su propia reserva', () => {
  it('cancela una reserva pendiente y no pagada, y avisa al profesional', async () => {
    const { service, prisma, notifications } = makeService();
    await expect(service.cancelOwnBooking('b1', ATHLETE)).resolves.toEqual({
      id: 'b1',
      status: 'CANCELLED',
    });
    expect(prisma.booking.status).toBe('CANCELLED');
    expect(notifications.create).toHaveBeenCalledWith(
      PROVIDER,
      expect.objectContaining({ title: 'Reserva Cancelada por el Cliente' }),
    );
  });

  it('no permite cancelar una reserva pagada', async () => {
    const { service, prisma } = makeService({ paid: true });
    await expect(service.cancelOwnBooking('b1', ATHLETE)).rejects.toThrow(
      'pide la cancelación al profesional',
    );
    expect(prisma.booking.status).toBe('PENDING');
  });

  it.each(['CONFIRMED', 'COMPLETED', 'CANCELLED'])(
    'no permite cancelar una reserva %s',
    async (status) => {
      const { service, prisma } = makeService({ status });
      await expect(
        service.cancelOwnBooking('b1', ATHLETE),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.booking.status).toBe(status);
    },
  );

  it('otro usuario no puede cancelar la reserva (404, no revela que existe)', async () => {
    const { service, prisma } = makeService();
    await expect(service.cancelOwnBooking('b1', 'otro')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.booking.status).toBe('PENDING');
  });

  it('si el profesional la confirmó entre medio, responde 409 y no la cancela', async () => {
    const { service, prisma } = makeService();
    prisma.professionalBooking.findUnique.mockImplementationOnce(async () => {
      const read = {
        ...prisma.booking,
        service: { title: 'Plan', providerId: PROVIDER },
      };
      prisma.booking.status = 'CONFIRMED';
      return read;
    });
    await expect(
      service.cancelOwnBooking('b1', ATHLETE),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.booking.status).toBe('CONFIRMED');
  });

  describe('getMyBookings marca canCancel', () => {
    it('true si está pendiente y no pagada', async () => {
      const { service } = makeService();
      const [b] = await service.getMyBookings(ATHLETE);
      expect(b.canCancel).toBe(true);
    });

    it('false si fue pagada', async () => {
      const { service } = makeService({ paid: true });
      const [b] = await service.getMyBookings(ATHLETE);
      expect(b.canCancel).toBe(false);
    });

    it('false si ya no está pendiente', async () => {
      const { service } = makeService({ status: 'CONFIRMED' });
      const [b] = await service.getMyBookings(ATHLETE);
      expect(b.canCancel).toBe(false);
    });
  });
});
