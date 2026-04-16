import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class MarketingService {
    private readonly prisma;
    private readonly notificationsService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    createCampaign(gymId: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.CampaignStatus;
        gymId: string;
        title: string;
        scheduledAt: Date | null;
        type: import("@prisma/client").$Enums.CampaignType;
        content: string;
        subject: string | null;
        sentCount: number;
    }>;
    getCampaigns(gymId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.CampaignStatus;
        gymId: string;
        title: string;
        scheduledAt: Date | null;
        type: import("@prisma/client").$Enums.CampaignType;
        content: string;
        subject: string | null;
        sentCount: number;
    }[]>;
}
