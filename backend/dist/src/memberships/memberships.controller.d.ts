import { MembershipsService } from './memberships.service';
import { CreateMembershipPlanDto, SubscribeDto } from './dto/membership.dto';
export declare class MembershipsController {
    private readonly membershipsService;
    constructor(membershipsService: MembershipsService);
    createPlan(gymId: string, user: any, dto: CreateMembershipPlanDto): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        durationDays: number;
        maxClasses: number | null;
        includesMarketplace: boolean;
        gymId: string;
    }>;
    findAllPlans(gymId?: string): Promise<({
        gym: {
            name: string;
        };
    } & {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        durationDays: number;
        maxClasses: number | null;
        includesMarketplace: boolean;
        gymId: string;
    })[]>;
    subscribe(user: any, dto: SubscribeDto): Promise<{
        plan: {
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            durationDays: number;
            maxClasses: number | null;
            includesMarketplace: boolean;
            gymId: string;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.MembershipStatus;
        userId: string;
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
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            durationDays: number;
            maxClasses: number | null;
            includesMarketplace: boolean;
            gymId: string;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.MembershipStatus;
        userId: string;
        expiresAt: Date;
        planId: string;
        startedAt: Date;
        classesUsed: number;
    })[]>;
}
