import { PrismaService } from '../prisma/prisma.service';
export declare class WearablesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    syncData(userId: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        date: Date;
        deviceType: string;
        steps: number;
        heartRateAvg: number | null;
        calories: number;
    }>;
    getMetrics(userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        date: Date;
        deviceType: string;
        steps: number;
        heartRateAvg: number | null;
        calories: number;
    }[]>;
}
