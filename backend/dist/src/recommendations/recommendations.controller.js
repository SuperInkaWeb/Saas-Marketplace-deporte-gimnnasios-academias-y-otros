"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationsController = void 0;
const common_1 = require("@nestjs/common");
const recommendations_service_1 = require("./recommendations.service");
const gemini_service_1 = require("./gemini.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const swagger_1 = require("@nestjs/swagger");
let RecommendationsController = class RecommendationsController {
    recommendationsService;
    geminiService;
    constructor(recommendationsService, geminiService) {
        this.recommendationsService = recommendationsService;
        this.geminiService = geminiService;
    }
    async getRecommendations(user) {
        const { recommendations, insights, userProfile } = await this.recommendationsService.getPersonalizedRecommendations(user.id);
        const aiMessage = await this.geminiService.generatePersonalizedMessage({
            userName: user.name,
            insights,
            topRecommendation: recommendations[0]?.title,
            totalReservations: userProfile.totalReservations,
        });
        return {
            aiMessage,
            aiEnabled: this.geminiService.enabled,
            insights,
            userProfile,
            recommendations,
        };
    }
    async chat(user, body) {
        const userContext = `Usuario: ${user.name}, Rol: ${user.role}`;
        const response = await this.geminiService.chatWithAssistant(body.message, userContext);
        return {
            response,
            aiEnabled: this.geminiService.enabled,
        };
    }
};
exports.RecommendationsController = RecommendationsController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get personalized recommendations + AI message for current user' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RecommendationsController.prototype, "getRecommendations", null);
__decorate([
    (0, common_1.Post)('chat'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Chat with the AI sports assistant (Gemini)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RecommendationsController.prototype, "chat", null);
exports.RecommendationsController = RecommendationsController = __decorate([
    (0, swagger_1.ApiTags)('AI Recommendations'),
    (0, common_1.Controller)('recommendations'),
    __metadata("design:paramtypes", [recommendations_service_1.RecommendationsService,
        gemini_service_1.GeminiService])
], RecommendationsController);
//# sourceMappingURL=recommendations.controller.js.map