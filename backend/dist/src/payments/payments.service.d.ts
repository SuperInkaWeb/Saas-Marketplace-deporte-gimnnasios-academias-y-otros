export declare class PaymentsService {
    private stripe;
    constructor();
    createPaymentIntent(amount: number, description?: string): Promise<{
        clientSecret: any;
    }>;
}
