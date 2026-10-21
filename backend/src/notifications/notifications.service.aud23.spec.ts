import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaService } from '../prisma/prisma.service';

// Notificación de "victim"; "attacker" conoce o adivina su ID.
const VICTIM_NOTIFICATION = {
  id: 'notif-victim',
  userId: 'victim',
  title: 'Pago recibido',
  description: 'Pagaste el servicio: Plan nutricional.',
  isRead: false,
};

describe('Notificaciones: marcar como leída solo la propia (AUD-23)', () => {
  let service: NotificationsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      notification: {
        findFirst: jest
          .fn()
          .mockImplementation(({ where }) =>
            Promise.resolve(
              where.id === VICTIM_NOTIFICATION.id &&
                where.userId === VICTIM_NOTIFICATION.userId
                ? { id: VICTIM_NOTIFICATION.id }
                : null,
            ),
          ),
        update: jest
          .fn()
          .mockImplementation(({ data }) =>
            Promise.resolve({ ...VICTIM_NOTIFICATION, ...data }),
          ),
      },
    };
    service = new NotificationsService(prisma as PrismaService);
  });

  it('otro usuario recibe 404 y la notificación no cambia', async () => {
    await expect(
      service.markAsRead(VICTIM_NOTIFICATION.id, 'attacker'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.notification.update).not.toHaveBeenCalled();
  });

  it('el dueño sí puede marcarla como leída', async () => {
    const result = await service.markAsRead(VICTIM_NOTIFICATION.id, 'victim');

    expect(result.isRead).toBe(true);
    expect(prisma.notification.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: VICTIM_NOTIFICATION.id, userId: 'victim' },
      }),
    );
  });

  it('el controlador pasa el usuario autenticado al servicio', async () => {
    const markAsRead = jest.fn().mockResolvedValue({});
    const controller = new NotificationsController({
      markAsRead,
    } as unknown as NotificationsService);

    await controller.markAsRead(VICTIM_NOTIFICATION.id, {
      user: { id: 'attacker' },
    });

    expect(markAsRead).toHaveBeenCalledWith(VICTIM_NOTIFICATION.id, 'attacker');
  });
});
