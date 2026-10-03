import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { MercadoPagoConfig, Preference, Payment as MpPayment } from 'mercadopago';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MembershipsService } from '../memberships/memberships.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly mp = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN!,
  });

  constructor(
    private readonly prisma: PrismaService,
    private readonly memberships: MembershipsService,
  ) {}

  // ---------- MERCADO PAGO ----------

  async createMembershipCheckout(userId: string, email: string, planId: string) {
    // El precio sale de la base de datos, nunca del frontend
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

    const frontendUrl = process.env.FRONTEND_URL; // http://localhost:5173
    if (!frontendUrl) throw new Error('FRONTEND_URL no está configurada');
    const isHttps = frontendUrl.startsWith('https://');

const preference = await new Preference(this.mp).create({
  body: {
    items: [
      {
        id: plan.id,
        title: `Suscripción a ${plan.name}`,
        quantity: 1,
        unit_price: Number(plan.price),
        currency_id: 'PEN',
      },
    ],
    payer: { email },
    external_reference: payment.id,
    metadata: { plan_id: plan.id, user_id: userId },
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

async createOrderCheckout(
  userId: string,
  email: string,
  items: { productId: string; quantity: number }[],
) {
  if (!items?.length) throw new BadRequestException('Carrito vacío');

  // Unir líneas repetidas y validar cantidades
  const qtyById = new Map<string, number>();
  for (const i of items) {
    if (!Number.isInteger(i.quantity) || i.quantity < 1) {
      throw new BadRequestException('Cantidad inválida');
    }
    qtyById.set(i.productId, (qtyById.get(i.productId) ?? 0) + i.quantity);
  }

  // Precios y stock SIEMPRE desde la BD
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

  /**
   * Consulta el pago directo a Mercado Pago y actúa según su estado.
   * expectedUserId: si viene (llamada desde el usuario), valida que el pago sea suyo.
   */
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
      return { status: local.status, type: local.orderId ? 'ORDER' : 'MEMBERSHIP' };
    }

    if (mpPayment.status === 'approved') {
      const sameAmount = Number(mpPayment.transaction_amount) === Number(local.amount);
      if (!sameAmount || mpPayment.currency_id !== 'PEN') {
        this.logger.error(`Pago ${local.id} aprobado pero con datos que no coinciden`);
        return { status: 'MISMATCH' };
      }

      // Compra del marketplace
      if (local.orderId) {
        return this.completeOrderPayment(local.id, local.orderId, String(mpPayment.id));
      }

      // Membresía
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
      return { status: PaymentStatus.FAILED };
    }
    return { status: PaymentStatus.PENDING };
  }

  private async completeOrderPayment(paymentId: string, orderId: string, mpId: string) {
    try {
      await this.prisma.$transaction(async (tx) => {
        // "Reclamar" el pago: solo una llamada (confirm o webhook) pasa de PENDING a COMPLETED
        const claimed = await tx.payment.updateMany({
          where: { id: paymentId, status: PaymentStatus.PENDING },
          data: { status: PaymentStatus.COMPLETED, gatewayTxId: `MP:${mpId}`, paidAt: new Date() },
        });
        if (claimed.count === 0) return; // otro proceso ya lo hizo

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
      // Todo se revierte: el pago queda PENDING aunque MP ya cobró
      this.logger.error(
        `Pago MP ${mpId} aprobado pero la orden ${orderId} falló: ${(e as Error).message}`,
      );
      return { status: 'NEEDS_REVIEW' };
    }
  }

  async getStatus(paymentId: string, userId: string) {
    const p = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!p || p.userId !== userId) throw new NotFoundException();
  return { id: p.id, status: p.status, amount: p.amount, type: p.orderId ? 'ORDER' : 'MEMBERSHIP' };
  }

  // ---------- PAYME (borrar al terminar la migración) ----------

  async createPaymeSignature(amount: number, description?: string) {
    const acquirerId = process.env.PAYME_ACQUIRER_ID || '148';
    const idCommerce = process.env.PAYME_COMMERCE_ID || '8259';
    const purchaseCurrencyCode = '604'; // Soles
    const apiKey = process.env.PAYME_API_KEY || '123456789';

    const purchaseAmount = Math.round(amount * 100).toString();
    const purchaseOperationNumber = Math.floor(Math.random() * 999999)
      .toString()
      .padStart(6, '0');

    const dataToSign = `${acquirerId}${idCommerce}${purchaseOperationNumber}${purchaseAmount}${purchaseCurrencyCode}${apiKey}`;
    const purchaseVerification = crypto.createHash('sha512').update(dataToSign).digest('hex');

    return {
      acquirerId,
      idCommerce,
      purchaseOperationNumber,
      purchaseAmount,
      purchaseCurrencyCode,
      purchaseVerification,
      description: description || 'Compra en Hercix',
    };
  }
}