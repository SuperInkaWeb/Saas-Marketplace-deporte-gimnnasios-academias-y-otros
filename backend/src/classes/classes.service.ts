import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { Prisma, ReservationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service'; 
import { CreateClassDto, UpdateClassDto } from './dto/class.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { HealthService } from '../health/health.service';

@Injectable()
export class ClassesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private healthService: HealthService
  ) {}

  async create(gymId: string, currentUserId: string, dto: CreateClassDto) {
    // 1. Verify gym and permissions
    const gym = await this.prisma.gym.findUnique({
      where: { id: gymId },
      include: { gymTrainers: true },
    });

    if (!gym) throw new NotFoundException('Gimnasio no encontrado');

    // Buscar si el usuario actual es entrenador y tiene perfil
    const trainerProfile = await this.prisma.trainerProfile.findUnique({
      where: { userId: currentUserId },
    });

    let finalTrainerId = dto.trainerId && dto.trainerId !== "" ? dto.trainerId : null;
    // Si el creador es un entrenador, se auto-asigna
    if (!finalTrainerId && trainerProfile) {
      finalTrainerId = trainerProfile.id;
    }

    const isOwner = gym.ownerId === currentUserId;
    const isTrainer = trainerProfile && gym.gymTrainers.some(
      (gt) => gt.trainerId === trainerProfile.id && gt.canCreateClasses,
    );

    // Si el creador es el dueño y especificó un entrenador, validar que el entrenador esté vinculado a este gimnasio
    if (isOwner && finalTrainerId) {
      const isTrainerLinked = gym.gymTrainers.some(
        (gt) => gt.trainerId === finalTrainerId,
      );
      if (!isTrainerLinked) {
        throw new ForbiddenException('El entrenador seleccionado no pertenece al staff de este gimnasio');
      }
    }

    // Si no es el dueño ni un entrenador autorizado, denegar
    if (!isOwner && !isTrainer) {
      throw new ForbiddenException('No tienes permiso para crear clases en este gimnasio');
    }

    return this.prisma.class.create({
      data: {
        ...dto,
        trainerId: finalTrainerId,
        gymId,
        scheduledAt: new Date(dto.scheduledAt),
      },
    });
  }

  async findAll(gymId?: string, userId?: string, ownerId?: string, trainerUserId?: string) {
    // If userId passed, return only classes where this user has a reservation
    if (userId) {
      const reservations = await this.prisma.reservation.findMany({
        where: { userId, status: { in: [ReservationStatus.CONFIRMED, ReservationStatus.ATTENDED] } },
        select: { classId: true },
      });
      const classIds = reservations.map(r => r.classId);
      if (classIds.length === 0) return [];
      return this.prisma.class.findMany({
        where: { id: { in: classIds }, isActive: true },
        include: {
          gym: { select: { name: true, city: true, ownerId: true } },
          trainer: { include: { user: { select: { name: true, avatarUrl: true } } } },
          reservations: {
            where: { status: { in: [ReservationStatus.CONFIRMED, ReservationStatus.ATTENDED] } },
            select: { id: true, userId: true, status: true, user: { select: { id: true, name: true, role: true, dni: true, email: true, avatarUrl: true } } }
          },
          _count: { select: { reservations: { where: { status: ReservationStatus.CONFIRMED } } } },
        },
        orderBy: { scheduledAt: 'asc' },
      });
    }

    return this.prisma.class.findMany({
      where: {
        ...(gymId ? { gymId } : {}),
        ...(ownerId ? { gym: { ownerId } } : {}),
        ...(trainerUserId ? { trainer: { userId: trainerUserId } } : {}),
        isActive: true,
      },
      include: {
        gym: { select: { name: true, city: true, ownerId: true } },
        trainer: {
          include: {
            user: { select: { name: true, avatarUrl: true } },
          },
        },
        reservations: {
          where: { status: { in: [ReservationStatus.CONFIRMED, ReservationStatus.ATTENDED] } },
          select: { id: true, userId: true, status: true, user: { select: { id: true, name: true, role: true, dni: true, email: true, avatarUrl: true } } }
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
            user: { select: { id: true, name: true, role: true, dni: true, email: true, avatarUrl: true } },
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
    if (Number(classItem.price) > 0) {throw new BadRequestException('Esta clase requiere pago');}
    if (classItem._count.reservations >= classItem.capacity) {
      throw new BadRequestException('La clase está llena');
    }

    // El flujo ahora usará Pay-per-class, por lo que no exigimos membresía activa aquí.

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
    const reservation = await this.prisma.reservation.upsert({
      where: {
        classId_userId: { classId, userId },
      },
      update: { status: ReservationStatus.CONFIRMED, bookedAt: new Date() },
      create: {
        classId,
        userId,
        status: ReservationStatus.CONFIRMED,
      },
      include: {
        user: { select: { name: true } },
        class: { include: { gym: true } }
      }
    });

    // 4. Notify Gym Owner
    if (reservation.class.gym?.ownerId) {
      await this.notificationsService.create(reservation.class.gym.ownerId, {
        title: 'Nueva Reserva de Clase',
        description: `${reservation.user.name} ha reservado la clase: ${reservation.class.title}`,
        type: 'RESERVATION'
      });
    }

    return reservation;
  }

    async reservePaidSeat(tx: Prisma.TransactionClient, userId: string, classId: string) {
    await tx.$queryRaw`SELECT id FROM classes WHERE id = ${classId} FOR UPDATE`;

    const cls = await tx.class.findUnique({
      where: { id: classId },
      include: {
        _count: {
          select: { reservations: { where: { status: ReservationStatus.CONFIRMED } } },
        },
      },
    });
    if (!cls || !cls.isActive) throw new BadRequestException('Clase no disponible');

    const existing = await tx.reservation.findUnique({
      where: { classId_userId: { classId, userId } },
    });
    if (existing?.status === ReservationStatus.CONFIRMED) return null;

    if (cls._count.reservations >= cls.capacity) {
      throw new ConflictException('La clase se llenó');
    }

    return tx.reservation.upsert({
      where: { classId_userId: { classId, userId } },
      update: { status: ReservationStatus.CONFIRMED, bookedAt: new Date(), cancelledAt: null },
      create: { classId, userId, status: ReservationStatus.CONFIRMED },
      include: {
        user: { select: { name: true } },
        class: { include: { gym: true } },
      },
    });
  }

  async notifyNewReservation(r: {
    user: { name: string };
    class: { title: string; gym?: { ownerId: string } | null };
  }) {
    const ownerId = r.class.gym?.ownerId;
    if (!ownerId) return;
    try {
      await this.notificationsService.create(ownerId, {
        title: 'Nueva Reserva de Clase',
        description: `${r.user.name} ha reservado la clase: ${r.class.title}`,
        type: 'RESERVATION',
      });
    } catch (err) {
      console.error('Error notificando reserva:', err);
    }
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
      include: { class: true }
    });

    if (!reservation) throw new NotFoundException('Ticket / Reserva no encontrada');

    // Trigger automatic calorie calculation
    try {
      await this.healthService.calculateCaloriesFromClass(
        reservation.userId,
        reservation.class.title,
        reservation.class.durationMin
      );
    } catch (err) {
      console.error('Error calculating calories:', err);
    }

    return this.prisma.reservation.update({
      where: { id: reservationId },
      data: { status: ReservationStatus.ATTENDED },
    });
  }

  async unmarkAttendance(reservationId: string, currentUserId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
    });
    if (!reservation) throw new NotFoundException('Reserva no encontrada');

    return this.prisma.reservation.update({
      where: { id: reservationId },
      data: { status: ReservationStatus.CONFIRMED },
    });
  }

  async removeReservation(reservationId: string, currentUserId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
    });
    if (!reservation) throw new NotFoundException('Reserva no encontrada');

    return this.prisma.reservation.delete({
      where: { id: reservationId },
    });
  }
  async update(id: string, currentUserId: string, dto: UpdateClassDto) {
    const classItem = await this.findOne(id);
    if (classItem.gym.ownerId !== currentUserId) {
        throw new ForbiddenException('No tienes permiso para actualizar esta clase');
    }

    let finalTrainerId: string | null | undefined = dto.trainerId;
    if (dto.trainerId === "") {
      finalTrainerId = null;
    } else if (dto.trainerId) {
      const gym = await this.prisma.gym.findUnique({
        where: { id: classItem.gymId },
        include: { gymTrainers: true },
      });
      if (gym) {
        const isTrainerLinked = gym.gymTrainers.some(
          (gt) => gt.trainerId === dto.trainerId,
        );
        if (!isTrainerLinked) {
          throw new ForbiddenException('El entrenador seleccionado no pertenece al staff de este gimnasio');
        }
      }
    }

    return this.prisma.class.update({
      where: { id },
      data: {
        ...dto,
        trainerId: finalTrainerId,
        ...(dto.scheduledAt && { scheduledAt: new Date(dto.scheduledAt) })
      }
    });
  }

  async remove(id: string, currentUserId: string) {
    const classItem = await this.findOne(id);
    if (classItem.gym.ownerId !== currentUserId) {
        throw new ForbiddenException('No tienes permiso para eliminar esta clase');
    }
    return this.prisma.class.delete({
       where: { id }
    });
  }
}
