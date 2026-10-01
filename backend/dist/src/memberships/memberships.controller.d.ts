import { MembershipsService } from './memberships.service';
import { CreateMembershipPlanDto, UpdateMembershipPlanDto, SubscribeDto } from './dto/membership.dto';
export declare class MembershipsController {
    private readonly membershipsService;
    constructor(membershipsService: MembershipsService);
    createPlan(gymId: string, user: any, dto: CreateMembershipPlanDto): Promise<{
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
    subscribe(user: any, dto: SubscribeDto): Promise<{
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
    getMyMemberships(user: any): Promise<({
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
    updatePlan(planId: string, user: any, dto: UpdateMembershipPlanDto): Promise<{
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
    deletePlan(planId: string, user: any): Promise<{
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
