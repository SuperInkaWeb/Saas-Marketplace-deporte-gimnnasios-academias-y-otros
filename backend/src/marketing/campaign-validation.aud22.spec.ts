import {
  BadRequestException,
  HttpException,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { MarketingService } from './marketing.service';
import { MarketingController } from './marketing.controller';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../notifications/email.service';
import { CreateCampaignDto } from './dto/campaign.dto';

// AUD-22 (resto): el cuerpo de la campaña se valida con un DTO y cada gimnasio
// tiene un tope de campañas en 24 horas.

// Mismas opciones que el ValidationPipe global de main.ts.
const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});
const validate = (body: unknown) =>
  pipe.transform(body, { type: 'body', metatype: CreateCampaignDto });

describe('CreateCampaignDto (AUD-22)', () => {
  it('POST /marketing/gym/:gymId/campaigns valida el cuerpo con el DTO', () => {
    const types = Reflect.getMetadata(
      'design:paramtypes',
      MarketingController.prototype,
      'createCampaign',
    ) as unknown[];
    expect(types[1]).toBe(CreateCampaignDto);
  });

  it('acepta lo que envía el CRM', async () => {
    const dto = await validate({
      title: 'Promo',
      subject: 'Promo',
      type: 'EMAIL',
      content: 'Texto de la campaña',
      sendToAll: false,
      toEmail: 'socio@example.com',
    });
    expect(dto).toBeInstanceOf(CreateCampaignDto);
  });

  it('rechaza campos que no son parte de una campaña', async () => {
    await expect(
      validate({
        subject: 'Promo',
        content: 'x',
        gymId: 'otro-gym',
        status: 'DRAFT',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('exige asunto y contenido', async () => {
    await expect(validate({ content: 'x' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(
      validate({ subject: 'Promo', content: '' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('limita el largo del asunto y del contenido', async () => {
    await expect(
      validate({ subject: 'a'.repeat(201), content: 'x' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      validate({ subject: 'Promo', content: 'a'.repeat(5001) }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza un tipo desconocido, un destinatario que no es correo o sendToAll no booleano', async () => {
    await expect(
      validate({ subject: 'Promo', content: 'x', type: 'WHATSAPP' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      validate({ subject: 'Promo', content: 'x', toEmail: 'no-es-correo' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      validate({ subject: 'Promo', content: 'x', sendToAll: 'yes' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('Límite de campañas por gimnasio (AUD-22)', () => {
  let service: MarketingService;
  let prisma: any;
  let email: { sendMarketingCampaign: jest.Mock };

  beforeEach(() => {
    prisma = {
      user: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ id: 'u1', email: 'socio@example.com' }),
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

  it('cuenta solo las campañas de ese gimnasio en las últimas 24 horas', async () => {
    await service.createCampaign('gym-1', {
      subject: 'Hola',
      content: 'x',
      toEmail: 'socio@example.com',
    });

    const where = prisma.marketingCampaign.count.mock.calls[0][0].where;
    expect(where.gymId).toBe('gym-1');
    const desde = where.createdAt.gte.getTime();
    expect(Date.now() - desde).toBeGreaterThanOrEqual(
      24 * 60 * 60 * 1000 - 1000,
    );
    expect(Date.now() - desde).toBeLessThanOrEqual(24 * 60 * 60 * 1000 + 1000);
  });

  it('responde 429 y no envía nada al llegar al tope', async () => {
    prisma.marketingCampaign.count.mockResolvedValue(10);

    const error = await service
      .createCampaign('gym-1', {
        subject: 'Hola',
        content: 'x',
        sendToAll: true,
      })
      .catch((e) => e);

    expect(error).toBeInstanceOf(HttpException);
    expect(error.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(prisma.user.findMany).not.toHaveBeenCalled();
    expect(email.sendMarketingCampaign).not.toHaveBeenCalled();
    expect(prisma.marketingCampaign.create).not.toHaveBeenCalled();
  });

  it('por debajo del tope envía y guarda la campaña, con el asunto como título si falta', async () => {
    prisma.marketingCampaign.count.mockResolvedValue(9);

    const campaign = await service.createCampaign('gym-1', {
      subject: 'Hola',
      content: 'x',
      toEmail: 'socio@example.com',
    });

    expect(email.sendMarketingCampaign).toHaveBeenCalledTimes(1);
    expect(campaign.title).toBe('Hola');
  });
});
