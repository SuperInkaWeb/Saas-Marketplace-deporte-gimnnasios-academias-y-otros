import { PrismaService } from '../prisma/prisma.service';
import { CreateMembershipPlanDto, UpdateMembershipPlanDto, SubscribeDto } from './dto/membership.dto';
export declare class MembershipsService {
    private prisma;
    constructor(prisma: PrismaService);
    createPlan(gymId: string, ownerId: string, dto: CreateMembershipPlanDto): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        isActive: boolean;
        updatedAt: Date;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        gymId: string;
        durationDays: number;
        maxClasses: number | null;
        includesMarketplace: boolean;
    }>;
    findAllPlans(gymId?: string): Promise<({
        gym: {
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        name: string;
        isActive: boolean;
        updatedAt: Date;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        gymId: string;
        durationDays: number;
        maxClasses: number | null;
        includesMarketplace: boolean;
    })[]>;
    subscribe(userId: string, dto: SubscribeDto): Promise<{
        plan: {
            id: string;
            createdAt: Date;
            name: string;
            isActive: boolean;
            updatedAt: Date;
            description: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            gymId: string;
            durationDays: number;
            maxClasses: number | null;
            includesMarketplace: boolean;
        };
    } & {
        id: string;
        userId: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.MembershipStatus;
        expiresAt: Date;
        planId: string;
        startedAt: Date;
        classesUsed: number;
    }>;
    activateFromPayment(paymentId: string, planId: string, mpPaymentId: string): Promise<({
        plan: {
            id: string;
            createdAt: Date;
            name: string;
            isActive: boolean;
            updatedAt: Date;
            description: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            gymId: string;
            durationDays: number;
            maxClasses: number | null;
            includesMarketplace: boolean;
        };
    } & {
        id: string;
        userId: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.MembershipStatus;
        expiresAt: Date;
        planId: string;
        startedAt: Date;
        classesUsed: number;
    }) | null>;
    getUserMemberships(userId: string): Promise<({
        plan: {
            gym: {
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            name: string;
            isActive: boolean;
            updatedAt: Date;
            description: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            gymId: string;
            durationDays: number;
            maxClasses: number | null;
            includesMarketplace: boolean;
        };
    } & {
        id: string;
        userId: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.MembershipStatus;
        expiresAt: Date;
        planId: string;
        startedAt: Date;
        classesUsed: number;
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
            createdAt: Date;
            name: string;
            isActive: boolean;
            updatedAt: Date;
            description: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            gymId: string;
            durationDays: number;
            maxClasses: number | null;
            includesMarketplace: boolean;
        };
    } & {
        id: string;
        userId: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.MembershipStatus;
        expiresAt: Date;
        planId: string;
        startedAt: Date;
        classesUsed: number;
    })[]>;
    updatePlan(planId: string, ownerId: string, dto: UpdateMembershipPlanDto, isAdmin?: boolean): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        isActive: boolean;
        updatedAt: Date;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        gymId: string;
        durationDays: number;
        maxClasses: number | null;
        includesMarketplace: boolean;
    }>;
    deletePlan(planId: string, ownerId: string, isAdmin?: boolean): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        isActive: boolean;
        updatedAt: Date;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        gymId: string;
        durationDays: number;
        maxClasses: number | null;
        includesMarketplace: boolean;
    }>;
}
