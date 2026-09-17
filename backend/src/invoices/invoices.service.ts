import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserInvoices(userId: string) {
    return this.prisma.invoice.findMany({
      where: { userId },
      orderBy: { issuedAt: 'desc' },
      include: { gym: { select: { name: true } } },
    });
  }

  async getGymInvoices(gymId: string) {
    return this.prisma.invoice.findMany({
      where: { gymId },
      orderBy: { issuedAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    });
  }

  async getAllInvoices() {
    return this.prisma.invoice.findMany({
      orderBy: { issuedAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        gym: { select: { name: true } },
      },
    });
  }

  async getInvoiceById(id: string, requesterId: string, requesterRole: UserRole) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        gym: { select: { name: true, phone: true, address: true, ownerId: true } },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Factura no encontrada');
    }

    const isAdmin = requesterRole === UserRole.ADMIN;
    const isInvoiceOwner = invoice.userId === requesterId;
    const isGymOwner = invoice.gym?.ownerId === requesterId;

    if (!isAdmin && !isInvoiceOwner && !isGymOwner) {
      throw new ForbiddenException('No tienes permiso para ver esta factura');
    }

    const { gym, ...invoiceData } = invoice;
    return {
      ...invoiceData,
      gym: gym ? { name: gym.name, phone: gym.phone, address: gym.address } : null,
    };
  }
}
