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

  async findAllPlans(gymId?: string) {
    let plans = await this.prisma.membershipPlan.findMany({
      where: {
        ...(gymId ? { gymId } : {}),
        isActive: true,
      },
      include: {
        gym: { select: { name: true } },
      },
    });

    if (plans.length === 0 && !gymId) {
      // Check if there are ANY active plans in the entire database
      const totalActivePlans = await this.prisma.membershipPlan.count({
        where: { isActive: true },
      });

      if (totalActivePlans === 0) {
        // Find the first active gym
        let gym = await this.prisma.gym.findFirst({
          where: { status: 'ACTIVE' },
        });

        // If no gym exists, create a default gym owned by the first user
        if (!gym) {
          let user = await this.prisma.user.findFirst();
          if (!user) {
            // Create a default admin user if none exists at all
            user = await this.prisma.user.create({
              data: {
                name: 'Administrador SportNexus',
                email: 'admin@sportnexus.com',
                role: 'ADMIN',
                isActive: true,
              },
            });
          }

          gym = await this.prisma.gym.create({
            data: {
              name: 'Gimnasio SportNexus Central',
              ownerId: user.id,
              address: 'Av. Principal 123',
              city: 'Lima',
              phone: '+51 999 999 999',
              status: 'ACTIVE',
            },
          });
        }

        // Seed the 3 default plans for this gym
        const defaultPlans = [
          {
            name: 'Plan Inicial',
            description: 'Acceso básico a las instalaciones en horarios valle.',
            price: 59.99,
            durationDays: 30,
            maxClasses: 8,
            includesMarketplace: false,
          },
          {
            name: 'Estándar',
            description: 'Acceso completo a sala de musculación y clases grupales.',
            price: 89.99,
            durationDays: 30,
            maxClasses: 16,
            includesMarketplace: true,
          },
          {
            name: 'Premium Élite',
            description: 'Acceso ilimitado, entrenamiento personalizado y descuentos exclusivos.',
            price: 129.99,
            durationDays: 30,
            maxClasses: null,
            includesMarketplace: true,
          },
        ];

        for (const plan of defaultPlans) {
          await this.prisma.membershipPlan.create({
            data: {
              gymId: gym.id,
              name: plan.name,
              description: plan.description,
              price: plan.price,
              durationDays: plan.durationDays,
              maxClasses: plan.maxClasses || undefined,
              includesMarketplace: plan.includesMarketplace,
              isActive: true,
            },
          });
        }

        // Fetch again
        plans = await this.prisma.membershipPlan.findMany({
          where: {
            isActive: true,
          },
          include: {
            gym: { select: { name: true } },
          },
        });
      }
    }

    return plans;
  }

  async subscribe(userId: string, dto: SubscribeDto) {
    // 1. Get plan
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id: dto.planId },
    });

    if (!plan) throw new NotFoundException('Plan no encontrado');
    if (!plan.isActive) throw new BadRequestException('Este plan no está disponible');

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
          plan: {
            gymId: plan.gymId
          }
        },
        select: { id: true }
      });

      if (activeGymMemberships.length > 0) {
        await tx.userMembership.updateMany({
          where: {
            id: { in: activeGymMemberships.map(m => m.id) }
          },
          data: {
            status: MembershipStatus.EXPIRED,
          },
        });
      }

      const membership = await tx.userMembership.create({
        data: {
          userId,
          planId: plan.id,
          status: MembershipStatus.ACTIVE,
          expiresAt,
        },
        include: {
          plan: true,
        },
      });

      const payment = await tx.payment.create({
        data: {
          userId,
          amount: plan.price,
          status: PaymentStatus.COMPLETED,
          method: 'CREDIT_CARD',
          gatewayTxId: `tx_${randomUUID()}`,
          description: `Suscripción a ${plan.name}`,
          membershipId: membership.id,
          paidAt: new Date(),
        },
      });

      const invoiceAmount = Number(plan.price);
      const taxAmount = invoiceAmount * 0.19; // 19% IVA simulated
      const totalAmount = invoiceAmount + taxAmount;

      await tx.invoice.create({
        data: {
          paymentId: payment.id,
          userId,
          gymId: plan.gymId,
          invoiceNum: `INV-${Date.now().toString().slice(-6)}`,
          amount: invoiceAmount,
          tax: taxAmount,
          total: totalAmount,
          status: InvoiceStatus.ISSUED,
          pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', // Mock PDF
        },
      });

      return membership;
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
      const taxAmount = invoiceAmount * 0.19; // misma lógica que ya tenías
      await tx.invoice.create({
        data: {
          paymentId: payment.id,
          userId: payment.userId,
          gymId: plan.gymId,
          invoiceNum: `INV-${Date.now().toString().slice(-6)}`,
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
