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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WearablesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let WearablesService = class WearablesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async syncData(userId, data) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return this.prisma.wearableMetric.upsert({
            where: {
                userId_date: {
                    userId,
                    date: today,
                },
            },
            update: {
                steps: data.steps,
                heartRateAvg: data.heartRateAvg,
                calories: data.calories,
                deviceType: data.deviceType,
            },
            create: {
                userId,
                date: today,
                steps: data.steps || 0,
                heartRateAvg: data.heartRateAvg,
                calories: data.calories || 0,
                deviceType: data.deviceType || 'UNKNOWN',
            },
        });
    }
    async getMetrics(userId) {
        return this.prisma.wearableMetric.findMany({
            where: { userId },
            orderBy: { date: 'desc' },
            take: 7,
        });
    }
};
exports.WearablesService = WearablesService;
exports.WearablesService = WearablesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WearablesService);
//# sourceMappingURL=wearables.service.js.map