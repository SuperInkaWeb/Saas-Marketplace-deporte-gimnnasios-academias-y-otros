  import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
  import { PaymentStatus, Prisma } from '@prisma/client';
  import { PrismaService } from '../prisma/prisma.service'; 
  import {
    BOOKING_STATUS,
    BookingStatus,
    CreateProfessionalDto,
    UpdateProfessionalDto,
  } from './dto/professional.dto';
  import { NotificationsService } from '../notifications/notifications.service';
  import { ConflictException } from '@nestjs/common';
import { withPublicName } from '../common/utils/normalize-name';

// AUD-08: nunca devolver la fila User completa (passwordHash, dni, auth0Id) en las reservas.
// Lo que el atleta ve del profesional:
const PROVIDER_PUBLIC_SELECT = {
  id: true,
  name: true,
  avatarUrl: true,
} as const;
// Lo que el profesional ve del cliente (igual que getProviderBookings):
const BOOKING_CLIENT_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
} as const;
// Lo que el atleta recibe de sí mismo al reservar:
const BOOKING_SELF_SELECT = { id: true, name: true } as const;
const PROVIDER_LABEL = 'Profesional';

// AUD-28: transiciones válidas de una reserva. COMPLETED y CANCELLED son finales.
const BOOKING_TRANSITIONS: Record<string, readonly BookingStatus[]> = {
  [BOOKING_STATUS.PENDING]: [
    BOOKING_STATUS.CONFIRMED,
    BOOKING_STATUS.CANCELLED,
  ],
  [BOOKING_STATUS.CONFIRMED]: [
    BOOKING_STATUS.COMPLETED,
    BOOKING_STATUS.CANCELLED,
  ],
};
const BOOKING_STATUS_TEXT: Record<BookingStatus, string> = {
  PENDING: 'pendiente',
  CONFIRMED: 'confirmada',
  COMPLETED: 'completada',
  CANCELLED: 'cancelada',
};


  @Injectable()
  export class ProfessionalsService {
    constructor(
      private prisma: PrismaService,
      private notificationsService: NotificationsService
    ) {}

  async create(providerId: string, createDto: CreateProfessionalDto) {
    return this.prisma.professionalService.create({
      data: {
        ...createDto,
        providerId,
      },
    });
  }

  async findAll() {
    const services = await this.prisma.professionalService.findMany({
      where: { isActive: true },
      include: {
        // AUD-27: catálogo público, sin el email personal del profesional.
        provider: { select: PROVIDER_PUBLIC_SELECT },
      },
      orderBy: { createdAt: 'desc' },
    });
    // AUD-27: cuentas antiguas con el email guardado como nombre.
    return services.map((s) => ({
      ...s,
      provider: withPublicName(s.provider, PROVIDER_LABEL)!,
    }));
  }

  async findOne(id: string) {
    const service = await this.prisma.professionalService.findUnique({
      where: { id },
      include: {
        provider: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });
    if (!service) throw new NotFoundException('Servicio no encontrado');
    return {
      ...service,
      provider: withPublicName(service.provider, PROVIDER_LABEL)!,
    };
  }
  
  

  async update(id: string, currentUserId: string, updateDto: UpdateProfessionalDto, isAdmin: boolean) {
    const service = await this.findOne(id);
    if (!isAdmin && service.providerId !== currentUserId) {
      throw new ForbiddenException('No tienes permiso para actualizar este servicio');
    }
    return this.prisma.professionalService.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string, currentUserId: string, isAdmin: boolean) {
    const service = await this.findOne(id);
    if (!isAdmin && service.providerId !== currentUserId) {
        throw new ForbiddenException('No tienes permiso para eliminar este servicio');
    }
    return this.prisma.professionalService.update({
      where: { id },
      data: { isActive: false },
    });
  }

    async createPaidBooking(
    tx: Prisma.TransactionClient,
    userId: string,
    serviceId: string,
    notes?: string | null,
  ) {
    const service = await tx.professionalService.findUnique({ where: { id: serviceId } });
    if (!service || !service.isActive) throw new BadRequestException('Servicio no disponible');

    return tx.professionalBooking.create({
      data: { userId, serviceId, notes: notes ?? undefined, status: 'PENDING' },
      include: {
        service: { include: { provider: { select: PROVIDER_PUBLIC_SELECT } } },
        user: { select: BOOKING_SELF_SELECT },
      },
    });
  }

  async notifyBookingCreated(booking: {
    userId: string;
    user?: { name: string } | null;
    service: { title: string; providerId: string };
  }) {
    try {
      await this.notificationsService.create(booking.service.providerId, {
        title: 'Nueva Reserva Pagada',
        description: `${booking.user?.name || 'Un atleta'} reservó y pagó tu servicio: ${booking.service.title}. Confírmala.`,
        type: 'RESERVATION',
      });
      await this.notificationsService.create(booking.userId, {
        title: 'Pago recibido',
        description: `Pagaste el servicio: ${booking.service.title}. Espera la confirmación del profesional.`,
        type: 'RESERVATION',
      });
    } catch (err) {
      console.error('Error notificando cita:', err);
    }
  }

  async bookService(userId: string, serviceId: string, notes?: string) {
    const service = await this.findOne(serviceId);
    // AUD-28: los mismos controles que el checkout; esta vía (POST /professionals/:id/book) no los tenía.
    if (!service.isActive) {
      throw new BadRequestException('Servicio no disponible');
    }
    if (service.providerId === userId) {
      throw new BadRequestException('No puedes reservar tu propio servicio');
    }
    if (Number(service.price) > 0) {
      throw new BadRequestException('Este servicio requiere pago con Mercado Pago');
    }
    const booking = await this.prisma.professionalBooking.create({
      data: {
        userId,
        serviceId,
        notes,
        status: 'PENDING',
      },
      include: {
        service: {
          include: { provider: { select: PROVIDER_PUBLIC_SELECT } }
        },
        user: { select: BOOKING_SELF_SELECT },
      },
    });

    // Notify the provider
    try {
      await this.notificationsService.create(service.providerId, {
        title: 'Nueva Reserva Pendiente',
        description: `${booking.user?.name || 'Un atleta'} ha solicitado reservar tu servicio: ${service.title}`,
        type: 'RESERVATION',
      });
    } catch (err) {
      console.error('Error creating booking notification for provider:', err);
    }

    // Notify the client (athlete)
    try {
      await this.notificationsService.create(userId, {
        title: 'Reserva Solicitada',
        description: `Has solicitado reservar el servicio: ${service.title}. Espera la confirmación.`,
        type: 'RESERVATION',
      });
    } catch (err) {
      console.error('Error creating booking notification for client:', err);
    }

    return booking;
  }

  async getMyBookings(userId: string) {
    const bookings = await this.prisma.professionalBooking.findMany({
      where: { userId },
      include: {
        service: {
          include: { provider: { select: PROVIDER_PUBLIC_SELECT } }
        }
      },
      orderBy: { bookedAt: 'desc' },
    });
    const paid = await this.paidServiceIds(userId);
    // AUD-28: el frontend muestra "Cancelar" solo si el atleta puede hacerlo.
    return bookings.map((b) => ({
      ...b,
      canCancel: b.status === BOOKING_STATUS.PENDING && !paid.has(b.serviceId),
    }));
  }

  /**
   * AUD-28: el atleta puede cancelar su propia reserva solo si está PENDING y no la pagó.
   * Las pagadas las cancela el profesional hasta que se defina la política de reembolsos (AUD-09).
   */
  async cancelOwnBooking(bookingId: string, userId: string) {
    const booking = await this.prisma.professionalBooking.findUnique({
      where: { id: bookingId },
      include: { service: { select: { title: true, providerId: true } } },
    });
    if (!booking || booking.userId !== userId) {
      throw new NotFoundException('Reserva no encontrada');
    }
    if (booking.status !== BOOKING_STATUS.PENDING) {
      throw new BadRequestException('Solo puedes cancelar una reserva pendiente');
    }
    if ((await this.paidServiceIds(userId)).has(booking.serviceId)) {
      throw new BadRequestException(
        'Esta reserva fue pagada: pide la cancelación al profesional',
      );
    }
    const changed = await this.prisma.professionalBooking.updateMany({
      where: { id: bookingId, status: BOOKING_STATUS.PENDING },
      data: { status: BOOKING_STATUS.CANCELLED },
    });
    if (changed.count === 0) {
      throw new ConflictException(
        'La reserva cambió mientras se actualizaba; vuelve a intentarlo',
      );
    }

    try {
      await this.notificationsService.create(booking.service.providerId, {
        title: 'Reserva Cancelada por el Cliente',
        description: `Un cliente canceló su reserva del servicio: ${booking.service.title}.`,
        type: 'RESERVATION',
      });
    } catch (err) {
      console.error('Error notificando cancelación al profesional:', err);
    }
    return { id: bookingId, status: BOOKING_STATUS.CANCELLED };
  }

  /** Servicios que el usuario pagó alguna vez (criterio conservador: si pagó, no cancela él). */
  private async paidServiceIds(userId: string): Promise<Set<string>> {
    const payments = await this.prisma.payment.findMany({
      where: { userId, status: PaymentStatus.COMPLETED, serviceId: { not: null } },
      select: { serviceId: true },
    });
    return new Set(payments.map((p) => p.serviceId as string));
  }

  async getProviderBookings(providerId: string) {
    return this.prisma.professionalBooking.findMany({
      where: {
        service: {
          providerId: providerId
        }
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true }
        },
        service: true
      },
      orderBy: { bookedAt: 'desc' },
    });
  }

  async updateBookingStatus(bookingId: string, providerId: string, status: BookingStatus, isAdmin: boolean) {
    const booking = await this.prisma.professionalBooking.findUnique({
      where: { id: bookingId },
      include: { service: true }
    });
    if (!booking) throw new NotFoundException('Reserva no encontrada');

    if (!isAdmin && booking.service.providerId !== providerId) {
      throw new ForbiddenException('No tienes permiso para actualizar esta reserva');
    }

    // AUD-28: solo transiciones válidas (COMPLETED y CANCELLED son finales).
    const allowed = BOOKING_TRANSITIONS[booking.status] ?? [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `No se puede pasar una reserva de ${booking.status} a ${status}`,
      );
    }
    // Solo se aplica si nadie la cambió entre la lectura y la escritura.
    const changed = await this.prisma.professionalBooking.updateMany({
      where: { id: bookingId, status: booking.status },
      data: { status },
    });
    if (changed.count === 0) {
      throw new ConflictException(
        'La reserva cambió mientras se actualizaba; vuelve a intentarlo',
      );
    }

    const updated = await this.prisma.professionalBooking.findUniqueOrThrow({
      where: { id: bookingId },
      include: {
        service: {
          include: { provider: { select: PROVIDER_PUBLIC_SELECT } }
        },
        user: { select: BOOKING_CLIENT_SELECT }
      }
    });

    // Notify the client about the status change
    try {
      const statusText = BOOKING_STATUS_TEXT[status];
      await this.notificationsService.create(updated.userId, {
        title: `Reserva de Servicio ${statusText.charAt(0).toUpperCase()}${statusText.slice(1)}`,
        description: `Tu reserva para el servicio: ${updated.service.title} con ${updated.service.provider.name} ha sido ${statusText}.`,
        type: 'RESERVATION',
      });
    } catch (err) {
      console.error('Error creating status update notification for client:', err);
    }

    return updated;
  }
}
