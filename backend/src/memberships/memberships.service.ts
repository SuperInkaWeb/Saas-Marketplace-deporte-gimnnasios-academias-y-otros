import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateMembershipPlanDto,
  UpdateMembershipPlanDto,
  SubscribeDto,
} from './dto/membership.dto';
import { MembershipStatus, PaymentStatus, InvoiceStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

// AUD-11: el número sale del id del pago (único por factura) y de la fecha de emisión
// en Lima, en vez de los últimos 6 dígitos de la hora, que chocaban con facilidad.
export function buildInvoiceNumber(paymentId: string, issuedAt: Date = new Date()): string {
  const day = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(issuedAt)
    .replace(/-/g, '');
  const suffix = paymentId.replace(/-/g, '').slice(0, 12).toUpperCase();
  return `INV-${day}-${suffix}`;
}

@Injectable()
export class MembershipsService {
  constructor(private prisma: PrismaService) {}

  async createPlan(gymId: string, ownerId: string, dto: CreateMembershipPlanDto) {
    const gym = await this.prisma.gym.findUnique({ where: { id: gymId } });
    if (!gym) throw new NotFoundException('Gimnasio no encontrado');
    if (gym.ownerId !== ownerId) {
      throw new ForbiddenException('No eres el dueño de este gimnasio');
    }

    return this.prisma.membershipPlan.create({
      data: {
        ...dto,
        gymId,
      },
    });
  }

  // AUD-25: endpoint público de solo lectura. Antes, si no había planes activos,
  // creaba planes de ejemplo (y hasta un gimnasio o un usuario ADMIN sin contraseña).
  // Si no hay planes se devuelve la lista vacía; el frontend ya muestra ese estado.
  async findAllPlans(gymId?: string) {
    return this.prisma.membershipPlan.findMany({
      where: {
        ...(gymId ? { gymId } : {}),
        isActive: true,
      },
      include: {
        gym: { select: { name: true } },
      },
    });
  }

  async subscribe(userId: string, dto: SubscribeDto) {
    // 1. Get plan
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id: dto.planId },
    });

    if (!plan) throw new NotFoundException('Plan no encontrado');
    if (!plan.isActive) throw new BadRequestException('Este plan no está disponible');
    if (Number(plan.price) > 0) {
      throw new BadRequestException('Este plan requiere pago con Mercado Pago');
    }
    // 2. Calculate expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + plan.durationDays);

    // 3. Create membership, payment and invoice with a transaction
        return this.prisma.$transaction(async (tx) => {
      // Desactivar solo las membresías activas previas del usuario EN ESTE MISMO GIMNASIO/ACADEMIA
      const activeGymMemberships = await tx.userMembership.findMany({
        where: {
          userId,
          status: MembershipStatus.ACTIVE,
          plan: { gymId: plan.gymId },
        },
        select: { id: true },
      });

      if (activeGymMemberships.length > 0) {
        await tx.userMembership.updateMany({
          where: { id: { in: activeGymMemberships.map((m) => m.id) } },
          data: { status: MembershipStatus.EXPIRED },
        });
      }

      return tx.userMembership.create({
        data: {
          userId,
          planId: plan.id,
          status: MembershipStatus.ACTIVE,
          expiresAt,
        },
        include: { plan: true },
      });
    });
  }

  async activateFromPayment(paymentId: string, planId: string, mpPaymentId: string) {
    return this.prisma.$transaction(async (tx) => {
      // "Reclama" el pago: solo uno de varios webhooks simultáneos lo logra
      const claimed = await tx.payment.updateMany({
        where: { id: paymentId, status: PaymentStatus.PENDING },
        data: {
          status: PaymentStatus.COMPLETED,
          gatewayTxId: `MP:${mpPaymentId}`,
          paidAt: new Date(),
        },
      });
      if (claimed.count === 0) return null; 

      const payment = await tx.payment.findUniqueOrThrow({ where: { id: paymentId } });
      const plan = await tx.membershipPlan.findUniqueOrThrow({ where: { id: planId } });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + plan.durationDays);

      await tx.userMembership.updateMany({
        where: {
          userId: payment.userId,
          status: MembershipStatus.ACTIVE,
          plan: { gymId: plan.gymId },
        },
        data: { status: MembershipStatus.EXPIRED },
      });

      const membership = await tx.userMembership.create({
        data: {
          userId: payment.userId,
          planId: plan.id,
          status: MembershipStatus.ACTIVE,
          expiresAt,
        },
        include: { plan: true },
      });

      await tx.payment.update({
        where: { id: payment.id },
        data: { membershipId: membership.id },
      });

      const invoiceAmount = Number(payment.amount);
      const taxAmount = invoiceAmount * 0.19; 
      await tx.invoice.create({
        data: {
          paymentId: payment.id,
          userId: payment.userId,
          gymId: plan.gymId,
          invoiceNum: buildInvoiceNumber(payment.id),
          amount: invoiceAmount,
          tax: taxAmount,
          total: invoiceAmount + taxAmount,
          status: InvoiceStatus.ISSUED,
          pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        },
      });

      return membership;
    });
  }

  async getUserMemberships(userId: string) {
    return this.prisma.userMembership.findMany({
      where: { userId },
      include: {
        plan: {
          include: { gym: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllMembershipsForAdmin(gymId?: string) {
    return this.prisma.userMembership.findMany({
      where: gymId ? { plan: { gymId } } : {},
      include: {
        plan: {
          include: { gym: { select: { name: true } } },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
        payments: {
          select: { id: true, amount: true, status: true, paidAt: true, gatewayTxId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updatePlan(planId: string, ownerId: string, dto: UpdateMembershipPlanDto, isAdmin = false) {
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id: planId },
      include: { gym: true }
    });
    if (!plan) throw new NotFoundException('Plan no encontrado');
    if (!isAdmin && plan.gym.ownerId !== ownerId) {
      throw new ForbiddenException('No tienes permisos para modificar este plan');
    }

    return this.prisma.membershipPlan.update({
      where: { id: planId },
      data: dto,
    });
  }

  async deletePlan(planId: string, ownerId: string, isAdmin = false) {
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id: planId },
      include: { gym: true }
    });
    if (!plan) throw new NotFoundException('Plan no encontrado');
    if (!isAdmin && plan.gym.ownerId !== ownerId) {
      throw new ForbiddenException('No tienes permisos para eliminar este plan');
    }

    return this.prisma.membershipPlan.update({
      where: { id: planId },
      data: { isActive: false },
    });
  }
}
