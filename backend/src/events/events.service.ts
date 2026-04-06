import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async create(organizerId: string, createDto: CreateEventDto) {
    return this.prisma.event.create({
      data: {
        ...createDto,
        date: new Date(createDto.date),
        organizerId,
      },
    });
  }

  async findAll() {
    return this.prisma.event.findMany({
      where: { isActive: true },
      include: {
        organizer: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        organizer: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });
    if (!event) throw new NotFoundException('Evento no encontrado');
    return event;
  }

  async update(id: string, currentUserId: string, updateDto: UpdateEventDto, isAdmin: boolean) {
    const event = await this.findOne(id);
    if (!isAdmin && event.organizerId !== currentUserId) {
      throw new ForbiddenException('No tienes permiso para actualizar este evento');
    }
    const updateData: any = { ...updateDto };
    if (updateDto.date) updateData.date = new Date(updateDto.date);
    
    return this.prisma.event.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    return this.prisma.event.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
