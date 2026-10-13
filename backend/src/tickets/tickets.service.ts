import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto, ReplyTicketDto } from './dto/ticket.dto';
import { TicketStatus } from '@prisma/client';

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Usuario crea un ticket de queja */
  async create(userId: string, dto: CreateTicketDto) {
    return this.prisma.supportTicket.create({
      data: {
        userId,
        subject: dto.subject,
        description: dto.description,
        category: dto.category ?? 'GENERAL',
        gymId: dto.gymId ?? null,
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });
  }

  /** Admin ve todos los tickets de la plataforma */
  async findAll(status?: TicketStatus) {
    return this.prisma.supportTicket.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true, role: true } },
      },
    });
  }

  /** Usuario ve sus propios tickets */
  async findMine(userId: string) {
    return this.prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Admin responde un ticket */
  async reply(ticketId: string, dto: ReplyTicketDto) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');

    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        adminReply: dto.adminReply,
        repliedAt: new Date(),
        status: TicketStatus.IN_REVIEW,
      },
    });
  }

  /** Admin cambia el estado del ticket */
  async updateStatus(ticketId: string, status: TicketStatus) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');

    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status },
    });
  }

  /** Admin elimina un ticket */
  async remove(ticketId: string) {
    return this.prisma.supportTicket.delete({ where: { id: ticketId } });
  }

  /** Estadísticas rápidas para el dashboard */
  async getStats() {
    const [open, inReview, resolved, closed, total] = await Promise.all([
      this.prisma.supportTicket.count({ where: { status: 'OPEN' } }),
      this.prisma.supportTicket.count({ where: { status: 'IN_REVIEW' } }),
      this.prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
      this.prisma.supportTicket.count({ where: { status: 'CLOSED' } }),
      this.prisma.supportTicket.count(),
    ]);
    return { open, inReview, resolved, closed, total };
  }
}
