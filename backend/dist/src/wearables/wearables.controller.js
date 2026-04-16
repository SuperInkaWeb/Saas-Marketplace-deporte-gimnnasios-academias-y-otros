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
exports.WearablesController = void 0;
const common_1 = require("@nestjs/common");
const wearables_service_1 = require("./wearables.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let WearablesController = class WearablesController {
    wearablesService;
    constructor(wearablesService) {
        this.wearablesService = wearablesService;
    }
    async syncData(req, data) {
        const userId = req.user.id;
        return this.wearablesService.syncData(userId, data);
    }
    async getMetrics(req) {
        const userId = req.user.id;
        return this.wearablesService.getMetrics(userId);
    }
    async fitbitAuth(req) {
        const client_id = process.env.FITBIT_CLIENT_ID || 'fitbit_demo_id';
        const redirect_uri = encodeURIComponent('http://localhost:5173/dashboard/wearables');
        const scope = 'activity heartrate sleep profile';
        return {
            url: `https://www.fitbit.com/oauth2/authorize?response_type=token&client_id=${client_id}&redirect_uri=${redirect_uri}&scope=${scope}&expires_in=604800`
        };
    }
};
exports.WearablesController = WearablesController;
__decorate([
    (0, common_1.Post)('sync'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WearablesController.prototype, "syncData", null);
__decorate([
    (0, common_1.Get)('metrics'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WearablesController.prototype, "getMetrics", null);
__decorate([
    (0, common_1.Get)('fitbit/auth'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WearablesController.prototype, "fitbitAuth", null);
exports.WearablesController = WearablesController = __decorate([
    (0, common_1.Controller)('wearables'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [wearables_service_1.WearablesService])
], WearablesController);
//# sourceMappingURL=wearables.controller.js.map