import { InvoicesService } from './invoices.service';
export declare class InvoicesController {
    private readonly invoicesService;
    constructor(invoicesService: InvoicesService);
    getUserInvoices(req: any): Promise<({
        gym: {
            name: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.InvoiceStatus;
        gymId: string | null;
        userId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        paymentId: string;
        invoiceNum: string;
        tax: import("@prisma/client/runtime/library").Decimal;
        total: import("@prisma/client/runtime/library").Decimal;
        pdfUrl: string | null;
        issuedAt: Date;
    })[]>;
    getGymInvoices(gymId: string): Promise<({
        user: {
            name: string;
            email: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.InvoiceStatus;
        gymId: string | null;
        userId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        paymentId: string;
        invoiceNum: string;
        tax: import("@prisma/client/runtime/library").Decimal;
        total: import("@prisma/client/runtime/library").Decimal;
        pdfUrl: string | null;
        issuedAt: Date;
    })[]>;
    getInvoiceDetails(id: string): Promise<({
        user: {
            name: string;
            email: string;
        };
        gym: {
            name: string;
            phone: string | null;
            address: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.InvoiceStatus;
        gymId: string | null;
        userId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        paymentId: string;
        invoiceNum: string;
        tax: import("@prisma/client/runtime/library").Decimal;
        total: import("@prisma/client/runtime/library").Decimal;
        pdfUrl: string | null;
        issuedAt: Date;
    }) | null>;
}
