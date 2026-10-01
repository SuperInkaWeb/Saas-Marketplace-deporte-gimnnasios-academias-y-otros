import { PrismaService } from '../prisma/prisma.service';
import { MembershipsService } from '../memberships/memberships.service';
export declare class PaymentsService {
    private readonly prisma;
    private readonly memberships;
    private readonly logger;
    private readonly mp;
    constructor(prisma: PrismaService, memberships: MembershipsService);
    createMembershipCheckout(userId: string, email: string, planId: string): Promise<{
        paymentId: string;
        checkoutUrl: string | undefined;
    }>;
    processMercadoPagoPayment(mpPaymentId: string, expectedUserId?: string): Promise<{
        status: string;
    }>;
    getStatus(paymentId: string, userId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.PaymentStatus;
        amount: import("@prisma/client/runtime/library").Decimal;
    }>;
    createPaymeSignature(amount: number, description?: string): Promise<{
        acquirerId: string;
        idCommerce: string;
        purchaseOperationNumber: string;
        purchaseAmount: string;
        purchaseCurrencyCode: string;
        purchaseVerification: string;
        description: string;
    }>;
}
