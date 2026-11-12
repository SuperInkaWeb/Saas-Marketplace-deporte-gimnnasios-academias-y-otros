import { ConflictException } from '@nestjs/common';
import { ClassesService } from '../../classes/classes.service';
import { ClassesController } from '../../classes/classes.controller';
import { MarketplaceService } from '../../marketplace/marketplace.service';
import { MembershipsService } from '../../memberships/memberships.service';
import { PaymentsService } from '../../payments/payments.service';
import { GYM_INACTIVE_MESSAGE, visibleGymWhere } from './gym-status';

// AUD-17: desactivar un gimnasio no bloqueaba reservas, ventas ni membresías, y sus
// clases, planes y productos seguían apareciendo en los listados.

const INACTIVE = { status: 'INACTIVE' };
const ACTIVE = { status: 'ACTIVE' };
const future = () => new Date(Date.now() + 24 * 60 * 60 * 1000);

const expectInactive = async (p: Promise<unknown>) => {
  await expect(p).rejects.toBeInstanceOf(ConflictException);
  await expect(p).rejects.toThrow(GYM_INACTIVE_MESSAGE);
};

describe('AUD-17 · visibleGymWhere', () => {
  it('anónimo: solo gimnasios activos', () => {
    expect(visibleGymWhere(null)).toEqual({ status: 'ACTIVE' });
  });
  it('usuario con sesión: activos o los suyos', () => {
    expect(visibleGymWhere({ id: 'u1', role: 'GYM_OWNER' })).toEqual({
      OR: [{ status: 'ACTIVE' }, { ownerId: 'u1' }],
    });
  });
  it('ADMIN: sin filtro', () => {
    expect(visibleGymWhere({ id: 'a1', role: 'ADMIN' })).toBeUndefined();
  });
});

