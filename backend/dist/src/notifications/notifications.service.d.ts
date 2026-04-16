import { PrismaService } from '../prisma/prisma.service';
export declare class NotificationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(userId: string, data: {
        title: string;
        description: string;
        type?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        description: string;
        title: string;
        userId: string;
        type: string;
        isRead: boolean;
    }>;
    findAllByUser(userId: string): Promise<{
        id: string;
        createdAt: Date;
        description: string;
        title: string;
        userId: string;
        type: string;
        isRead: boolean;
    }[]>;
    markAsRead(id: string): Promise<{
        id: string;
        createdAt: Date;
        description: string;
        title: string;
        userId: string;
        type: string;
        isRead: boolean;
    }>;
    markAllAsRead(userId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
}
