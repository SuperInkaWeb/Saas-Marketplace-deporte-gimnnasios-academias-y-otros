import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';
import { AuthUser, isGlobalAdmin } from '../common/gym-access/gym-access.service';

const ORGANIZER_INCLUDE = {
  organizer: {
    select: { id: true, name: true, avatarUrl: true },
  },
};

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async create(organizerId: string, createDto: CreateEventDto) {
    const date = new Date(createDto.date);
    // Un evento que nace en el pasado desaparecería de la lista al instante
    if (Number.isNaN(date.getTime()) || date <= new Date()) {
      throw new BadRequestException('La fecha del evento debe ser futura');
    }
    return this.prisma.event.create({
      data: {
        ...createDto,
        date,
        organizerId,
      },
    });
  }

  /**
   * Listado público: solo eventos activos que AÚN NO han comenzado.
   * No se borra nada: al pasar la hora de inicio simplemente dejan de listarse.
   */
  async findAll() {
    return this.prisma.event.findMany({
      where: { isActive: true, date: { gt: new Date() } },
      include: ORGANIZER_INCLUDE,
      orderBy: { date: 'asc' },
    });
  }

  /**
   * Listado de gestión (requiere sesión):
   *  - ADMIN global → todos los eventos, de cualquier organizador.
   *  - Dueño / entrenador → solo los que organizó él.
   * Con includePast=true también devuelve los que ya comenzaron.
   */
  async findManageable(actor: AuthUser, includePast = false) {
    return this.prisma.event.findMany({
      where: {
        isActive: true,
        ...(isGlobalAdmin(actor) ? {} : { organizerId: actor.id }),
        ...(includePast ? {} : { date: { gt: new Date() } }),
      },
      include: ORGANIZER_INCLUDE,
      orderBy: { date: 'asc' },
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: ORGANIZER_INCLUDE,
    });
    if (!event) throw new NotFoundException('Evento no encontrado');
    return event;
  }

  /** ADMIN global gestiona cualquier evento; los demás, solo los suyos. */
  private async getManageableEvent(id: string, actor: AuthUser, deniedMessage: string) {
    const event = await this.findOne(id);
    if (!isGlobalAdmin(actor) && event.organizerId !== actor.id) {
      throw new ForbiddenException(deniedMessage);
    }
    return event;
  }

  async update(id: string, actor: AuthUser, updateDto: UpdateEventDto) {
    await this.getManageableEvent(id, actor, 'No tienes permiso para actualizar este evento');

    const updateData: any = { ...updateDto };
    if (updateDto.date) updateData.date = new Date(updateDto.date);

    return this.prisma.event.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string, actor: AuthUser) {
    await this.getManageableEvent(id, actor, 'No tienes permiso para eliminar este evento');

    return this.prisma.event.update({
      where: { id },
      data: { isActive: false },
    });
  }
}