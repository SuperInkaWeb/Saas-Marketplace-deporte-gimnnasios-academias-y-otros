import { EmailService } from './email.service';
import { MarketingService } from '../marketing/marketing.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

// AUD-30: sin RESEND_API_KEY la API no debe caerse, y las campañas deben contar
// solo los correos que realmente salieron.
describe('AUD-30: correo sin clave y conteo real de campañas', () => {
  const original = process.env.RESEND_API_KEY;
  afterEach(() => {
    if (original === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = original;
  });

  it('el servicio de correo se crea sin RESEND_API_KEY', () => {
    delete process.env.RESEND_API_KEY;
    expect(() => new EmailService()).not.toThrow();
  });

  it('sin clave el envío se simula y devuelve false', async () => {
    delete process.env.RESEND_API_KEY;
    const service = new EmailService();
    await expect(service.sendWelcome('a@example.com', 'Ana')).resolves.toBe(
      false,
    );
  });

  it('un error de Resend devuelve false; un envío correcto devuelve true', async () => {
    process.env.RESEND_API_KEY = 're_test_dummy';
    const service = new EmailService();
    const send = jest.fn();
    Object.assign(service, { resend: { emails: { send } } });

    send.mockResolvedValueOnce({
      data: null,
      error: { message: 'dominio no verificado' },
    });
    await expect(service.sendWelcome('a@example.com', 'Ana')).resolves.toBe(
      false,
    );

    send.mockRejectedValueOnce(new Error('timeout'));
    await expect(service.sendWelcome('a@example.com', 'Ana')).resolves.toBe(
      false,
    );

    send.mockResolvedValueOnce({ data: { id: 'e1' }, error: null });
    await expect(service.sendWelcome('a@example.com', 'Ana')).resolves.toBe(
      true,
    );
  });

  describe('campañas', () => {
    let prisma: any;
    let email: { sendMarketingCampaign: jest.Mock };
    let service: MarketingService;

    beforeEach(() => {
      prisma = {
        user: {
          findFirst: jest.fn(),
          findMany: jest.fn().mockResolvedValue([
            { id: 'u1', email: 'uno@example.com' },
            { id: 'u2', email: 'dos@example.com' },
            { id: 'u3', email: 'tres@example.com' },
          ]),
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
      email = { sendMarketingCampaign: jest.fn() };
      service = new MarketingService(
        prisma as PrismaService,
        {
          create: jest.fn().mockResolvedValue(undefined),
        } as unknown as NotificationsService,
        email as unknown as EmailService,
      );
    });

    it('sentCount cuenta solo los correos enviados', async () => {
      email.sendMarketingCampaign
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const campaign = await service.createCampaign('gym-1', {
        subject: 'Hola',
        content: 'x',
        sendToAll: true,
      });

      expect(campaign.sentCount).toBe(2);
      expect(campaign.status).toBe('SENT');
    });

    it('si no sale ningún correo la campaña queda FAILED', async () => {
      email.sendMarketingCampaign.mockResolvedValue(false);

      const campaign = await service.createCampaign('gym-1', {
        subject: 'Hola',
        content: 'x',
        sendToAll: true,
      });

      expect(campaign.sentCount).toBe(0);
      expect(campaign.status).toBe('FAILED');
    });
  });
});
