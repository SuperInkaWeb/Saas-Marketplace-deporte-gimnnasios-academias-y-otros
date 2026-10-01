import { MembershipsService } from './memberships.service';
import { CreateMembershipPlanDto, UpdateMembershipPlanDto, SubscribeDto } from './dto/membership.dto';
export declare class MembershipsController {
    private readonly membershipsService;
    constructor(membershipsService: MembershipsService);
    createPlan(gymId: string, user: any, dto: CreateMembershipPlanDto): Promise<{
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
    subscribe(user: any, dto: SubscribeDto): Promise<{
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
    getMyMemberships(user: any): Promise<({
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
    getAllMemberships(gymId?: string): Promise<({
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
    updatePlan(planId: string, user: any, dto: UpdateMembershipPlanDto): Promise<{
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
    deletePlan(planId: string, user: any): Promise<{
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
