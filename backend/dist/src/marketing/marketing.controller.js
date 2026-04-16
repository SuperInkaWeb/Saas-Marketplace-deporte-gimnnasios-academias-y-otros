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
exports.MarketingController = void 0;
const common_1 = require("@nestjs/common");
const marketing_service_1 = require("./marketing.service");
const gyms_service_1 = require("../gyms/gyms.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let MarketingController = class MarketingController {
    marketingService;
    gymsService;
    constructor(marketingService, gymsService) {
        this.marketingService = marketingService;
        this.gymsService = gymsService;
    }
    async createCampaign(gymId, data, user) {
        if (user.role !== client_1.UserRole.ADMIN) {
            await this.gymsService.validateOwnership(gymId, user.id);
        }
        return this.marketingService.createCampaign(gymId, data);
    }
    async getCampaigns(gymId, user) {
        if (user.role !== client_1.UserRole.ADMIN) {
            await this.gymsService.validateOwnership(gymId, user.id);
        }
        return this.marketingService.getCampaigns(gymId);
    }
};
exports.MarketingController = MarketingController;
__decorate([
    (0, common_1.Post)('gym/:gymId/campaigns'),
    (0, roles_decorator_1.Roles)('ADMIN', 'GYM_OWNER'),
    __param(0, (0, common_1.Param)('gymId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], MarketingController.prototype, "createCampaign", null);
__decorate([
    (0, common_1.Get)('gym/:gymId/campaigns'),
    (0, roles_decorator_1.Roles)('ADMIN', 'GYM_OWNER'),
    __param(0, (0, common_1.Param)('gymId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MarketingController.prototype, "getCampaigns", null);
exports.MarketingController = MarketingController = __decorate([
    (0, common_1.Controller)('marketing'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [marketing_service_1.MarketingService,
        gyms_service_1.GymsService])
], MarketingController);
//# sourceMappingURL=marketing.controller.js.map