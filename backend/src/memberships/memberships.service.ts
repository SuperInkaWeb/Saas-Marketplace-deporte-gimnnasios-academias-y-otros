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
import { MembershipStatus } from '@prisma/client';

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

    // 2. Calculate expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + plan.durationDays);

    // 3. Create membership (and ideally a payment record, but skipping complex payment for now)
    return this.prisma.userMembership.create({
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
}
