import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClassDto, UpdateClassDto } from './dto/class.dto';
import { ReservationStatus } from '@prisma/client';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  async create(gymId: string, currentUserId: string, dto: CreateClassDto) {
    // 1. Verify gym and permissions
    const gym = await this.prisma.gym.findUnique({
      where: { id: gymId },
      include: { gymTrainers: true },
    });

    if (!gym) throw new NotFoundException('Gimnasio no encontrado');

    const isAdmin = false; // We can check role if needed, but assuming controller handles roles
    const isOwner = gym.ownerId === currentUserId;
    const isTrainer = gym.gymTrainers.some(
      (gt) => gt.trainerId === dto.trainerId && gt.canCreateClasses,
    );

    // If a trainer is specified but not the one creating it, we should check if current user is owner
    if (!isOwner && !isTrainer) {
      throw new ForbiddenException('No tienes permiso para crear clases en este gimnasio');
    }

    return this.prisma.class.create({
      data: {
        ...dto,
        gymId,
        scheduledAt: new Date(dto.scheduledAt),
      },
    });
  }

  async findAll(gymId?: string) {
    return this.prisma.class.findMany({
      where: {
        ...(gymId ? { gymId } : {}),
        isActive: true,
      },

      include: {
        gym: { select: { name: true, city: true } },
        trainer: {
          include: {
            user: { select: { name: true, avatarUrl: true } },
          },
        },
        reservations: {
          where: { status: { in: [ReservationStatus.CONFIRMED, ReservationStatus.ATTENDED] } },
          select: { id: true, userId: true, status: true, user: { select: { name: true } } }
        },
        _count: {
          select: { reservations: { where: { status: ReservationStatus.CONFIRMED } } },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const classItem = await this.prisma.class.findUnique({
      where: { id },
      include: {
        gym: true,
        trainer: {
          include: {
            user: { select: { name: true, avatarUrl: true } },
          },
        },

        reservations: {
          where: { status: ReservationStatus.CONFIRMED },
          include: {
            user: { select: { name: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!classItem) throw new NotFoundException('Clase no encontrada');
    return classItem;
  }

  async book(userId: string, classId: string) {
    // 1. Check class existence and capacity
    const classItem = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        _count: {
          select: {
            reservations: { where: { status: ReservationStatus.CONFIRMED } },
          },
        },
      },
    });

    if (!classItem) throw new NotFoundException('Clase no encontrada');
    if (!classItem.isActive) throw new BadRequestException('Esta clase no está activa');
    if (classItem._count.reservations >= classItem.capacity) {
      throw new BadRequestException('La clase está llena');
    }

    // 2. Check if already booked
    const existing = await this.prisma.reservation.findUnique({
      where: {
        classId_userId: { classId, userId },
      },
    });

    if (existing && existing.status === ReservationStatus.CONFIRMED) {
      throw new BadRequestException('Ya tienes una reserva para esta clase');
    }

    // 3. Create or update reservation
    return this.prisma.reservation.upsert({
      where: {
        classId_userId: { classId, userId },
      },
      update: { status: ReservationStatus.CONFIRMED, bookedAt: new Date() },
      create: {
        classId,
        userId,
        status: ReservationStatus.CONFIRMED,
      },
    });
  }

  async cancelBooking(userId: string, classId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: {
        classId_userId: { classId, userId },
      },
    });

    if (!reservation) throw new NotFoundException('Reserva no encontrada');

    return this.prisma.reservation.update({
      where: { id: reservation.id },
      data: {
        status: ReservationStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });
  }

  async markAttendance(reservationId: string, currentUserId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) throw new NotFoundException('Ticket / Reserva no encontrada');

    return this.prisma.reservation.update({
      where: { id: reservationId },
      data: { status: ReservationStatus.ATTENDED },
    });
  }
}
