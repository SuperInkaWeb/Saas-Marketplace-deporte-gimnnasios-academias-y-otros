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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AnalyticsService = class AnalyticsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboardStats(gymId) {
        const activeMembers = await this.prisma.userMembership.count({
            where: { plan: { gymId }, status: 'ACTIVE' },
        });
        const activePlans = await this.prisma.userMembership.findMany({
            where: { plan: { gymId }, status: 'ACTIVE' },
            include: { plan: true },
        });
        const currentMRR = activePlans.reduce((sum, member) => sum + Number(member.plan.price), 0);
        const totalClasses = await this.prisma.class.count({
            where: { gymId },
        });
        const reservationsCount = await this.prisma.reservation.count({
            where: { class: { gymId } },
        });
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const membersJoinedLongAgo = await this.prisma.userMembership.count({
            where: { plan: { gymId }, startedAt: { lte: thirtyDaysAgo } }
        });
        const membersJoinedLongAgoAndActive = await this.prisma.userMembership.count({
            where: { plan: { gymId }, startedAt: { lte: thirtyDaysAgo }, status: 'ACTIVE' }
        });
        let retentionRate = 100;
        if (membersJoinedLongAgo > 0) {
            retentionRate = (membersJoinedLongAgoAndActive / membersJoinedLongAgo) * 100;
        }
        else {
            retentionRate = activeMembers > 0 ? 100 : 0;
        }
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        const recentPayments = await this.prisma.payment.findMany({
            where: {
                status: 'COMPLETED',
                paidAt: { gte: sixMonthsAgo },
                OR: [
                    { membership: { plan: { gymId } } },
                    { order: { gymId } }
                ]
            },
            select: { amount: true, paidAt: true }
        });
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const mrrHistoryMap = new Map();
        const classesHistoryMap = new Map();
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const name = monthNames[d.getMonth()];
            mrrHistoryMap.set(name, 0);
            classesHistoryMap.set(name, 0);
        }
        recentPayments.forEach(p => {
            const date = p.paidAt || new Date();
            const monthName = monthNames[date.getMonth()];
            if (mrrHistoryMap.has(monthName)) {
                mrrHistoryMap.set(monthName, mrrHistoryMap.get(monthName) + Number(p.amount));
            }
        });
        const chartData = Array.from(mrrHistoryMap.entries()).map(([name, MRR], i) => ({
            name,
            MRR,
            attendees: Math.floor(reservationsCount / 6),
            newMembers: Math.floor(activeMembers / 6)
        }));
        const currentMonthData = chartData[5] || { MRR: 0 };
        const lastMonthData = chartData[4] || { MRR: 0 };
        let mrrGrowth = 0;
        if (lastMonthData.MRR > 0) {
            mrrGrowth = ((currentMonthData.MRR - lastMonthData.MRR) / lastMonthData.MRR) * 100;
        }
        else if (currentMonthData.MRR > 0) {
            mrrGrowth = 100;
        }
        return {
            activeMembers,
            monthlyRecurringRevenue: currentMRR,
            totalClasses,
            reservationsCount,
            retentionRate: Number(retentionRate.toFixed(1)),
            mrrGrowth: Number(mrrGrowth.toFixed(1)),
            chartData
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map