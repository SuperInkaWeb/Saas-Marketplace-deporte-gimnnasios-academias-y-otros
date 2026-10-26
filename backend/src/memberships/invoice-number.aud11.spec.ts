import { randomUUID } from 'crypto';
import { MembershipsService, buildInvoiceNumber } from './memberships.service';
import { PrismaService } from '../prisma/prisma.service';

// AUD-11: el número de factura era "INV-" + los últimos 6 dígitos de Date.now(),
// con restricción única en la base. Dos pagos activados en el mismo milisegundo,
// o con 1 000 segundos exactos de diferencia, chocaban y la membresía ya cobrada
// no se activaba.
describe('Numeración de facturas (AUD-11)', () => {
  let service: MembershipsService;
  let tx: any;

  beforeEach(() => {
    tx = {
      payment: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn().mockResolvedValue(undefined),
      },
      membershipPlan: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          id: 'plan-1',
          gymId: 'gym-1',
          durationDays: 30,
        }),
      },
      userMembership: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn().mockResolvedValue({ id: 'm1' }),
      },
      invoice: { create: jest.fn().mockResolvedValue(undefined) },
    };
    const prisma = {
      $transaction: jest.fn((fn: (t: unknown) => unknown) => fn(tx)),
    };
    service = new MembershipsService(prisma as unknown as PrismaService);
  });

  afterEach(() => jest.restoreAllMocks());

  const activate = async (paymentId: string) => {
    tx.payment.findUniqueOrThrow.mockResolvedValueOnce({
      id: paymentId,
      userId: 'u1',
      amount: 100,
    });
    await service.activateFromPayment(paymentId, 'plan-1', 'mp-1');
    const calls = tx.invoice.create.mock.calls;
    return calls[calls.length - 1][0].data.invoiceNum as string;
  };

  it('dos pagos activados en el mismo milisegundo reciben números distintos', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_761_500_000_000);

    const a = await activate(randomUUID());
    const b = await activate(randomUUID());

    expect(a).not.toBe(b);
  });

  it('pagos con 1 000 segundos exactos de diferencia no chocan', async () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(1_761_500_000_000);
    const a = await activate(randomUUID());
    now.mockReturnValue(1_761_500_000_000 + 1_000_000);
    const b = await activate(randomUUID());

    expect(a).not.toBe(b);
  });

  it('5 000 facturas seguidas no repiten número', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_761_500_000_000);
    const numbers = new Set<string>();
    for (let i = 0; i < 5000; i++) {
      numbers.add(await activate(randomUUID()));
    }
    expect(numbers.size).toBe(5000);
  });

  it('el número sale del id del pago y entra en la columna (50 caracteres)', async () => {
    const num = await activate('1eb84c54-8bc8-4140-9599-819545fb483d');

    expect(num).toMatch(/^INV-\d{8}-1EB84C548BC8$/);
    expect(num.length).toBeLessThanOrEqual(50);
  });
});

describe('buildInvoiceNumber (AUD-11)', () => {
  it('usa la fecha de Lima, no la de UTC', () => {
    // 26/10 a las 02:00 UTC todavía es 25/10 en Lima (UTC-5)
    const issuedAt = new Date('2026-10-26T02:00:00Z');
    expect(
      buildInvoiceNumber('abcdef12-3456-7890-abcd-ef1234567890', issuedAt),
    ).toBe('INV-20261025-ABCDEF123456');
  });

  it('es estable para el mismo pago y la misma fecha', () => {
    const issuedAt = new Date('2026-10-26T15:00:00Z');
    const id = randomUUID();
    expect(buildInvoiceNumber(id, issuedAt)).toBe(
      buildInvoiceNumber(id, issuedAt),
    );
  });
});
