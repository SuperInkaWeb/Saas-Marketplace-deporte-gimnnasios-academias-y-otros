import { InvoicesService } from './invoices.service';
import { GymsService } from '../gyms/gyms.service';
export declare class InvoicesController {
    private readonly invoicesService;
    private readonly gymsService;
    constructor(invoicesService: InvoicesService, gymsService: GymsService);
    getAllInvoices(): Promise<({
        user: {
            name: string;
            email: string;
        };
        gym: {
            name: string;
        } | null;
    } & {
        id: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.InvoiceStatus;
        gymId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        paymentId: string;
        invoiceNum: string;
        tax: import("@prisma/client/runtime/library").Decimal;
        total: import("@prisma/client/runtime/library").Decimal;
        pdfUrl: string | null;
        issuedAt: Date;
    })[]>;
    getUserInvoices(req: any): Promise<({
        gym: {
            name: string;
        } | null;
    } & {
        id: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.InvoiceStatus;
        gymId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        paymentId: string;
        invoiceNum: string;
        tax: import("@prisma/client/runtime/library").Decimal;
        total: import("@prisma/client/runtime/library").Decimal;
        pdfUrl: string | null;
        issuedAt: Date;
    })[]>;
    getGymInvoices(gymId: string, req: any): Promise<({
        user: {
            name: string;
            email: string;
        };
    } & {
        id: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.InvoiceStatus;
        gymId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        paymentId: string;
        invoiceNum: string;
        tax: import("@prisma/client/runtime/library").Decimal;
        total: import("@prisma/client/runtime/library").Decimal;
        pdfUrl: string | null;
        issuedAt: Date;
    })[]>;
    getInvoiceDetails(id: string, req: any): Promise<{
        gym: {
            name: string;
            phone: string | null;
            address: string | null;
        } | null;
        user: {
            name: string;
            email: string;
        };
        id: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.InvoiceStatus;
        gymId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        paymentId: string;
        invoiceNum: string;
        tax: import("@prisma/client/runtime/library").Decimal;
        total: import("@prisma/client/runtime/library").Decimal;
        pdfUrl: string | null;
        issuedAt: Date;
    }>;
}
