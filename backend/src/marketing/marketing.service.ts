import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CampaignType, CampaignStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../notifications/email.service';
import { CreateCampaignDto } from './dto/campaign.dto';

// AUD-22: tope de campañas por gimnasio en 24 horas, para que el envío no sirva como canal de spam.
const MAX_CAMPAIGNS_PER_DAY = Number(process.env.MARKETING_MAX_CAMPAIGNS_PER_DAY) || 10;

@Injectable()
export class MarketingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService
  ) {}

  async createCampaign(gymId: string, data: CreateCampaignDto) {
    const sentLastDay = await this.prisma.marketingCampaign.count({
      where: { gymId, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    });
    if (sentLastDay >= MAX_CAMPAIGNS_PER_DAY) {
      throw new HttpException(
        `Se alcanzó el límite de ${MAX_CAMPAIGNS_PER_DAY} campañas en 24 horas para este gimnasio`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    let sentCount = 0;
    
    // Obtener los destinatarios reales
    let recipients: string[] = [];
    let usersToNotify: any[] = [];
    
    // Miembros del gimnasio: membresía activa o reserva confirmada/asistida.
    const isGymMember = {
      OR: [
        {
          userMemberships: { some: { plan: { gymId }, status: 'ACTIVE' as const } }
        },
        {
          reservations: { some: { class: { gymId }, status: { in: ['CONFIRMED' as const, 'ATTENDED' as const] } } }
        }
      ]
    };

    if (data.sendToAll) {
      const members = await this.prisma.user.findMany({
        where: isGymMember,
        select: { id: true, email: true }
      });
      recipients = members.map(m => m.email);
      usersToNotify = members;
    } else if (data.toEmail) {
      // AUD-22: solo se envía a miembros del gimnasio, nunca a un correo cualquiera.
      const member = await this.prisma.user.findFirst({
        where: {
          email: { equals: String(data.toEmail).trim(), mode: 'insensitive' },
          ...isGymMember,
        },
        select: { id: true, email: true }
      });
      if (!member) {
        throw new BadRequestException('El destinatario debe ser miembro de este gimnasio');
      }
      recipients = [member.email];
      usersToNotify = [member];
    }

    if (recipients.length > 0 && (!data.type || data.type === 'EMAIL')) {
      try {
        // Enviar con Resend real (Production Ready)
        const sendPromises = recipients.map(recipient => 
          this.emailService.sendMarketingCampaign(recipient, {
            name: recipient,
            subject: data.subject,
            headline: data.subject || '¡Tenemos novedades para ti!',
            body: data.content,
            ctaText: 'Ir a la Plataforma',
            ctaUrl: process.env.FRONTEND_URL || 'https://hercix.com'
          }).then(() => sentCount++)
            .catch(err => console.error("Error en campaña individual", err))
        );
        
        await Promise.all(sendPromises);

        // Notificación Real en la Plataforma
        for (const user of usersToNotify) {
          await this.notificationsService.create(user.id, {
            title: data.title || data.subject,
            description: `Nueva comunicación: ${data.subject}`,
            type: 'CAMPAIGN'
          });
        }
      } catch (error) {
        console.error('Error enviando campaña masiva:', error);
      }
    }

    const campaign = await this.prisma.marketingCampaign.create({
      data: {
        gymId,
        title: data.title || data.subject,
        subject: data.subject,
        content: data.content,
        type: data.type || CampaignType.EMAIL,
        status: CampaignStatus.SENT,
        sentCount: sentCount,
        scheduledAt: new Date(),
      },
    });
    return campaign;
  }

  async getCampaigns(gymId: string) {
    return this.prisma.marketingCampaign.findMany({
      where: { gymId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllCampaigns() {
    return this.prisma.marketingCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        gym: {
          select: {
            name: true,
          },
        },
      },
    });
  }
}
