import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { GymsService } from './gyms.service';
import { GymAccessService } from '../common/gym-access/gym-access.service';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsController } from '../analytics/analytics.controller';
import { AnalyticsService } from '../analytics/analytics.service';
import { InvoicesController } from '../invoices/invoices.controller';
import { InvoicesService } from '../invoices/invoices.service';
import { MarketingController } from '../marketing/marketing.controller';
import { MarketingService } from '../marketing/marketing.service';

// AUD-06: los controladores pasaban user.id (string) a validateOwnership, que espera el
// usuario completo, y todo dueño recibía 403 en su propio gimnasio.
const GYM_ID = 'gym-1';
const OWNER = { id: 'owner-1', role: UserRole.GYM_OWNER };
const OTHER_OWNER = { id: 'owner-2', role: UserRole.GYM_OWNER };
const ADMIN = { id: 'admin-1', role: UserRole.ADMIN };

describe('Dueños de gimnasio en analytics, facturas y campañas (AUD-06)', () => {
  let analytics: AnalyticsController;
  let invoices: InvoicesController;
  let marketing: MarketingController;
  let analyticsService: any;
  let invoicesService: any;
  let marketingService: any;

  beforeEach(() => {
    const prisma = {
      gym: {
        findUnique: jest.fn().mockResolvedValue({
          id: GYM_ID,
          ownerId: OWNER.id,
          gymTrainers: [],
        }),
      },
    };
    const gymAccess = new GymAccessService(prisma as unknown as PrismaService);
    // validateOwnership real, sin el resto de dependencias de GymsService.
    const gymsService = Object.assign(Object.create(GymsService.prototype), {
      gymAccess,
    }) as GymsService;

    analyticsService = {
      getDashboardStats: jest.fn().mockResolvedValue({ ok: true }),
    };
    invoicesService = { getGymInvoices: jest.fn().mockResolvedValue([]) };
    marketingService = {
      getCampaigns: jest.fn().mockResolvedValue([]),
      createCampaign: jest.fn().mockResolvedValue({ id: 'c1' }),
    };

    analytics = new AnalyticsController(
      analyticsService as AnalyticsService,
      gymsService,
    );
    invoices = new InvoicesController(
      invoicesService as InvoicesService,
      gymsService,
    );
    marketing = new MarketingController(
      marketingService as MarketingService,
      gymsService,
    );
  });

  const calls = {
    'GET analytics/gym/:gymId/dashboard': (u: any) =>
      analytics.getDashboardStats(GYM_ID, u),
    'GET invoices/gym/:gymId': (u: any) =>
      invoices.getGymInvoices(GYM_ID, { user: u }),
    'GET marketing/gym/:gymId/campaigns': (u: any) =>
      marketing.getCampaigns(GYM_ID, u),
    'POST marketing/gym/:gymId/campaigns': (u: any) =>
      marketing.createCampaign(
        GYM_ID,
        { subject: 'Hola', content: 'Texto' },
        u,
      ),
  };

  describe.each(Object.entries(calls))('%s', (_route, call) => {
    it('el dueño accede a su propio gimnasio', async () => {
      await expect(call(OWNER)).resolves.toBeDefined();
    });

    it('otro dueño recibe 403', async () => {
      await expect(call(OTHER_OWNER)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('el ADMIN accede a cualquier gimnasio', async () => {
      await expect(call(ADMIN)).resolves.toBeDefined();
    });
  });

  it('un dueño ajeno no llega a crear la campaña', async () => {
    await expect(
      calls['POST marketing/gym/:gymId/campaigns'](OTHER_OWNER),
    ).rejects.toThrow();
    expect(marketingService.createCampaign).not.toHaveBeenCalled();
  });
});
