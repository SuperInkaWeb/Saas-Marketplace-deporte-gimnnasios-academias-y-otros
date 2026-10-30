import { BadRequestException } from '@nestjs/common';
import { MarketingService } from './marketing.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService, escapeHtml } from '../notifications/email.service';

// AUD-22: al corregir AUD-06 los dueños vuelven a poder crear campañas, así que
// el envío queda limitado a miembros del gimnasio y el texto se escapa.
describe('Campañas de marketing: contención de AUD-22', () => {
  let service: MarketingService;
  let prisma: any;
  let email: { sendMarketingCampaign: jest.Mock };

  beforeEach(() => {
    prisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
      },
      marketingCampaign: {
        count: jest.fn().mockResolvedValue(0),
        create: jest
          .fn()
          .mockImplementation(({ data }) =>
            Promise.resolve({ id: 'c1', ...data }),
          ),
      },
    };
    email = { sendMarketingCampaign: jest.fn().mockResolvedValue(undefined) };
    service = new MarketingService(
      prisma as PrismaService,
      {
        create: jest.fn().mockResolvedValue(undefined),
      } as unknown as NotificationsService,
      email as unknown as EmailService,
    );
  });

  it('rechaza un destinatario que no es miembro del gimnasio y no envía nada', async () => {
    await expect(
      service.createCampaign('gym-1', {
        subject: 'Hola',
        content: 'x',
        toEmail: 'victima@externo.com',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(email.sendMarketingCampaign).not.toHaveBeenCalled();
    expect(prisma.marketingCampaign.create).not.toHaveBeenCalled();
    const where = prisma.user.findFirst.mock.calls[0][0].where;
    expect(where.email).toEqual({
      equals: 'victima@externo.com',
      mode: 'insensitive',
    });
    expect(where.OR).toHaveLength(2); // membresía activa o reserva en ESTE gimnasio
  });

  it('envía a un miembro del gimnasio', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'u1',
      email: 'socio@example.com',
    });

    const campaign = await service.createCampaign('gym-1', {
      subject: 'Hola',
      content: 'Texto',
      toEmail: 'SOCIO@example.com',
    });

    expect(email.sendMarketingCampaign).toHaveBeenCalledWith(
      'socio@example.com',
      expect.anything(),
    );
    expect(campaign.sentCount).toBe(1);
  });

  it('el envío masivo usa el mismo filtro de miembros', async () => {
    await service.createCampaign('gym-1', {
      subject: 'Hola',
      content: 'x',
      sendToAll: true,
    });

    const where = prisma.user.findMany.mock.calls[0][0].where;
    expect(JSON.stringify(where)).toContain('"gymId":"gym-1"');
  });
});

describe('EmailService.sendMarketingCampaign escapa el HTML (AUD-22)', () => {
  it('no permite inyectar etiquetas en el titular ni en el cuerpo', async () => {
    const send = jest.fn().mockResolvedValue(undefined);
    const emailService = Object.assign(Object.create(EmailService.prototype), {
      send,
    }) as EmailService;

    await emailService.sendMarketingCampaign('socio@example.com', {
      name: 'socio',
      subject: 'Promo',
      headline: '<img src=x onerror=alert(1)>',
      body: 'Línea 1\n<a href="https://phishing.example">Inicia sesión</a>',
      ctaText: 'Ir a la Plataforma',
      ctaUrl: 'https://hercix.com',
    });

    const [, , html, preview] = send.mock.calls[0];
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<a href="https://phishing.example"');
    expect(html).toContain(
      '&lt;a href=&quot;https://phishing.example&quot;&gt;',
    );
    expect(html).toContain('Línea 1<br>');
    expect(preview).toBe(escapeHtml('<img src=x onerror=alert(1)>'));
  });
});
