"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
const mercadopago_1 = require("mercadopago");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const memberships_service_1 = require("../memberships/memberships.service");
let PaymentsService = PaymentsService_1 = class PaymentsService {
    prisma;
    memberships;
    logger = new common_1.Logger(PaymentsService_1.name);
    mp = new mercadopago_1.MercadoPagoConfig({
        accessToken: process.env.MP_ACCESS_TOKEN,
    });
    constructor(prisma, memberships) {
        this.prisma = prisma;
        this.memberships = memberships;
    }
    async createMembershipCheckout(userId, email, planId) {
        const plan = await this.prisma.membershipPlan.findUnique({ where: { id: planId } });
        if (!plan || !plan.isActive)
            throw new common_1.NotFoundException('Plan no disponible');
        const payment = await this.prisma.payment.create({
            data: {
                userId,
                amount: plan.price,
                currency: 'PEN',
                status: client_1.PaymentStatus.PENDING,
                description: `Suscripción a ${plan.name}`,
            },
        });
        const preference = await new mercadopago_1.Preference(this.mp).create({
            body: {
                items: [
                    {
                        id: plan.id,
                        title: `Suscripción a ${plan.name}`,
                        quantity: 1,
                        unit_price: Number(plan.price),
                        currency_id: 'PEN',
                    },
                ],
                payer: { email },
                external_reference: payment.id,
                metadata: { plan_id: plan.id, user_id: userId },
                back_urls: {
                    success: `${process.env.FRONTEND_URL}/payment/success?ref=${payment.id}`,
                    failure: `${process.env.FRONTEND_URL}/payment/failure?ref=${payment.id}`,
                    pending: `${process.env.FRONTEND_URL}/payment/pending?ref=${payment.id}`,
                },
                notification_url: `${process.env.BACKEND_URL}/payments/mercadopago/webhook`,
            },
        });
        return { paymentId: payment.id, checkoutUrl: preference.init_point };
    }
    async processMercadoPagoPayment(mpPaymentId, expectedUserId) {
        const mpPayment = await new mercadopago_1.Payment(this.mp).get({ id: mpPaymentId });
        const localId = mpPayment.external_reference;
        if (!localId)
            return { status: 'IGNORED' };
        const local = await this.prisma.payment.findUnique({ where: { id: localId } });
        if (!local) {
            this.logger.warn(`Pago local ${localId} no encontrado`);
            return { status: 'IGNORED' };
        }
        if (expectedUserId && local.userId !== expectedUserId) {
            throw new common_1.ForbiddenException();
        }
        if (local.status !== client_1.PaymentStatus.PENDING)
            return { status: local.status };
        if (mpPayment.status === 'approved') {
            const sameAmount = Number(mpPayment.transaction_amount) === Number(local.amount);
            const planId = mpPayment.metadata?.plan_id;
            if (!sameAmount || mpPayment.currency_id !== 'PEN' || !planId) {
                this.logger.error(`Pago ${local.id} aprobado pero con datos que no coinciden`);
                return { status: 'MISMATCH' };
            }
            await this.memberships.activateFromPayment(local.id, planId, String(mpPayment.id));
            return { status: client_1.PaymentStatus.COMPLETED };
        }
        if (mpPayment.status === 'rejected' || mpPayment.status === 'cancelled') {
            await this.prisma.payment.updateMany({
                where: { id: local.id, status: client_1.PaymentStatus.PENDING },
                data: { status: client_1.PaymentStatus.FAILED },
            });
            return { status: client_1.PaymentStatus.FAILED };
        }
        return { status: client_1.PaymentStatus.PENDING };
    }
    async getStatus(paymentId, userId) {
        const p = await this.prisma.payment.findUnique({ where: { id: paymentId } });
        if (!p || p.userId !== userId)
            throw new common_1.NotFoundException();
        return { id: p.id, status: p.status, amount: p.amount };
    }
    async createPaymeSignature(amount, description) {
        const acquirerId = process.env.PAYME_ACQUIRER_ID || '148';
        const idCommerce = process.env.PAYME_COMMERCE_ID || '8259';
        const purchaseCurrencyCode = '604';
        const apiKey = process.env.PAYME_API_KEY || '123456789';
        const purchaseAmount = Math.round(amount * 100).toString();
        const purchaseOperationNumber = Math.floor(Math.random() * 999999)
            .toString()
            .padStart(6, '0');
        const dataToSign = `${acquirerId}${idCommerce}${purchaseOperationNumber}${purchaseAmount}${purchaseCurrencyCode}${apiKey}`;
        const purchaseVerification = crypto.createHash('sha512').update(dataToSign).digest('hex');
        return {
            acquirerId,
            idCommerce,
            purchaseOperationNumber,
            purchaseAmount,
            purchaseCurrencyCode,
            purchaseVerification,
            description: description || 'Compra en Hercix',
        };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        memberships_service_1.MembershipsService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map