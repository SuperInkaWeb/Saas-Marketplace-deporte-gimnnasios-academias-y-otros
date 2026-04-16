import { PrismaService } from '../prisma/prisma.service';
import { CreateGymDto, UpdateGymDto } from './dto/gym.dto';
export declare class GymsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(ownerId: string, createGymDto: CreateGymDto): Promise<{
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        address: string | null;
        city: string | null;
        country: string | null;
        latitude: number | null;
        longitude: number | null;
        logoUrl: string | null;
        website: string | null;
        status: import("@prisma/client").$Enums.GymStatus;
        ownerId: string;
    }>;
    findAll(): Promise<({
        owner: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        address: string | null;
        city: string | null;
        country: string | null;
        latitude: number | null;
        longitude: number | null;
        logoUrl: string | null;
        website: string | null;
        status: import("@prisma/client").$Enums.GymStatus;
        ownerId: string;
    })[]>;
    findNearby(lat: number, lng: number, radiusKm: number): Promise<({
        owner: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        address: string | null;
        city: string | null;
        country: string | null;
        latitude: number | null;
        longitude: number | null;
        logoUrl: string | null;
        website: string | null;
        status: import("@prisma/client").$Enums.GymStatus;
        ownerId: string;
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
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                bio: string | null;
                specialties: string[];
                certifications: string[];
                experienceYears: number;
                hourlyRate: import("@prisma/client/runtime/library").Decimal | null;
                rating: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            gymId: string;
            trainerId: string;
            canCreateClasses: boolean;
            joinedAt: Date;
        })[];
        membershipPlans: {
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
        }[];
    } & {
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        address: string | null;
        city: string | null;
        country: string | null;
        latitude: number | null;
        longitude: number | null;
        logoUrl: string | null;
        website: string | null;
        status: import("@prisma/client").$Enums.GymStatus;
        ownerId: string;
    }>;
    update(id: string, currentUserId: string, updateGymDto: UpdateGymDto, isAdmin: boolean): Promise<{
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        address: string | null;
        city: string | null;
        country: string | null;
        latitude: number | null;
        longitude: number | null;
        logoUrl: string | null;
        website: string | null;
        status: import("@prisma/client").$Enums.GymStatus;
        ownerId: string;
    }>;
    remove(id: string, currentUserId: string, isAdmin: boolean): Promise<{
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        address: string | null;
        city: string | null;
        country: string | null;
        latitude: number | null;
        longitude: number | null;
        logoUrl: string | null;
        website: string | null;
        status: import("@prisma/client").$Enums.GymStatus;
        ownerId: string;
    }>;
    findMembers(gymId: string): Promise<{
        id: string;
        name: string;
        email: string;
        phone: string | null;
        avatarUrl: string | null;
    }[]>;
    validateOwnership(gymId: string, ownerId: string): Promise<boolean>;
}
