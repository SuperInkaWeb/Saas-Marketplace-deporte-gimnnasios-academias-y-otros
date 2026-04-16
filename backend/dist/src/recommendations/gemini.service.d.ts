import { ConfigService } from '@nestjs/config';
export declare class GeminiService {
    private config;
    private readonly logger;
    private genAI;
    private model;
    private readonly isEnabled;
    constructor(config: ConfigService);
    get enabled(): boolean;
    generatePersonalizedMessage(context: {
        userName: string;
        insights: string[];
        topRecommendation?: string;
        totalReservations: number;
    }): Promise<string>;
    chatWithAssistant(message: string, userContext: string): Promise<string>;
    private getFallbackChatResponse;
}
