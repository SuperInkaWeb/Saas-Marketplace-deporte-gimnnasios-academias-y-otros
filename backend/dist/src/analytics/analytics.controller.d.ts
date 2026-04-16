import { AnalyticsService } from './analytics.service';
import { GymsService } from '../gyms/gyms.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    private readonly gymsService;
    constructor(analyticsService: AnalyticsService, gymsService: GymsService);
    getDashboardStats(gymId: string, user: any): Promise<{
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
