import { BadRequestException } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { HealthService } from '../health/health.service';
import { GymAccessService } from '../common/gym-access/gym-access.service';
import { AuditService } from '../common/audit/audit.service';

// AUD-21: book() de clases gratuitas contaba el cupo y creaba la reserva sin bloqueo
// (en septiembre 5/5 clases quedaron sobrerreservadas), y los cambios de estado de
// una reserva no se validaban.

// Base en memoria con latencia, para que las peticiones simultáneas se intercalen
// como en Postgres. SELECT ... FOR UPDATE bloquea la fila de la clase hasta que
// termina la transacción.
const tick = () => new Promise((r) => setTimeout(r, Math.random() * 3));

const buildDb = () => {
  const cls = {
    id: 'class-1',
    title: 'Funcional',
    durationMin: 60,
    gymId: 'gym-1',
    price: 0,
    capacity: 5,
    isActive: true,
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    gym: { ownerId: 'owner-1' },
  };
  const reservations: any[] = [];
  const locks = new Map<string, Promise<void>>();
  const confirmed = () =>
    reservations.filter((r) => r.status === 'CONFIRMED').length;
  const withRelations = (r: any) => ({
    ...r,
    user: { name: r.userId },
    class: cls,
  });
  const key = (where: any) => where.classId_userId ?? {};

  const client = (release?: (() => void)[]) => ({
    $queryRaw: async (_sql: TemplateStringsArray, classId: string) => {
      const prev = locks.get(classId) ?? Promise.resolve();
      let unlock!: () => void;
      const mine = new Promise<void>((r) => (unlock = r));
      locks.set(
        classId,
        prev.then(() => mine),
      );
      release?.push(unlock);
      await prev;
      return [];
    },
    class: {
      findUnique: async (args: any) => {
        await tick();
        if (args.where.id !== cls.id) return null;
        return args.select
          ? { price: cls.price }
          : { ...cls, _count: { reservations: confirmed() } };
      },
    },
    reservation: {
      findUnique: async ({ where, include }: any) => {
        await tick();
        const r = where.id
          ? reservations.find((x) => x.id === where.id)
          : reservations.find(
              (x) =>
                x.classId === key(where).classId &&
                x.userId === key(where).userId,
            );
        return r && (include ? withRelations(r) : { ...r });
      },
      upsert: async ({ where, update, create }: any) => {
        await tick();
        let r = reservations.find(
          (x) =>
            x.classId === key(where).classId && x.userId === key(where).userId,
        );
        if (r) Object.assign(r, update);
        else
          reservations.push(
            (r = { id: `r-${reservations.length + 1}`, ...create }),
          );
        return withRelations(r);
      },
      update: async ({ where, data }: any) => {
        await tick();
        const r = reservations.find((x) => x.id === where.id);
        Object.assign(r, data);
        return { ...r };
      },
    },
  });

  const prisma = {
    ...client(),
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => {
      const release: (() => void)[] = [];
      try {
        return await fn(client(release));
      } finally {
        release.forEach((u) => u());
      }
    },
  };
  return { prisma, cls, reservations, confirmed };
};

const build = () => {
  const db = buildDb();
  const health = {
    calculateCaloriesFromClass: jest.fn().mockResolvedValue(undefined),
  };
  const service = new ClassesService(
    db.prisma as unknown as PrismaService,
    {
      create: jest.fn().mockResolvedValue(undefined),
    } as unknown as NotificationsService,
    health as unknown as HealthService,
    {
      assertCanManageGym: jest.fn().mockResolvedValue({ scope: 'OWNER' }),
    } as unknown as GymAccessService,
    {
      logGlobalAction: jest.fn().mockResolvedValue(undefined),
    } as unknown as AuditService,
  );
  return { ...db, health, service };
};

const owner = { id: 'owner-1', role: 'GYM_OWNER' } as any;

describe('Reserva de clases gratuitas (AUD-21)', () => {
  it('20 reservas simultáneas en una clase de 5 cupos: entran 5', async () => {
    const { service, confirmed } = build();

    const results = await Promise.allSettled(
      Array.from({ length: 20 }, (_, i) => service.book(`u${i}`, 'class-1')),
    );

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(5);
    expect(confirmed()).toBe(5);
  });

  it('la misma persona no reserva dos veces', async () => {
    const { service, confirmed } = build();
    await service.book('u1', 'class-1');

    await expect(service.book('u1', 'class-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(confirmed()).toBe(1);
  });

  it('una clase de pago sigue exigiendo el checkout', async () => {
    const { service, cls, reservations } = build();
    cls.price = 30;

    await expect(service.book('u1', 'class-1')).rejects.toThrow(
      'Esta clase requiere pago',
    );
    expect(reservations).toHaveLength(0);
  });
});

describe('Estados de una reserva (AUD-21)', () => {
  const withReservation = (status: string) => {
    const ctx = build();
    ctx.reservations.push({
      id: 'r-1',
      classId: 'class-1',
      userId: 'u1',
      status,
    });
    return ctx;
  };

  it('no se marca asistencia en una reserva cancelada', async () => {
    const { service, reservations, health } = withReservation('CANCELLED');

    await expect(service.markAttendance('r-1', owner)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(reservations[0].status).toBe('CANCELLED');
    expect(health.calculateCaloriesFromClass).not.toHaveBeenCalled();
  });

  it('marcar dos veces no vuelve a sumar las calorías de la clase', async () => {
    const { service, health } = withReservation('CONFIRMED');

    await service.markAttendance('r-1', owner);
    await service.markAttendance('r-1', owner);

    expect(health.calculateCaloriesFromClass).toHaveBeenCalledTimes(1);
  });

  it('deshacer la asistencia no revive una reserva cancelada', async () => {
    const { service, reservations } = withReservation('CANCELLED');

    await expect(service.unmarkAttendance('r-1', owner)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(reservations[0].status).toBe('CANCELLED');
  });

  it('deshacer una asistencia la deja confirmada', async () => {
    const { service, reservations } = withReservation('ATTENDED');

    await service.unmarkAttendance('r-1', owner);

    expect(reservations[0].status).toBe('CONFIRMED');
  });

  it('el atleta no puede cancelar una clase a la que ya asistió', async () => {
    const { service, reservations } = withReservation('ATTENDED');

    await expect(service.cancelBooking('u1', 'class-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(reservations[0].status).toBe('ATTENDED');
  });

  it('cancelar una reserva confirmada funciona como antes', async () => {
    const { service, reservations } = withReservation('CONFIRMED');

    await service.cancelBooking('u1', 'class-1');

    expect(reservations[0].status).toBe('CANCELLED');
  });
});
