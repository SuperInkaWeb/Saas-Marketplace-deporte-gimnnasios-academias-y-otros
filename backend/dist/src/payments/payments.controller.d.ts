import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    createIntent(data: {
        amount: number;
        description?: string;
    }): Promise<{
        clientSecret: any;
    }>;
}
