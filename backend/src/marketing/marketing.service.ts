import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CampaignType, CampaignStatus } from '@prisma/client';
import * as nodemailer from 'nodemailer';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MarketingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService
  ) {}

  async createCampaign(gymId: string, data: any) {
    let sentCount = 0;
    
    // Obtener los destinatarios reales
    let recipients: string[] = [];
    if (data.sendToAll) {
      const members = await this.prisma.user.findMany({
        where: { 
          userMemberships: { some: { plan: { gymId }, status: 'ACTIVE' } } 
        },
        select: { email: true }
      });
      recipients = members.map(m => m.email);
    } else if (data.toEmail) {
      recipients = [data.toEmail];
    }

    if (recipients.length > 0 && (!data.type || data.type === 'EMAIL')) {
      try {
        let transporter;
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
           transporter = nodemailer.createTransport({
             host: process.env.SMTP_HOST || 'smtp.gmail.com',
             port: Number(process.env.SMTP_PORT) || 587,
             secure: false,
             auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
           });
        } else {
           const testAccount = await nodemailer.createTestAccount();
           transporter = nodemailer.createTransport({
             host: 'smtp.ethereal.email',
             port: 587,
             secure: false,
             auth: { user: testAccount.user, pass: testAccount.pass }
           });
        }

        // Bucle de envío Masivo
        for (const recipient of recipients) {
          await transporter.sendMail({
            from: '"SportNexus 🏆" <hello@sportsnexus.demo>',
            to: recipient,
            subject: data.subject || data.title,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  .container { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; background-color: #0f172a; color: #f8fafc; border-radius: 24px; overflow: hidden; border: 1px solid #334155; }
                  .header { background: linear-gradient(135deg, #4f46e5 0%, #ec4899 100%); padding: 30px; text-align: center; }
                  .content { padding: 40px; line-height: 1.6; }
                  .title { color: #ffffff; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
                  .message { color: #cbd5e1; font-size: 16px; margin-bottom: 30px; }
                  .cta-container { text-align: center; margin: 40px 0; }
                  .button { background-color: #6366f1; color: white !important; text-decoration: none; padding: 14px 28px; rounded: 12px; font-weight: bold; border-radius: 12px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3); }
                  .footer { background-color: #1e293b; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #334155; }
                  .accent { color: #818cf8; font-weight: bold; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1 style="margin: 0; font-size: 32px; letter-spacing: -1px; color: white;">SportNexus 🏆</h1>
                  </div>
                  <div class="content">
                    <h2 class="title">${data.subject || '¡Tenemos novedades para ti!'}</h2>
                    <div class="message">
                      ${data.content.replace(/\n/g, '<br/>')}
                    </div>
                    <div class="cta-container">
                      <a href="${process.env.CORS_ORIGIN || '#'}" class="button">Ir a la Plataforma</a>
                    </div>
                    <p style="color: #64748b; font-size: 14px;">
                      Prepárate para llevar tu entrenamiento al siguiente nivel con la tecnología de <span class="accent">SportNexus</span>.
                    </p>
                  </div>
                  <div class="footer">
                    <p>&copy; 2026 SportNexus - SaaS Deportivo & Marketplace</p>
                    <p>Este es un correo automático enviado a través de nuestra infraestructura Nodemailer.</p>
                  </div>
                </div>
              </body>
              </html>
            `,
          });
          sentCount++;
        }
        
        console.log(`Campaña Masiva disparada. Enviados: ${sentCount}`);

        // Notificación Real en la Plataforma
        const usersToNotify = await this.prisma.user.findMany({
          where: { 
            userMemberships: { some: { plan: { gymId }, status: 'ACTIVE' } } 
          }
        });

        for (const user of usersToNotify) {
          await this.notificationsService.create(user.id, {
            title: data.title || data.subject,
            description: `Tu gimnasio ha enviado una nueva comunicación: ${data.subject}`,
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
        title: data.title,
        subject: data.subject,
        content: data.content,
        type: data.type || CampaignType.EMAIL,
        status: CampaignStatus.SENT,
        sentCount: sentCount > 0 ? sentCount : 0,
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
}
