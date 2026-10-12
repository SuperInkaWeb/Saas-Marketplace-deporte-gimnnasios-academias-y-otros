import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { MembershipsService } from '../memberships/memberships.service';
import { ClassesService } from '../classes/classes.service';
import { ProfessionalsService } from '../professionals/professionals.service';

describe('PaymentsService.createClassCheckout', () => {
  let service: PaymentsService;
  const prisma = {
    class: { findUnique: jest.fn() },
    reservation: { findUnique: jest.fn() },
    payment: { create: jest.fn() },
  };
  const classes = { book: jest.fn() };

  const futureClass = (over: any = {}) => ({
    id: 'c1',
    title: 'Clase QA',
    isActive: true,
    capacity: 20,
    price: new Prisma.Decimal(10),
    scheduledAt: new Date(Date.now() + 86_400_000),
    _count: { reservations: 0 },
    ...over,
  });

  beforeAll(() => {
    process.env.MP_ACCESS_TOKEN = 'TEST-token';
    process.env.FRONTEND_URL = 'http://localhost:5173';
  });

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: MembershipsService, useValue: {} },
        { provide: ClassesService, useValue: classes },
        { provide: ProfessionalsService, useValue: {} },
      ],
    }).compile();
    service = moduleRef.get(PaymentsService);
  });

  it('rechaza una clase inexistente', async () => {
    prisma.class.findUnique.mockResolvedValue(null);
    await expect(service.createClassCheckout('u1', 'a@b.c', 'c1')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });

  it('rechaza una clase que ya pasó', async () => {
    prisma.class.findUnique.mockResolvedValue(futureClass({ scheduledAt: new Date(Date.now() - 86_400_000) }));
    await expect(service.createClassCheckout('u1', 'a@b.c', 'c1')).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });

  it('rechaza una clase llena', async () => {
    prisma.class.findUnique.mockResolvedValue(futureClass({ _count: { reservations: 20 } }));
    await expect(service.createClassCheckout('u1', 'a@b.c', 'c1')).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });

  it('rechaza si el usuario ya tiene reserva confirmada', async () => {
    prisma.class.findUnique.mockResolvedValue(futureClass());
    prisma.reservation.findUnique.mockResolvedValue({ status: 'CONFIRMED' });
    await expect(service.createClassCheckout('u1', 'a@b.c', 'c1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('una clase gratuita se reserva directo, sin crear pago', async () => {
    prisma.class.findUnique.mockResolvedValue(futureClass({ price: new Prisma.Decimal(0) }));
    prisma.reservation.findUnique.mockResolvedValue(null);
    classes.book.mockResolvedValue({});
    await expect(service.createClassCheckout('u1', 'a@b.c', 'c1')).resolves.toEqual({ free: true });
    expect(classes.book).toHaveBeenCalledWith('u1', 'c1');
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });
});