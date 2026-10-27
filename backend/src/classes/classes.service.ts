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
import { GymAccessService, AuthUser } from '../common/gym-access/gym-access.service';
import { AuditService } from '../common/audit/audit.service';

@Injectable()
export class ClassesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private healthService: HealthService,
    private gymAccess: GymAccessService,
    private audit: AuditService,
  ) {}

  async create(gymId: string, actor: AuthUser, dto: CreateClassDto) {
    // ADMIN global → cualquier gimnasio; dueño → el suyo; entrenador → si está vinculado y tiene canCreateClasses
    const { gym, scope } = await this.gymAccess.assertCanManageGym(actor, gymId, {
      trainerAccess: 'canCreateClasses',
    });

    // Vínculo del usuario actual con el staff de ESTE gimnasio (si lo tiene)
    const own = gym.gymTrainers.find((gt) => gt.trainer.userId === actor.id);

    let finalTrainerId = dto.trainerId ? dto.trainerId : null;

    if (scope === 'TRAINER') {
      // Un entrenador solo crea clases a su nombre
      if (finalTrainerId && finalTrainerId !== own?.trainerId) {
        throw new ForbiddenException('Un entrenador solo puede crear clases asignadas a sí mismo');
      }
      finalTrainerId = own?.trainerId ?? null;
    } else if (!finalTrainerId && scope === 'OWNER' && own) {
      // Dueño que además es entrenador vinculado: se auto-asigna (comportamiento previo)
      finalTrainerId = own.trainerId;
    }
    // ADMIN global: no se auto-asigna; la clase queda sin entrenador salvo que lo indique

    if (finalTrainerId && !gym.gymTrainers.some((gt) => gt.trainerId === finalTrainerId)) {
      throw new ForbiddenException('El entrenador seleccionado no pertenece al staff de este gimnasio');
    }

    const created = await this.prisma.class.create({
      data: {
        ...dto,
        trainerId: finalTrainerId,
        gymId,
        scheduledAt: new Date(dto.scheduledAt),
      },
    });

    await this.audit.logGlobalAction(scope, actor, {
      action: 'CLASS_CREATE',
      entity: 'Class',
      entityId: created.id,
      gymId,
      metadata: { title: created.title },
    });

    return created;
  }

  async findAll(
    gymId?: string,
    userId?: string,
    ownerId?: string,
    trainerUserId?: string,
    includeInactive = false,
    viewer?: { id: string; canSeeAttendees: boolean },
  ) {
    // AUD-07: la lista de asistentes (nombre, DNI) solo la ve el staff, y nunca el email.
    // El resto solo recibe su propia reserva, para saber si ya reservó.
    const activeStatuses = { in: [ReservationStatus.CONFIRMED, ReservationStatus.ATTENDED] };
    const reservationsInclude = viewer?.canSeeAttendees
      ? {
          where: { status: activeStatuses },
          select: { id: true, userId: true, status: true, user: { select: { id: true, name: true, role: true, dni: true, avatarUrl: true } } },
        }
      : {
          where: { status: activeStatuses, userId: viewer?.id ?? '' },
          select: { id: true, userId: true, status: true },
        };

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
          reservations: reservationsInclude,
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
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        gym: { select: { name: true, city: true, ownerId: true } },
        trainer: {
          include: {
            user: { select: { name: true, avatarUrl: true } },
          },
        },
        reservations: reservationsInclude,
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
        // AUD-07: endpoint público, solo el conteo de reservas (sin datos de atletas)
        _count: { select: { reservations: { where: { status: ReservationStatus.CONFIRMED } } } },
      },
    });

    if (!classItem) throw new NotFoundException('Clase no encontrada');
    return classItem;
  }

  async book(userId: string, classId: string) {
    const classItem = await this.prisma.class.findUnique({
      where: { id: classId },
      select: { price: true },
    });

    if (!classItem) throw new NotFoundException('Clase no encontrada');
    if (Number(classItem.price) > 0) {throw new BadRequestException('Esta clase requiere pago');}

    // El flujo ahora usará Pay-per-class, por lo que no exigimos membresía activa aquí.

    // AUD-21: mismo cupo con bloqueo que el flujo pagado; sin él, dos reservas
    // simultáneas leían el mismo conteo y la clase quedaba sobrerreservada.
    const reservation = await this.prisma.$transaction((tx) =>
      this.reservePaidSeat(tx, userId, classId),
    );
    if (!reservation) {
      throw new BadRequestException('Ya tienes una reserva para esta clase');
    }

    await this.notifyNewReservation(reservation);

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
    if (cls.scheduledAt <= new Date()) {
     throw new ConflictException('La clase ya comenzó o ya pasó');
   }
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
    if (reservation.status !== ReservationStatus.CONFIRMED) {
      throw new BadRequestException('Solo se puede cancelar una reserva confirmada');
    }

    return this.prisma.reservation.update({
      where: { id: reservation.id },
      data: {
        status: ReservationStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });
  }

  /**
   * Carga la reserva y verifica que el actor pueda gestionar el gimnasio de su clase.
   * ADMIN global → siempre; dueño → su gimnasio; entrenador → si está vinculado al gimnasio.
   */
  private async getReservationForStaff(reservationId: string, actor: AuthUser) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { class: true },
    });
    if (!reservation) throw new NotFoundException('Ticket / Reserva no encontrada');

    const { scope } = await this.gymAccess.assertCanManageGym(actor, reservation.class.gymId, {
      trainerAccess: 'linked',
    });
    return { reservation, scope };
  }

  async markAttendance(reservationId: string, actor: AuthUser) {
    const { reservation, scope } = await this.getReservationForStaff(reservationId, actor);

    // AUD-21: una reserva cancelada no tiene asistencia, y marcarla dos veces sumaba
    // las calorías de la clase otra vez.
    if (reservation.status === ReservationStatus.ATTENDED) return reservation;
    if (reservation.status === ReservationStatus.CANCELLED) {
      throw new BadRequestException('No se puede marcar asistencia en una reserva cancelada');
    }

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

    const updated = await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { status: ReservationStatus.ATTENDED },
    });

    await this.audit.logGlobalAction(scope, actor, {
      action: 'RESERVATION_ATTEND',
      entity: 'Reservation',
      entityId: reservationId,
      gymId: reservation.class.gymId,
    });

    return updated;
  }

  async unmarkAttendance(reservationId: string, actor: AuthUser) {
    const { reservation, scope } = await this.getReservationForStaff(reservationId, actor);

    // AUD-21: solo se deshace una asistencia; volver a CONFIRMED una reserva cancelada
    // ocupaba un cupo sin pasar por el control de capacidad.
    if (reservation.status !== ReservationStatus.ATTENDED) {
      throw new BadRequestException('Esta reserva no tiene asistencia marcada');
    }

    const updated = await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { status: ReservationStatus.CONFIRMED },
    });

    await this.audit.logGlobalAction(scope, actor, {
      action: 'RESERVATION_UNATTEND',
      entity: 'Reservation',
      entityId: reservationId,
      gymId: reservation.class.gymId,
    });

    return updated;
  }

  async removeReservation(reservationId: string, actor: AuthUser) {
    const { reservation, scope } = await this.getReservationForStaff(reservationId, actor);

    const deleted = await this.prisma.reservation.delete({
      where: { id: reservationId },
    });

    await this.audit.logGlobalAction(scope, actor, {
      action: 'RESERVATION_REMOVE',
      entity: 'Reservation',
      entityId: reservationId,
      gymId: reservation.class.gymId,
    });

    return deleted;
  }

  async update(id: string, actor: AuthUser, dto: UpdateClassDto) {
    const cls = await this.prisma.class.findUnique({
      where: { id },
      select: {
        id: true,
        gymId: true,
        trainerId: true,
        trainer: { select: { userId: true } },
      },
    });
    if (!cls) throw new NotFoundException('Clase no encontrada');

    const { gym, scope } = await this.gymAccess.assertCanManageGym(actor, cls.gymId, {
      trainerAccess: 'canCreateClasses',
    });

    // Un entrenador solo edita SUS clases y no puede reasignarlas a otro entrenador
    if (scope === 'TRAINER') {
      if (cls.trainer?.userId !== actor.id) {
        throw new ForbiddenException('Solo puedes editar las clases que tienes asignadas');
      }
      if (dto.trainerId !== undefined && dto.trainerId !== (cls.trainerId ?? '')) {
        throw new ForbiddenException('Un entrenador no puede reasignar la clase a otro entrenador');
      }
    }

    let finalTrainerId: string | null | undefined = dto.trainerId;
    if (dto.trainerId === '') {
      finalTrainerId = null;
    } else if (dto.trainerId && !gym.gymTrainers.some((gt) => gt.trainerId === dto.trainerId)) {
      throw new ForbiddenException('El entrenador seleccionado no pertenece al staff de este gimnasio');
    }

    const updated = await this.prisma.class.update({
      where: { id },
      data: {
        ...dto,
        trainerId: finalTrainerId,
        ...(dto.scheduledAt && { scheduledAt: new Date(dto.scheduledAt) }),
      },
    });

    await this.audit.logGlobalAction(scope, actor, {
      action: dto.isActive !== undefined ? 'CLASS_SET_ACTIVE' : 'CLASS_UPDATE',
      entity: 'Class',
      entityId: id,
      gymId: cls.gymId,
      metadata: { changes: Object.keys(dto) },
    });

    return updated;
  }

  async remove(id: string, actor: AuthUser) {
    const cls = await this.prisma.class.findUnique({
      where: { id },
      select: { id: true, gymId: true, title: true },
    });
    if (!cls) throw new NotFoundException('Clase no encontrada');

    // Eliminar sigue siendo solo dueño y ADMIN global (borra en cascada las reservas)
    const { scope } = await this.gymAccess.assertCanManageGym(actor, cls.gymId);

    const deleted = await this.prisma.class.delete({ where: { id } });

    await this.audit.logGlobalAction(scope, actor, {
      action: 'CLASS_DELETE',
      entity: 'Class',
      entityId: id,
      gymId: cls.gymId,
      metadata: { title: cls.title },
    });

    return deleted;
  }
}