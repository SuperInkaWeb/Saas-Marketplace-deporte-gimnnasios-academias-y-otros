import { PrismaService } from '../prisma/prisma.service';
export interface Recommendation {
    type: 'CLASS' | 'GYM' | 'EVENT' | 'PROFESSIONAL';
    id: string;
    title: string;
    subtitle: string;
    reason: string;
    score: number;
    data: any;
}
export declare class RecommendationsService {
    private prisma;
    constructor(prisma: PrismaService);
    getPersonalizedRecommendations(userId: string): Promise<{
        recommendations: Recommendation[];
        insights: string[];
        userProfile: any;
    }>;
}
