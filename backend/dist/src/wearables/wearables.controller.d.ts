import { WearablesService } from './wearables.service';
export declare class WearablesController {
    private readonly wearablesService;
    constructor(wearablesService: WearablesService);
    syncData(req: any, data: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        date: Date;
        deviceType: string;
        steps: number;
        heartRateAvg: number | null;
        calories: number;
    }>;
    getMetrics(req: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        date: Date;
        deviceType: string;
        steps: number;
        heartRateAvg: number | null;
        calories: number;
    }[]>;
    fitbitAuth(req: any): Promise<{
        url: string;
    }>;
}
