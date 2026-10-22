import { ClassesService } from './classes.service';
import { ClassesController } from './classes.controller';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { HealthService } from '../health/health.service';
import { GymAccessService } from '../common/gym-access/gym-access.service';
import { AuditService } from '../common/audit/audit.service';

// Dos atletas con reserva en la misma clase (AUD-07).
const athlete = (id: string) => ({
  id,
  name: `Atleta ${id}`,
  email: `${id}@example.com`,
  dni: '12345678',
  phone: '999999999',
  role: 'USER',
  avatarUrl: null,
  passwordHash: '$2b$10$hash-de-prueba',
});
const RESERVATIONS = [
  { id: 'r1', userId: 'a1', status: 'CONFIRMED', user: athlete('a1') },
  { id: 'r2', userId: 'a2', status: 'CONFIRMED', user: athlete('a2') },
];

// Simula Prisma: filtra por where.userId y proyecta solo los campos pedidos.
const pick = (row: Record<string, any>, select: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(select).map(([k, v]) => [k, v === true ? row[k] : pick(row[k], v.select)]),
  );
const reservationsFor = (arg: any) => {
  if (!arg) return undefined;
  const rows = RESERVATIONS.filter((r) => !arg.where?.userId || r.userId === arg.where.userId);
  if (arg.select) return rows.map((r) => pick(r, arg.select));
  // include: { user: { select } } → escalares de la reserva + el usuario proyectado
  return rows.map(({ user, ...r }) => ({ ...r, user: pick(user, arg.include.user.select) }));
};
const classFrom = (args: any) => ({
  id: 'class-1',
  title: 'Funcional',
  capacity: 10,
  reservations: reservationsFor(args.include.reservations),
  _count: args.include._count ? { reservations: RESERVATIONS.length } : undefined,
});

const build = () => {
  const prisma = {
    class: {
      findMany: jest.fn(async (args: any) => [classFrom(args)]),
      findUnique: jest.fn(async (args: any) => classFrom(args)),
    },
    reservation: {
      findMany: jest.fn(async () => [{ classId: 'class-1' }]),
    },
  };
  const service = new ClassesService(
    prisma as unknown as PrismaService,
    {} as NotificationsService,
    {} as HealthService,
    {} as GymAccessService,
    {} as AuditService,
  );
  const controller = new ClassesController(service);
  return { prisma, service, controller };
};

const users = (classes: any[]) => classes.flatMap((c) => (c.reservations ?? []).map((r: any) => r.user));

describe('AUD-07: datos de atletas en clases', () => {
  it('GET /classes/:id (público) no devuelve reservas con datos de atletas, solo el conteo', async () => {
    const { controller } = build();
    const result: any = await controller.findOne('class-1');

    expect(result.reservations).toBeUndefined();
    expect(result._count.reservations).toBe(2);
    expect(JSON.stringify(result)).not.toContain('12345678');
    expect(JSON.stringify(result)).not.toContain('@example.com');
  });

  it('GET /classes como atleta: solo ve su propia reserva y sin datos personales', async () => {
    const { controller } = build();
    const result: any[] = await controller.findAll('gym-1', undefined, undefined, { id: 'a1', role: 'USER' });

    expect(result[0].reservations).toEqual([{ id: 'r1', userId: 'a1', status: 'CONFIRMED' }]);
    expect(result[0]._count.reservations).toBe(2);
    expect(JSON.stringify(result)).not.toContain('12345678');
    expect(JSON.stringify(result)).not.toContain('@example.com');
  });

  it('GET /classes?myReservations=true: el atleta no ve a los demás asistentes', async () => {
    const { controller } = build();
    const result: any[] = await controller.findAll(undefined, 'true', undefined, { id: 'a2', role: 'USER' });

    expect(result[0].reservations).toEqual([{ id: 'r2', userId: 'a2', status: 'CONFIRMED' }]);
  });

  it.each(['GYM_OWNER', 'TRAINER', 'ADMIN'])(
    'GET /classes como %s: ve la lista de asistentes con nombre y DNI, sin email',
    async (role) => {
      const { controller, prisma } = build();
      const result: any[] = await controller.findAll(undefined, undefined, undefined, { id: 'staff', role });

      const attendees = users(result);
      expect(attendees.map((u) => u.name)).toEqual(['Atleta a1', 'Atleta a2']);
      expect(attendees.every((u) => u.dni === '12345678')).toBe(true);
      for (const u of attendees) {
        expect(u).not.toHaveProperty('email');
        expect(u).not.toHaveProperty('phone');
        expect(u).not.toHaveProperty('passwordHash');
      }
      // El staff sigue limitado a sus clases (dueño → sus gimnasios, entrenador → sus clases)
      const where = prisma.class.findMany.mock.calls[0][0].where;
      if (role === 'GYM_OWNER') expect(where.gym).toEqual({ ownerId: 'staff' });
      if (role === 'TRAINER') expect(where.trainer).toEqual({ userId: 'staff' });
    },
  );
});
