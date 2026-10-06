import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { MercadoPagoConfig, Preference, Payment as MpPayment } from 'mercadopago';
import { PaymentStatus, ReservationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MembershipsService } from '../memberships/memberships.service';
import { ClassesService } from '../classes/classes.service';
import { ProfessionalsService } from '../professionals/professionals.service';

type PaymentKind = 'ORDER' | 'MEMBERSHIP' | 'CLASS' | 'SERVICE';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly mp = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN!,
  });

  constructor(
    private readonly prisma: PrismaService,
    private readonly memberships: MembershipsService,
    private readonly classes: ClassesService,
    private readonly professionals: ProfessionalsService,
  ) {}

  // ---------- MERCADO PAGO ----------

  private kindOf(p: {
    orderId?: string | null;
    classId?: string | null;
    serviceId?: string | null;
  }): PaymentKind {
    if (p.orderId) return 'ORDER';
    if (p.classId) return 'CLASS';
    if (p.serviceId) return 'SERVICE';
    return 'MEMBERSHIP';
  }

  private async createPreference(args: {
    paymentId: string;
    email: string;
    item: { id: string; title: string; unitPrice: number };
    metadata: Record<string, string>;
  }): Promise<string> {
    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) throw new Error('FRONTEND_URL no está configurada');
    const isHttps = frontendUrl.startsWith('https://');

    const preference = await new Preference(this.mp).create({
      body: {
        items: [
          {
            id: args.item.id,
            title: args.item.title,
            quantity: 1,
            unit_price: args.item.unitPrice,
            currency_id: 'PEN',
          },
        ],
        payer: { email: args.email },
        external_reference: args.paymentId,
        metadata: args.metadata,
        back_urls: {
          success: `${frontendUrl}/payment/success?ref=${args.paymentId}`,
          failure: `${frontendUrl}/payment/failure?ref=${args.paymentId}`,
          pending: `${frontendUrl}/payment/pending?ref=${args.paymentId}`,
        },
        ...(isHttps ? { auto_return: 'approved' as const } : {}),
        ...(process.env.BACKEND_URL?.startsWith('https://')
          ? { notification_url: `${process.env.BACKEND_URL}/api/payments/mercadopago/webhook` }
          : {}),
      },
    });
    return preference.init_point!;
  }

  async createMembershipCheckout(userId: string, email: string, planId: string) {
    const plan = await this.prisma.membershipPlan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) throw new NotFoundException('Plan no disponible');

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        amount: plan.price,
        currency: 'PEN',
        status: PaymentStatus.PENDING,
        description: `Suscripción a ${plan.name}`,
      },
    });

    const checkoutUrl = await this.createPreference({
      paymentId: payment.id,
      email,
      item: { id: plan.id, title: `Suscripción a ${plan.name}`, unitPrice: Number(plan.price) },
      metadata: { plan_id: plan.id, user_id: userId },
    });

    return { paymentId: payment.id, checkoutUrl };
  }

  async createOrderCheckout(
    userId: string,
    email: string,
    items: { productId: string; quantity: number }[],
  ) {
    if (!items?.length) throw new BadRequestException('Carrito vacío');

    const qtyById = new Map<string, number>();
    for (const i of items) {
      if (!Number.isInteger(i.quantity) || i.quantity < 1) {
        throw new BadRequestException('Cantidad inválida');
      }
      qtyById.set(i.productId, (qtyById.get(i.productId) ?? 0) + i.quantity);
    }

    const products = await this.prisma.product.findMany({
      where: { id: { in: [...qtyById.keys()] } },
    });
    if (products.length !== qtyById.size) throw new NotFoundException('Producto no encontrado');

    if (new Set(products.map((p) => p.gymId)).size > 1) {
      throw new BadRequestException('Paga por separado los productos de cada vendedor');
    }

    for (const p of products) {
      const qty = qtyById.get(p.id)!;
      if (!p.isActive || p.price.lte(0)) throw new BadRequestException(`Producto no disponible: ${p.name}`);
      if (p.stock < qty) throw new BadRequestException(`Sin stock: ${p.name}`);
    }

    const total = products.reduce((s, p) => s + Number(p.price) * qtyById.get(p.id)!, 0);
    const totalRounded = Math.round(total * 100) / 100;

    const { order, payment } = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId,
          gymId: products[0].gymId,
          status: 'PENDING',
          totalAmount: totalRounded,
          orderItems: {
            create: products.map((p) => ({
              productId: p.id,
              quantity: qtyById.get(p.id)!,
              unitPrice: p.price,
            })),
          },
        },
      });
      const payment = await tx.payment.create({
        data: {
          userId,
          amount: totalRounded,
          currency: 'PEN',
          status: PaymentStatus.PENDING,
          orderId: order.id,
          description: 'Compra en Tienda Deportiva',
        },
      });
      return { order, payment };
    });

    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) throw new Error('FRONTEND_URL no está configurada');
    const isHttps = frontendUrl.startsWith('https://');

    const preference = await new Preference(this.mp).create({
      body: {
        items: products.map((p) => ({
          id: p.id,
          title: p.name,
          quantity: qtyById.get(p.id)!,
          unit_price: Number(p.price),
          currency_id: 'PEN',
        })),
        payer: { email },
        external_reference: payment.id,
        metadata: { order_id: order.id, user_id: userId },
        back_urls: {
          success: `${frontendUrl}/payment/success?ref=${payment.id}`,
          failure: `${frontendUrl}/payment/failure?ref=${payment.id}`,
          pending: `${frontendUrl}/payment/pending?ref=${payment.id}`,
        },
        ...(isHttps ? { auto_return: 'approved' as const } : {}),
        ...(process.env.BACKEND_URL?.startsWith('https://')
          ? { notification_url: `${process.env.BACKEND_URL}/api/payments/mercadopago/webhook` }
          : {}),
      },
    });

    return { paymentId: payment.id, checkoutUrl: preference.init_point };
  }

  async createClassCheckout(userId: string, email: string, classId: string) {
    const cls = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        _count: {
          select: { reservations: { where: { status: ReservationStatus.CONFIRMED } } },
        },
      },
    });
    if (!cls || !cls.isActive) throw new NotFoundException('Clase no disponible');
    if (cls.scheduledAt <= new Date()) {
      throw new BadRequestException('Esta clase ya comenzó o ya pasó');
    }
    if (cls._count.reservations >= cls.capacity) {
      throw new BadRequestException('La clase está llena');
    }

    const already = await this.prisma.reservation.findUnique({
      where: { classId_userId: { classId, userId } },
    });
    if (already?.status === ReservationStatus.CONFIRMED) {
      throw new BadRequestException('Ya tienes una reserva para esta clase');
    }

    if (cls.price.lte(0)) {
      await this.classes.book(userId, classId);
      return { free: true as const };
    }

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        amount: cls.price,
        currency: 'PEN',
        status: PaymentStatus.PENDING,
        classId,
        description: `Clase: ${cls.title}`,
      },
    });

    const checkoutUrl = await this.createPreference({
      paymentId: payment.id,
      email,
      item: { id: cls.id, title: `Clase: ${cls.title}`, unitPrice: Number(cls.price) },
      metadata: { class_id: cls.id, user_id: userId },
    });

    return { free: false as const, paymentId: payment.id, checkoutUrl };
  }

  async createServiceCheckout(userId: string, email: string, serviceId: string, notes?: string) {
    const service = await this.prisma.professionalService.findUnique({
      where: { id: serviceId },
    });
    if (!service || !service.isActive) throw new NotFoundException('Servicio no disponible');
    if (service.providerId === userId) {
      throw new BadRequestException('No puedes reservar tu propio servicio');
    }

    if (service.price.lte(0)) {
      await this.professionals.bookService(userId, serviceId, notes);
      return { free: true as const };
    }

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        amount: service.price,
        currency: 'PEN',
        status: PaymentStatus.PENDING,
        serviceId,
        bookingNotes: notes?.slice(0, 500),
        description: `Servicio: ${service.title}`,
      },
    });

    const checkoutUrl = await this.createPreference({
      paymentId: payment.id,
      email,
      item: { id: service.id, title: service.title, unitPrice: Number(service.price) },
      metadata: { service_id: service.id, user_id: userId },
    });

    return { free: false as const, paymentId: payment.id, checkoutUrl };
  }

  async processMercadoPagoPayment(mpPaymentId: string, expectedUserId?: string) {
    const mpPayment = await new MpPayment(this.mp).get({ id: mpPaymentId });

    const localId = mpPayment.external_reference;
    if (!localId) return { status: 'IGNORED' };

    const local = await this.prisma.payment.findUnique({ where: { id: localId } });
    if (!local) {
      this.logger.warn(`Pago local ${localId} no encontrado`);
      return { status: 'IGNORED' };
    }
    if (expectedUserId && local.userId !== expectedUserId) {
      throw new ForbiddenException();
    }
    if (local.status !== PaymentStatus.PENDING) {
      return { status: local.status, type: this.kindOf(local) };
    }

    if (mpPayment.status === 'approved') {
      const sameAmount = Number(mpPayment.transaction_amount) === Number(local.amount);
      if (!sameAmount || mpPayment.currency_id !== 'PEN') {
        this.logger.error(`Pago ${local.id} aprobado pero con datos que no coinciden`);
        return { status: 'MISMATCH' };
      }

      if (local.orderId) {
        return this.completeOrderPayment(local.id, local.orderId, String(mpPayment.id));
      }
      if (local.classId) {
        return this.completeClassPayment(local.id, local.userId, local.classId, String(mpPayment.id));
      }
      if (local.serviceId) {
        return this.completeServicePayment(
          local.id,
          local.userId,
          local.serviceId,
          local.bookingNotes,
          String(mpPayment.id),
        );
      }

      const planId = (mpPayment.metadata as any)?.plan_id;
      if (!planId) return { status: 'MISMATCH' };
      await this.memberships.activateFromPayment(local.id, planId, String(mpPayment.id));
      return { status: PaymentStatus.COMPLETED, type: 'MEMBERSHIP' };
    }

    if (mpPayment.status === 'rejected' || mpPayment.status === 'cancelled') {
      await this.prisma.payment.updateMany({
        where: { id: local.id, status: PaymentStatus.PENDING },
        data: { status: PaymentStatus.FAILED },
      });
      return { status: PaymentStatus.FAILED, type: this.kindOf(local) };
    }
    return { status: PaymentStatus.PENDING, type: this.kindOf(local) };
  }

  private async completeOrderPayment(paymentId: string, orderId: string, mpId: string) {
    try {
      await this.prisma.$transaction(async (tx) => {
        const claimed = await tx.payment.updateMany({
          where: { id: paymentId, status: PaymentStatus.PENDING },
          data: { status: PaymentStatus.COMPLETED, gatewayTxId: `MP:${mpId}`, paidAt: new Date() },
        });
        if (claimed.count === 0) return;

        const order = await tx.order.findUniqueOrThrow({
          where: { id: orderId },
          include: { orderItems: true },
        });

        for (const it of order.orderItems) {
          const r = await tx.product.updateMany({
            where: { id: it.productId, stock: { gte: it.quantity } },
            data: { stock: { decrement: it.quantity } },
          });
          if (r.count === 0) throw new ConflictException('Stock insuficiente');
        }

        await tx.order.update({ where: { id: orderId }, data: { status: 'PAID' } });
      });
      return { status: PaymentStatus.COMPLETED, type: 'ORDER' };
    } catch (e) {
      this.logger.error(
        `Pago MP ${mpId} aprobado pero la orden ${orderId} falló: ${(e as Error).message}`,
      );
      return { status: 'NEEDS_REVIEW' };
    }
  }

  private async completeClassPayment(
    paymentId: string,
    userId: string,
    classId: string,
    mpId: string,
  ) {
    try {
      const reservation = await this.prisma.$transaction(async (tx) => {
        const claimed = await tx.payment.updateMany({
          where: { id: paymentId, status: PaymentStatus.PENDING },
          data: { status: PaymentStatus.COMPLETED, gatewayTxId: `MP:${mpId}`, paidAt: new Date() },
        });
        if (claimed.count === 0) return null;
        return this.classes.reservePaidSeat(tx, userId, classId);
      });

      if (reservation) await this.classes.notifyNewReservation(reservation);
      return { status: PaymentStatus.COMPLETED, type: 'CLASS' };
    } catch (e) {
      this.logger.error(
        `Pago MP ${mpId} aprobado pero la reserva de clase ${classId} falló: ${(e as Error).message}`,
      );
      return { status: 'NEEDS_REVIEW' };
    }
  }

  private async completeServicePayment(
    paymentId: string,
    userId: string,
    serviceId: string,
    notes: string | null,
    mpId: string,
  ) {
    try {
      const booking = await this.prisma.$transaction(async (tx) => {
        const claimed = await tx.payment.updateMany({
          where: { id: paymentId, status: PaymentStatus.PENDING },
          data: { status: PaymentStatus.COMPLETED, gatewayTxId: `MP:${mpId}`, paidAt: new Date() },
        });
        if (claimed.count === 0) return null;
        return this.professionals.createPaidBooking(tx, userId, serviceId, notes);
      });

      if (booking) await this.professionals.notifyBookingCreated(booking);
      return { status: PaymentStatus.COMPLETED, type: 'SERVICE' };
    } catch (e) {
      this.logger.error(
        `Pago MP ${mpId} aprobado pero la cita del servicio ${serviceId} falló: ${(e as Error).message}`,
      );
      return { status: 'NEEDS_REVIEW' };
    }
  }

  async getStatus(paymentId: string, userId: string) {
    const p = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!p || p.userId !== userId) throw new NotFoundException();
    return { id: p.id, status: p.status, amount: p.amount, type: this.kindOf(p) };
  }
}