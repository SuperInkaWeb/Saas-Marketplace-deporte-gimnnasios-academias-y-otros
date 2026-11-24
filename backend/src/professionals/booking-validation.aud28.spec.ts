/*
   El Prisma falso trabaja con objetos sin tipar a propósito: sirve para el código anterior y el corregido. */
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  ValidationPipe,
} from '@nestjs/common';
import { ProfessionalsService } from './professionals.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  RequestBookingDto,
  UpdateBookingStatusDto,
} from './dto/professional.dto';

const PROVIDER = 'provider-1';
const ATHLETE = 'athlete-1';

function makeService(opts: { isActive?: boolean; price?: number } = {}) {
  const booking = { id: 'b1', userId: ATHLETE, status: 'PENDING' };
  const notifications = { create: jest.fn().mockResolvedValue(undefined) };
  const prisma: any = {
    booking,
    professionalService: {
      findUnique: jest.fn(async () => ({
        id: 's1',
        title: 'Plan nutricional',
        price: opts.price ?? 0,
        isActive: opts.isActive ?? true,
        providerId: PROVIDER,
        provider: { id: PROVIDER, name: 'Profe', avatarUrl: null },
      })),
    },
    professionalBooking: {
      create: jest.fn(async ({ data }) => ({
        id: 'b-new',
        ...data,
        user: { id: data.userId, name: 'Atleta' },
        service: { providerId: PROVIDER, provider: { name: 'Profe' } },
      })),
      findUnique: jest.fn(async () => ({
        ...booking,
        service: { providerId: PROVIDER },
      })),
      // Prisma real: solo actualiza si el estado sigue siendo el leído.
      updateMany: jest.fn(async ({ where, data }) => {
        if (where.status !== undefined && where.status !== booking.status)
          return { count: 0 };
        Object.assign(booking, data);
        return { count: 1 };
      }),
      update: jest.fn(async ({ data }) => {
        Object.assign(booking, data);
        return {
          ...booking,
          service: { title: 'Plan', provider: { name: 'Profe' } },
          user: {},
        };
      }),
      findUniqueOrThrow: jest.fn(async () => ({
        ...booking,
        service: { title: 'Plan', provider: { name: 'Profe' } },
        user: {},
      })),
    },
  };
  const service = new ProfessionalsService(
    prisma as PrismaService,
    notifications as unknown as NotificationsService,
  );
  return { service, prisma, notifications };
}

describe('AUD-28 — reservas de servicios profesionales', () => {
  describe('reserva gratuita (POST /professionals/:id/book)', () => {
    it('no permite reservar un servicio inactivo', async () => {
      const { service, prisma } = makeService({ isActive: false });
      await expect(service.bookService(ATHLETE, 's1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.professionalBooking.create).not.toHaveBeenCalled();
    });

    it('no permite que el profesional reserve su propio servicio', async () => {
      const { service, prisma } = makeService();
      await expect(service.bookService(PROVIDER, 's1')).rejects.toThrow(
        'No puedes reservar tu propio servicio',
      );
      expect(prisma.professionalBooking.create).not.toHaveBeenCalled();
    });

    it('sigue exigiendo pago si el servicio tiene precio', async () => {
      const { service } = makeService({ price: 50 });
      await expect(service.bookService(ATHLETE, 's1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('un atleta reserva un servicio gratuito activo y queda PENDING', async () => {
      const { service } = makeService();
      const booking: any = await service.bookService(ATHLETE, 's1', 'hola');
      expect(booking.status).toBe('PENDING');
    });
  });

  describe('cambio de estado', () => {
    it.each([
      ['PENDING', 'CONFIRMED'],
      ['PENDING', 'CANCELLED'],
      ['CONFIRMED', 'COMPLETED'],
      ['CONFIRMED', 'CANCELLED'],
    ])('permite %s → %s', async (from, to) => {
      const { service, prisma } = makeService();
      prisma.booking.status = from;
      await service.updateBookingStatus('b1', PROVIDER, to as any, false);
      expect(prisma.booking.status).toBe(to);
    });

    it.each([
      ['PENDING', 'COMPLETED'],
      ['CANCELLED', 'CONFIRMED'],
      ['CANCELLED', 'COMPLETED'],
      ['COMPLETED', 'CANCELLED'],
      ['COMPLETED', 'CONFIRMED'],
      ['CONFIRMED', 'CONFIRMED'],
    ])('rechaza %s → %s', async (from, to) => {
      const { service, prisma } = makeService();
      prisma.booking.status = from;
      await expect(
        service.updateBookingStatus('b1', PROVIDER, to as any, false),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.booking.status).toBe(from);
    });

    it('si otra petición cambió la reserva entre medio, responde 409 y no la pisa', async () => {
      const { service, prisma } = makeService();
      prisma.professionalBooking.findUnique.mockImplementationOnce(async () => {
        const read = { ...prisma.booking, service: { providerId: PROVIDER } };
        prisma.booking.status = 'CANCELLED'; // el cliente/otro admin la canceló justo después
        return read;
      });
      await expect(
        service.updateBookingStatus('b1', PROVIDER, 'CONFIRMED', false),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.booking.status).toBe('CANCELLED');
    });

    it('otro usuario no puede cambiar el estado (403)', async () => {
      const { service } = makeService();
      await expect(
        service.updateBookingStatus('b1', 'otro', 'CONFIRMED', false),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('avisa al cliente con el texto del estado (también COMPLETED)', async () => {
      const { service, prisma, notifications } = makeService();
      prisma.booking.status = 'CONFIRMED';
      await service.updateBookingStatus('b1', PROVIDER, 'COMPLETED', false);
      expect(notifications.create).toHaveBeenCalledWith(
        ATHLETE,
        expect.objectContaining({ title: 'Reserva de Servicio Completada' }),
      );
    });
  });

  describe('validación del cuerpo', () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });
    const status = (body: any) =>
      pipe.transform(body, { type: 'body', metatype: UpdateBookingStatusDto });
    const book = (body: any) =>
      pipe.transform(body, { type: 'body', metatype: RequestBookingDto });

    it.each(['HOLA', 'PENDING', 'confirmed', '', undefined])(
      'rechaza status = %p (400)',
      async (value) => {
        await expect(status({ status: value })).rejects.toBeInstanceOf(
          BadRequestException,
        );
      },
    );

    it.each(['CONFIRMED', 'COMPLETED', 'CANCELLED'])(
      'acepta status = %s',
      async (value) => {
        await expect(status({ status: value })).resolves.toMatchObject({
          status: value,
        });
      },
    );

    it('rechaza notas de más de 500 caracteres y campos extra', async () => {
      await expect(book({ notes: 'x'.repeat(501) })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      await expect(
        book({ notes: 'ok', status: 'CONFIRMED' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(book({})).resolves.toEqual({});
    });
  });
});
