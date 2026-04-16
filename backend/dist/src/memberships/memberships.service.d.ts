import { PrismaService } from '../prisma/prisma.service';
import { CreateMembershipPlanDto, SubscribeDto } from './dto/membership.dto';
export declare class MembershipsService {
    private prisma;
    constructor(prisma: PrismaService);
    createPlan(gymId: string, ownerId: string, dto: CreateMembershipPlanDto): Promise<{
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
    subscribe(userId: string, dto: SubscribeDto): Promise<{
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
    getUserMemberships(userId: string): Promise<({
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
