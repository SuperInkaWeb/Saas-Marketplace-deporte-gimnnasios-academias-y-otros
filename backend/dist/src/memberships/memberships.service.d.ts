import { PrismaService } from '../prisma/prisma.service';
import { CreateMembershipPlanDto, UpdateMembershipPlanDto, SubscribeDto } from './dto/membership.dto';
export declare class MembershipsService {
    private prisma;
    constructor(prisma: PrismaService);
    createPlan(gymId: string, ownerId: string, dto: CreateMembershipPlanDto): Promise<{
        id: string;
        name: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        durationDays: number;
        maxClasses: number | null;
        includesMarketplace: boolean;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        gymId: string;
    }>;
    findAllPlans(gymId?: string): Promise<({
        gym: {
            name: string;
        };
    } & {
        id: string;
        name: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        durationDays: number;
        maxClasses: number | null;
        includesMarketplace: boolean;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        gymId: string;
    })[]>;
    subscribe(userId: string, dto: SubscribeDto): Promise<{
        plan: {
            id: string;
            name: string;
            description: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            durationDays: number;
            maxClasses: number | null;
            includesMarketplace: boolean;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            gymId: string;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.MembershipStatus;
        startedAt: Date;
        expiresAt: Date;
        classesUsed: number;
        userId: string;
        planId: string;
    }>;
    activateFromPayment(paymentId: string, planId: string, mpPaymentId: string): Promise<({
        plan: {
            id: string;
            name: string;
            description: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            durationDays: number;
            maxClasses: number | null;
            includesMarketplace: boolean;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            gymId: string;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.MembershipStatus;
        startedAt: Date;
        expiresAt: Date;
        classesUsed: number;
        userId: string;
        planId: string;
    }) | null>;
    getUserMemberships(userId: string): Promise<({
        plan: {
            gym: {
                name: string;
            };
        } & {
            id: string;
            name: string;
            description: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            durationDays: number;
            maxClasses: number | null;
            includesMarketplace: boolean;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            gymId: string;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.MembershipStatus;
        startedAt: Date;
        expiresAt: Date;
        classesUsed: number;
        userId: string;
        planId: string;
    })[]>;
    getAllMembershipsForAdmin(gymId?: string): Promise<({
        user: {
            id: string;
            name: string;
            email: string;
        };
        payments: {
            id: string;
            status: import("@prisma/client").$Enums.PaymentStatus;
            amount: import("@prisma/client/runtime/library").Decimal;
            gatewayTxId: string | null;
            paidAt: Date | null;
        }[];
        plan: {
            gym: {
                name: string;
            };
        } & {
            id: string;
            name: string;
            description: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            durationDays: number;
            maxClasses: number | null;
            includesMarketplace: boolean;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            gymId: string;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.MembershipStatus;
        startedAt: Date;
        expiresAt: Date;
        classesUsed: number;
        userId: string;
        planId: string;
    })[]>;
    updatePlan(planId: string, ownerId: string, dto: UpdateMembershipPlanDto, isAdmin?: boolean): Promise<{
        id: string;
        name: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        durationDays: number;
        maxClasses: number | null;
        includesMarketplace: boolean;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        gymId: string;
    }>;
    deletePlan(planId: string, ownerId: string, isAdmin?: boolean): Promise<{
        id: string;
        name: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        durationDays: number;
        maxClasses: number | null;
        includesMarketplace: boolean;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        gymId: string;
    }>;
}
