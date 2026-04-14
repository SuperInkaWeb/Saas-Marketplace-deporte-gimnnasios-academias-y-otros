import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfessionalDto, UpdateProfessionalDto } from './dto/professional.dto';

@Injectable()
export class ProfessionalsService {
  constructor(private prisma: PrismaService) {}

  async create(providerId: string, createDto: CreateProfessionalDto) {
    return this.prisma.professionalService.create({
      data: {
        ...createDto,
        providerId,
      },
    });
  }

  async findAll() {
    return this.prisma.professionalService.findMany({
      where: { isActive: true },
      include: {
        provider: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
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
    return service;
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

  async bookService(userId: string, serviceId: string, notes?: string) {
    const service = await this.findOne(serviceId);
    return this.prisma.professionalBooking.create({
      data: {
        userId,
        serviceId,
        notes,
        status: 'CONFIRMED', // Para la demo asumo confirmación inmediata
      },
      include: {
        service: true,
      },
    });
  }

  async getMyBookings(userId: string) {
    return this.prisma.professionalBooking.findMany({
      where: { userId },
      include: {
        service: {
          include: { provider: true }
        }
      },
      orderBy: { bookedAt: 'desc' },
    });
  }
}
