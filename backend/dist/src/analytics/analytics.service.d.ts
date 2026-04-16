import { PrismaService } from '../prisma/prisma.service';
export declare class AnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getDashboardStats(gymId: string): Promise<{
        activeMembers: number;
        monthlyRecurringRevenue: number;
        totalClasses: number;
        reservationsCount: number;
        retentionRate: number;
        mrrGrowth: number;
        chartData: {
            name: string;
            MRR: number;
            attendees: number;
            newMembers: number;
        }[];
    }>;
}
