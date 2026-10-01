import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
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
          success: `${process.env.FRONTEND_URL}/payment/success?ref=${payment.id}`,
          failure: `${process.env.FRONTEND_URL}/payment/failure?ref=${payment.id}`,
          pending: `${process.env.FRONTEND_URL}/payment/pending?ref=${payment.id}`,
        },
        auto_return: 'approved',
        notification_url: `${process.env.BACKEND_URL}/payments/mercadopago/webhook`,
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
    if (local.status !== PaymentStatus.PENDING) return { status: local.status };

    if (mpPayment.status === 'approved') {
      const sameAmount = Number(mpPayment.transaction_amount) === Number(local.amount);
      const planId = (mpPayment.metadata as any)?.plan_id;
      if (!sameAmount || mpPayment.currency_id !== 'PEN' || !planId) {
        this.logger.error(`Pago ${local.id} aprobado pero con datos que no coinciden`);
        return { status: 'MISMATCH' };
      }
      await this.memberships.activateFromPayment(local.id, planId, String(mpPayment.id));
      return { status: PaymentStatus.COMPLETED };
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

  async getStatus(paymentId: string, userId: string) {
    const p = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!p || p.userId !== userId) throw new NotFoundException();
    return { id: p.id, status: p.status, amount: p.amount };
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