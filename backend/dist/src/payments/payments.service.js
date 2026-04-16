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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const stripe_1 = __importDefault(require("stripe"));
let PaymentsService = class PaymentsService {
    stripe;
    constructor() {
        this.stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
            apiVersion: '2026-03-25.dahlia',
        });
    }
    async createPaymentIntent(amount, description) {
        if (!process.env.STRIPE_SECRET_KEY) {
            console.warn('STRIPE_SECRET_KEY no configurado, simulando client_secret dummy');
            return { clientSecret: 'pi_dummy_secret_dummy' };
        }
        try {
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: Math.round(amount * 100),
                currency: 'cop',
                description: description || 'Compra en SportNexus Marketplace',
                automatic_payment_methods: {
                    enabled: true,
                },
            });
            return { clientSecret: paymentIntent.client_secret };
        }
        catch (error) {
            console.error('Error al crear Payment Intent en Stripe:', error);
            throw error;
        }
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map