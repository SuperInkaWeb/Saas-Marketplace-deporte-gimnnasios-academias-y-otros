import { RecommendationsService } from './recommendations.service';
import { GeminiService } from './gemini.service';
export declare class RecommendationsController {
    private readonly recommendationsService;
    private readonly geminiService;
    constructor(recommendationsService: RecommendationsService, geminiService: GeminiService);
    getRecommendations(user: any): Promise<{
        aiMessage: string;
        aiEnabled: boolean;
        insights: string[];
        userProfile: any;
        recommendations: import("./recommendations.service").Recommendation[];
    }>;
    chat(user: any, body: {
        message: string;
    }): Promise<{
        response: string;
        aiEnabled: boolean;
    }>;
}
