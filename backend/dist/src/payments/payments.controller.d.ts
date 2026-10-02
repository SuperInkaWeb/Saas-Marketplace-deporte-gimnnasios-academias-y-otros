import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    createIntent(data: {
        amount: number;
        description?: string;
    }): Promise<{
        acquirerId: string;
        idCommerce: string;
        purchaseOperationNumber: string;
        purchaseAmount: string;
        purchaseCurrencyCode: string;
        purchaseVerification: string;
        description: string;
    }>;
    membershipCheckout(data: {
        planId: string;
    }, req: any): Promise<{
        paymentId: string;
        checkoutUrl: string | undefined;
    }>;
    confirm(data: {
        paymentId: string;
    }, req: any): Promise<{
        status: string;
    }>;
    status(id: string, req: any): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.PaymentStatus;
        amount: import("@prisma/client/runtime/library").Decimal;
    }>;
    webhook(body: any, query: any): Promise<{
        ok: boolean;
    }>;
}
