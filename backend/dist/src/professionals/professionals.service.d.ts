import { PrismaService } from '../prisma/prisma.service';
import { CreateProfessionalDto, UpdateProfessionalDto } from './dto/professional.dto';
export declare class ProfessionalsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(providerId: string, createDto: CreateProfessionalDto): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        title: string;
        durationMin: number;
        serviceType: import("@prisma/client").$Enums.ServiceType;
        providerId: string;
    }>;
    findAll(): Promise<({
        provider: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        title: string;
        durationMin: number;
        serviceType: import("@prisma/client").$Enums.ServiceType;
        providerId: string;
    })[]>;
    findOne(id: string): Promise<{
        provider: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        title: string;
        durationMin: number;
        serviceType: import("@prisma/client").$Enums.ServiceType;
        providerId: string;
    }>;
    update(id: string, currentUserId: string, updateDto: UpdateProfessionalDto, isAdmin: boolean): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        title: string;
        durationMin: number;
        serviceType: import("@prisma/client").$Enums.ServiceType;
        providerId: string;
    }>;
    remove(id: string, currentUserId: string, isAdmin: boolean): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        title: string;
        durationMin: number;
        serviceType: import("@prisma/client").$Enums.ServiceType;
        providerId: string;
    }>;
    bookService(userId: string, serviceId: string, notes?: string): Promise<{
        service: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            description: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            title: string;
            durationMin: number;
            serviceType: import("@prisma/client").$Enums.ServiceType;
            providerId: string;
        };
    } & {
        id: string;
        status: string;
        notes: string | null;
        userId: string;
        bookedAt: Date;
        serviceId: string;
    }>;
    getMyBookings(userId: string): Promise<({
        service: {
            provider: {
                id: string;
                auth0Id: string | null;
                name: string;
                email: string;
                passwordHash: string | null;
                role: import("@prisma/client").$Enums.UserRole;
                phone: string | null;
                avatarUrl: string | null;
                isActive: boolean;
                emailVerified: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            isActive: boolean;
            createdAt: Date;
            description: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            title: string;
            durationMin: number;
            serviceType: import("@prisma/client").$Enums.ServiceType;
            providerId: string;
        };
    } & {
        id: string;
        status: string;
        notes: string | null;
        userId: string;
        bookedAt: Date;
        serviceId: string;
    })[]>;
}
