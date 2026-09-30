import { GymsService } from './gyms.service';
import { CreateGymDto, UpdateGymDto } from './dto/gym.dto';
export declare class GymsController {
    private readonly gymsService;
    constructor(gymsService: GymsService);
    create(user: any, createGymDto: CreateGymDto): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        email: string | null;
        phone: string | null;
        updatedAt: Date;
        ownerId: string;
        description: string | null;
        address: string | null;
        city: string | null;
        district: string | null;
        province: string | null;
        country: string | null;
        latitude: number | null;
        longitude: number | null;
        locationSource: import("@prisma/client").$Enums.GymLocationSource | null;
        logoUrl: string | null;
        website: string | null;
        openTime: string | null;
        closeTime: string | null;
        openDays: string | null;
        status: import("@prisma/client").$Enums.GymStatus;
    }>;
    findAll(ownerId?: string, trainerUserId?: string): Promise<({
        gymTrainers: {
            trainer: {
                userId: string;
            };
            trainerId: string;
        }[];
        owner: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        name: string;
        email: string | null;
        phone: string | null;
        updatedAt: Date;
        ownerId: string;
        description: string | null;
        address: string | null;
        city: string | null;
        district: string | null;
        province: string | null;
        country: string | null;
        latitude: number | null;
        longitude: number | null;
        locationSource: import("@prisma/client").$Enums.GymLocationSource | null;
        logoUrl: string | null;
        website: string | null;
        openTime: string | null;
        closeTime: string | null;
        openDays: string | null;
        status: import("@prisma/client").$Enums.GymStatus;
    })[]>;
    findNearby(lat: string, lng: string, radius?: string): Promise<({
        gymTrainers: {
            trainer: {
                userId: string;
            };
            trainerId: string;
        }[];
        owner: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        name: string;
        email: string | null;
        phone: string | null;
        updatedAt: Date;
        ownerId: string;
        description: string | null;
        address: string | null;
        city: string | null;
        district: string | null;
        province: string | null;
        country: string | null;
        latitude: number | null;
        longitude: number | null;
        locationSource: import("@prisma/client").$Enums.GymLocationSource | null;
        logoUrl: string | null;
        website: string | null;
        openTime: string | null;
        closeTime: string | null;
        openDays: string | null;
        status: import("@prisma/client").$Enums.GymStatus;
    })[]>;
    findOne(id: string): Promise<{
        gymTrainers: ({
            trainer: {
                user: {
                    id: string;
                    name: string;
                    avatarUrl: string | null;
                };
            } & {
                id: string;
                userId: string;
                createdAt: Date;
                updatedAt: Date;
                bio: string | null;
                specialties: string[];
                certifications: string[];
                experienceYears: number;
                hourlyRate: import("@prisma/client/runtime/library").Decimal | null;
                rating: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            canCreateClasses: boolean;
            joinedAt: Date;
            gymId: string;
            trainerId: string;
        })[];
        membershipPlans: {
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
        }[];
    } & {
        id: string;
        createdAt: Date;
        name: string;
        email: string | null;
        phone: string | null;
        updatedAt: Date;
        ownerId: string;
        description: string | null;
        address: string | null;
        city: string | null;
        district: string | null;
        province: string | null;
        country: string | null;
        latitude: number | null;
        longitude: number | null;
        locationSource: import("@prisma/client").$Enums.GymLocationSource | null;
        logoUrl: string | null;
        website: string | null;
        openTime: string | null;
        closeTime: string | null;
        openDays: string | null;
        status: import("@prisma/client").$Enums.GymStatus;
    }>;
    findMembers(id: string, user: any): Promise<{
        id: string;
        name: string;
        email: string;
        phone: string | null;
        avatarUrl: string | null;
    }[]>;
    update(id: string, user: any, updateGymDto: UpdateGymDto): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        email: string | null;
        phone: string | null;
        updatedAt: Date;
        ownerId: string;
        description: string | null;
        address: string | null;
        city: string | null;
        district: string | null;
        province: string | null;
        country: string | null;
        latitude: number | null;
        longitude: number | null;
        locationSource: import("@prisma/client").$Enums.GymLocationSource | null;
        logoUrl: string | null;
        website: string | null;
        openTime: string | null;
        closeTime: string | null;
        openDays: string | null;
        status: import("@prisma/client").$Enums.GymStatus;
    }>;
    remove(id: string, user: any): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        email: string | null;
        phone: string | null;
        updatedAt: Date;
        ownerId: string;
        description: string | null;
        address: string | null;
        city: string | null;
        district: string | null;
        province: string | null;
        country: string | null;
        latitude: number | null;
        longitude: number | null;
        locationSource: import("@prisma/client").$Enums.GymLocationSource | null;
        logoUrl: string | null;
        website: string | null;
        openTime: string | null;
        closeTime: string | null;
        openDays: string | null;
        status: import("@prisma/client").$Enums.GymStatus;
    }>;
}
