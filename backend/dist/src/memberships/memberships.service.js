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
exports.MembershipsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
let MembershipsService = class MembershipsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createPlan(gymId, ownerId, dto) {
        const gym = await this.prisma.gym.findUnique({ where: { id: gymId } });
        if (!gym)
            throw new common_1.NotFoundException('Gimnasio no encontrado');
        if (gym.ownerId !== ownerId) {
            throw new common_1.ForbiddenException('No eres el dueño de este gimnasio');
        }
        return this.prisma.membershipPlan.create({
            data: {
                ...dto,
                gymId,
            },
        });
    }
    async findAllPlans(gymId) {
        return this.prisma.membershipPlan.findMany({
            where: {
                ...(gymId ? { gymId } : {}),
                isActive: true,
            },
            include: {
                gym: { select: { name: true } },
            },
        });
    }
    async subscribe(userId, dto) {
        const plan = await this.prisma.membershipPlan.findUnique({
            where: { id: dto.planId },
        });
        if (!plan)
            throw new common_1.NotFoundException('Plan no encontrado');
        if (!plan.isActive)
            throw new common_1.BadRequestException('Este plan no está disponible');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + plan.durationDays);
        return this.prisma.$transaction(async (tx) => {
            const membership = await tx.userMembership.create({
                data: {
                    userId,
                    planId: plan.id,
                    status: client_1.MembershipStatus.ACTIVE,
                    expiresAt,
                },
                include: {
                    plan: true,
                },
            });
            const payment = await tx.payment.create({
                data: {
                    userId,
                    amount: plan.price,
                    status: client_1.PaymentStatus.COMPLETED,
                    method: 'CREDIT_CARD',
                    gatewayTxId: `tx_${(0, crypto_1.randomUUID)()}`,
                    description: `Suscripción a ${plan.name}`,
                    membershipId: membership.id,
                    paidAt: new Date(),
                },
            });
            const invoiceAmount = Number(plan.price);
            const taxAmount = invoiceAmount * 0.19;
            const totalAmount = invoiceAmount + taxAmount;
            await tx.invoice.create({
                data: {
                    paymentId: payment.id,
                    userId,
                    gymId: plan.gymId,
                    invoiceNum: `INV-${Date.now().toString().slice(-6)}`,
                    amount: invoiceAmount,
                    tax: taxAmount,
                    total: totalAmount,
                    status: client_1.InvoiceStatus.ISSUED,
                    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                },
            });
            return membership;
        });
    }
    async getUserMemberships(userId) {
        return this.prisma.userMembership.findMany({
            where: { userId },
            include: {
                plan: {
                    include: { gym: { select: { name: true } } },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.MembershipsService = MembershipsService;
exports.MembershipsService = MembershipsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MembershipsService);
//# sourceMappingURL=memberships.service.js.map