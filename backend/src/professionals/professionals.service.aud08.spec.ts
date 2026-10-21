import { ProfessionalsService } from './professionals.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

// Campos de User que nunca deben salir en una reserva (AUD-08).
const SENSITIVE = [
  'passwordHash',
  'dni',
  'auth0Id',
  'role',
  'isActive',
  'emailVerified',
  'lastLoginAt',
];

const fullUser = (id: string) => ({
  id,
  name: `Nombre ${id}`,
  email: `${id}@example.com`,
  phone: '999999999',
  avatarUrl: null,
  passwordHash: '$2b$10$hash-de-prueba',
  dni: '12345678',
  auth0Id: `auth0|${id}`,
  role: 'USER',
  isActive: true,
  emailVerified: true,
  lastLoginAt: new Date(),
});

// Simula lo que Prisma devuelve: con `true` la fila completa, con `select` solo esos campos.
const project = (row: Record<string, any>, arg: any) =>
  arg === true
    ? { ...row }
    : Object.fromEntries(Object.keys(arg.select).map((k) => [k, row[k]]));

const bookingFrom = (args: any) => {
  const inc = args.include;
  return {
    id: 'booking-1',
    userId: 'athlete',
    serviceId: 'service-1',
    status: args.data?.status ?? 'PENDING',
    user: inc.user ? project(fullUser('athlete'), inc.user) : undefined,
    service: {
      id: 'service-1',
      title: 'Plan nutricional',
      providerId: 'provider',
      provider: project(fullUser('provider'), inc.service.include.provider),
    },
  };
};

const expectNoSensitive = (obj: Record<string, any> | undefined) => {
  expect(obj).toBeDefined();
  for (const field of SENSITIVE) expect(obj).not.toHaveProperty(field);
};

describe('ProfessionalsService: reservas sin datos privados (AUD-08)', () => {
  let service: ProfessionalsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      professionalService: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'service-1',
          title: 'Plan nutricional',
          price: 0,
          isActive: true,
          providerId: 'provider',
          provider: {
            id: 'provider',
            name: 'Nombre provider',
            avatarUrl: null,
          },
        }),
      },
      professionalBooking: {
        create: jest
          .fn()
          .mockImplementation((args) => Promise.resolve(bookingFrom(args))),
        update: jest
          .fn()
          .mockImplementation((args) => Promise.resolve(bookingFrom(args))),
        findMany: jest
          .fn()
          .mockImplementation((args) => Promise.resolve([bookingFrom(args)])),
        findUnique: jest.fn().mockResolvedValue({
          id: 'booking-1',
          service: { providerId: 'provider' },
        }),
      },
    };
    service = new ProfessionalsService(
      prisma as PrismaService,
      {
        create: jest.fn().mockResolvedValue(undefined),
      } as unknown as NotificationsService,
    );
  });

  it('bookService no devuelve la fila completa del profesional ni del atleta', async () => {
    const booking: any = await service.bookService(
      'athlete',
      'service-1',
      'nota',
    );

    expectNoSensitive(booking.service.provider);
    expectNoSensitive(booking.user);
    expect(booking.service.provider).not.toHaveProperty('email');
    expect(booking.service.provider).not.toHaveProperty('phone');
  });

  it('createPaidBooking (pago con Mercado Pago) no trae datos privados', async () => {
    const booking: any = await service.createPaidBooking(
      prisma,
      'athlete',
      'service-1',
      null,
    );

    expectNoSensitive(booking.service.provider);
    expectNoSensitive(booking.user);
    expect(booking.user.name).toBe('Nombre athlete'); // lo usa notifyBookingCreated
  });

  it('getMyBookings solo expone el nombre y avatar del profesional', async () => {
    const [booking]: any[] = await service.getMyBookings('athlete');

    expect(Object.keys(booking.service.provider).sort()).toEqual([
      'avatarUrl',
      'id',
      'name',
    ]);
  });

  it('updateBookingStatus da al profesional el contacto del cliente, sin DNI ni hash', async () => {
    const booking: any = await service.updateBookingStatus(
      'booking-1',
      'provider',
      'CONFIRMED',
      false,
    );

    expect(Object.keys(booking.user).sort()).toEqual([
      'email',
      'id',
      'name',
      'phone',
    ]);
    expectNoSensitive(booking.user);
    expectNoSensitive(booking.service.provider);
  });

  it('ninguna consulta de reservas pide una relación User completa', async () => {
    await service.bookService('athlete', 'service-1');
    await service.createPaidBooking(prisma, 'athlete', 'service-1');
    await service.getMyBookings('athlete');
    await service.updateBookingStatus(
      'booking-1',
      'provider',
      'CANCELLED',
      false,
    );

    const calls = [
      ...prisma.professionalBooking.create.mock.calls,
      ...prisma.professionalBooking.update.mock.calls,
      ...prisma.professionalBooking.findMany.mock.calls,
    ];
    for (const [args] of calls) {
      const inc = args.include;
      expect(inc.service.include.provider).not.toBe(true);
      if ('user' in inc) expect(inc.user).not.toBe(true);
    }
  });
});