describe('AUD-17 · clases', () => {
  const build = (gym: any) => {
    const prisma: any = {
      class: {
        findUnique: jest.fn().mockResolvedValue({ price: 0, gym }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      reservation: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn().mockResolvedValue({
        id: 'r1',
        userId: 'u1',
        classId: 'c1',
        user: { name: 'Atleta' },
        class: { title: 'Funcional', gym: { ownerId: 'o1' } },
      }),
    };
    const notifications: any = { create: jest.fn().mockResolvedValue({}) };
    const service = new ClassesService(
      prisma,
      notifications,
      {} as any,
      {} as any,
      {} as any,
    );
    return { prisma, service };
  };

  it('no se puede reservar una clase gratuita de un gimnasio inactivo', async () => {
    const { prisma, service } = build(INACTIVE);
    await expectInactive(service.book('u1', 'c1'));
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('con el gimnasio activo la reserva sigue funcionando', async () => {
    const { prisma, service } = build(ACTIVE);
    await service.book('u1', 'c1');
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('el listado aplica el filtro de gimnasio y lo combina con el del dueño', async () => {
    const { prisma, service } = build(ACTIVE);
    await service.findAll(
      'g1',
      undefined,
      undefined,
      undefined,
      false,
      undefined,
      { status: 'ACTIVE' } as any,
    );
    expect(prisma.class.findMany.mock.calls[0][0].where.gym).toEqual({
      status: 'ACTIVE',
    });

    await service.findAll(
      undefined,
      undefined,
      'o1',
      undefined,
      false,
      undefined,
      { status: 'ACTIVE' } as any,
    );
    expect(prisma.class.findMany.mock.calls[1][0].where.gym).toEqual({
      ownerId: 'o1',
      status: 'ACTIVE',
    });

    await service.findAll(undefined, undefined, 'o1');
    expect(prisma.class.findMany.mock.calls[2][0].where.gym).toEqual({
      ownerId: 'o1',
    });
  });

  it('el controlador filtra para atletas y no para el staff', () => {
    const findAll = jest.fn();
    const controller = new ClassesController({ findAll } as any);
    void controller.findAll('g1', undefined, undefined, {
      id: 'u1',
      role: 'USER',
    });
    expect(findAll.mock.calls[0][6]).toEqual({
      OR: [{ status: 'ACTIVE' }, { ownerId: 'u1' }],
    });
    void controller.findAll('g1', undefined, undefined, {
      id: 'o1',
      role: 'GYM_OWNER',
    });
    expect(findAll.mock.calls[1][6]).toBeUndefined();
  });
});

describe('AUD-17 · tienda', () => {
  it('el listado de productos oculta los de gimnasios inactivos según quién mira', async () => {
    const prisma: any = {
      product: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const service = new MarketplaceService(prisma);
    await service.findAllProducts(undefined, null);
    await service.findAllProducts('g1', { id: 'o1', role: 'GYM_OWNER' });
    await service.findAllProducts(undefined, { id: 'a1', role: 'ADMIN' });
    const wheres = prisma.product.findMany.mock.calls.map(
      (c: any) => c[0].where,
    );
    expect(wheres[0].gym).toEqual({ status: 'ACTIVE' });
    expect(wheres[1]).toMatchObject({
      gymId: 'g1',
      gym: { OR: [{ status: 'ACTIVE' }, { ownerId: 'o1' }] },
    });
    expect(wheres[2].gym).toBeUndefined();
  });

  it('no se puede pedir un producto gratuito de un gimnasio inactivo', async () => {
    const tx: any = {
      product: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'p1',
          name: 'Botella',
          price: 0,
          gym: INACTIVE,
        }),
        update: jest.fn(),
      },
      order: { create: jest.fn() },
    };
    const prisma: any = { $transaction: (fn: any) => fn(tx) };
    const service = new MarketplaceService(prisma);
    await expectInactive(
      service.createOrder('u1', {
        gymId: 'g1',
        items: [{ productId: 'p1', quantity: 1 }],
      }),
    );
    expect(tx.product.update).not.toHaveBeenCalled();
    expect(tx.order.create).not.toHaveBeenCalled();
  });
});

describe('AUD-17 · membresías', () => {
  it('el listado de planes oculta los de gimnasios inactivos a los visitantes', async () => {
    const prisma: any = {
      membershipPlan: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const service = new MembershipsService(prisma);
    await service.findAllPlans('g1');
    expect(prisma.membershipPlan.findMany.mock.calls[0][0].where).toMatchObject(
      {
        gymId: 'g1',
        gym: { status: 'ACTIVE' },
      },
    );
  });

  it('no se puede suscribir a un plan gratuito de un gimnasio inactivo', async () => {
    const prisma: any = {
      membershipPlan: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'pl1',
          isActive: true,
          price: 0,
          durationDays: 30,
          gymId: 'g1',
          gym: INACTIVE,
        }),
      },
      $transaction: jest.fn(),
    };
    const service = new MembershipsService(prisma);
    await expectInactive(service.subscribe('u1', { planId: 'pl1' }));
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

describe('AUD-17 · checkouts de Mercado Pago', () => {
  const build = (prismaOverrides: any) => {
    const prisma: any = {
      payment: { create: jest.fn() },
      reservation: { findUnique: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn(),
      ...prismaOverrides,
    };
    const classes: any = { book: jest.fn() };
    const service = new PaymentsService(prisma, {} as any, classes, {} as any);
    return { prisma, classes, service };
  };
  const price = (n: number) => ({
    lte: (x: number) => n <= x,
    valueOf: () => n,
    toString: () => String(n),
  });

  it('membresía: no crea pago para un plan de un gimnasio inactivo', async () => {
    const { prisma, service } = build({
      membershipPlan: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'pl1',
          name: 'Mensual',
          isActive: true,
          price: 50,
          gym: INACTIVE,
        }),
      },
    });
    await expectInactive(
      service.createMembershipCheckout('u1', 'a@b.pe', 'pl1'),
    );
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });

  it('tienda: no crea pedido ni pago con productos de un gimnasio inactivo', async () => {
    const { prisma, service } = build({
      product: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'p1',
            name: 'Botella',
            gymId: 'g1',
            isActive: true,
            stock: 5,
            price: price(20),
            gym: INACTIVE,
          },
        ]),
      },
    });
    await expectInactive(
      service.createOrderCheckout('u1', 'a@b.pe', [
        { productId: 'p1', quantity: 1 },
      ]),
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('clase: no crea pago ni reserva gratuita en un gimnasio inactivo', async () => {
    const { prisma, classes, service } = build({
      class: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'c1',
          title: 'Box',
          isActive: true,
          capacity: 10,
          scheduledAt: future(),
          price: price(0),
          _count: { reservations: 0 },
          gym: INACTIVE,
        }),
      },
    });
    await expectInactive(service.createClassCheckout('u1', 'a@b.pe', 'c1'));
    expect(classes.book).not.toHaveBeenCalled();
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });
});
