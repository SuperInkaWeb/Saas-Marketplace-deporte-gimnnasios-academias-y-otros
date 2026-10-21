import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, data: { title: string; description: string; type?: string }) {
    return this.prisma.notification.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        type: data.type || 'INFO',
      },
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  // AUD-23: solo el dueño puede marcar su notificación. Si es ajena responde 404,
  // igual que si no existiera, para no revelar IDs de otros usuarios.
  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!notification)
      throw new NotFoundException('Notificación no encontrada');

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
