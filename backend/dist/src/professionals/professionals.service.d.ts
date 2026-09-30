import { PrismaService } from '../prisma/prisma.service';
import { CreateProfessionalDto, UpdateProfessionalDto } from './dto/professional.dto';
import { NotificationsService } from '../notifications/notifications.service';
export declare class ProfessionalsService {
    private prisma;
    private notificationsService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    create(providerId: string, createDto: CreateProfessionalDto): Promise<{
        id: string;
        createdAt: Date;
        isActive: boolean;
        description: string | null;
        title: string;
        price: import("@prisma/client/runtime/library").Decimal;
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
        createdAt: Date;
        isActive: boolean;
        description: string | null;
        title: string;
        price: import("@prisma/client/runtime/library").Decimal;
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
        createdAt: Date;
        isActive: boolean;
        description: string | null;
        title: string;
        price: import("@prisma/client/runtime/library").Decimal;
        durationMin: number;
        serviceType: import("@prisma/client").$Enums.ServiceType;
        providerId: string;
    }>;
    update(id: string, currentUserId: string, updateDto: UpdateProfessionalDto, isAdmin: boolean): Promise<{
        id: string;
        createdAt: Date;
        isActive: boolean;
        description: string | null;
        title: string;
        price: import("@prisma/client/runtime/library").Decimal;
        durationMin: number;
        serviceType: import("@prisma/client").$Enums.ServiceType;
        providerId: string;
    }>;
    remove(id: string, currentUserId: string, isAdmin: boolean): Promise<{
        id: string;
        createdAt: Date;
        isActive: boolean;
        description: string | null;
        title: string;
        price: import("@prisma/client/runtime/library").Decimal;
        durationMin: number;
        serviceType: import("@prisma/client").$Enums.ServiceType;
        providerId: string;
    }>;
    bookService(userId: string, serviceId: string, notes?: string): Promise<{
        user: {
            id: string;
            createdAt: Date;
            name: string;
            auth0Id: string | null;
            email: string;
            passwordHash: string | null;
            role: import("@prisma/client").$Enums.UserRole;
            phone: string | null;
            dni: string | null;
            avatarUrl: string | null;
            isActive: boolean;
            emailVerified: boolean;
            lastLoginAt: Date | null;
            updatedAt: Date;
            weight: number | null;
        };
        service: {
            provider: {
                id: string;
                createdAt: Date;
                name: string;
                auth0Id: string | null;
                email: string;
                passwordHash: string | null;
                role: import("@prisma/client").$Enums.UserRole;
                phone: string | null;
                dni: string | null;
                avatarUrl: string | null;
                isActive: boolean;
                emailVerified: boolean;
                lastLoginAt: Date | null;
                updatedAt: Date;
                weight: number | null;
            };
        } & {
            id: string;
            createdAt: Date;
            isActive: boolean;
            description: string | null;
            title: string;
            price: import("@prisma/client/runtime/library").Decimal;
            durationMin: number;
            serviceType: import("@prisma/client").$Enums.ServiceType;
            providerId: string;
        };
    } & {
        id: string;
        userId: string;
        status: string;
        bookedAt: Date;
        notes: string | null;
        serviceId: string;
    }>;
    getMyBookings(userId: string): Promise<({
        service: {
            provider: {
                id: string;
                createdAt: Date;
                name: string;
                auth0Id: string | null;
                email: string;
                passwordHash: string | null;
                role: import("@prisma/client").$Enums.UserRole;
                phone: string | null;
                dni: string | null;
                avatarUrl: string | null;
                isActive: boolean;
                emailVerified: boolean;
                lastLoginAt: Date | null;
                updatedAt: Date;
                weight: number | null;
            };
        } & {
            id: string;
            createdAt: Date;
            isActive: boolean;
            description: string | null;
            title: string;
            price: import("@prisma/client/runtime/library").Decimal;
            durationMin: number;
            serviceType: import("@prisma/client").$Enums.ServiceType;
            providerId: string;
        };
    } & {
        id: string;
        userId: string;
        status: string;
        bookedAt: Date;
        notes: string | null;
        serviceId: string;
    })[]>;
    getProviderBookings(providerId: string): Promise<({
        user: {
            id: string;
            name: string;
            email: string;
            phone: string | null;
        };
        service: {
            id: string;
            createdAt: Date;
            isActive: boolean;
            description: string | null;
            title: string;
            price: import("@prisma/client/runtime/library").Decimal;
            durationMin: number;
            serviceType: import("@prisma/client").$Enums.ServiceType;
            providerId: string;
        };
    } & {
        id: string;
        userId: string;
        status: string;
        bookedAt: Date;
        notes: string | null;
        serviceId: string;
    })[]>;
    updateBookingStatus(bookingId: string, providerId: string, status: string, isAdmin: boolean): Promise<{
        user: {
            id: string;
            createdAt: Date;
            name: string;
            auth0Id: string | null;
            email: string;
            passwordHash: string | null;
            role: import("@prisma/client").$Enums.UserRole;
            phone: string | null;
            dni: string | null;
            avatarUrl: string | null;
            isActive: boolean;
            emailVerified: boolean;
            lastLoginAt: Date | null;
            updatedAt: Date;
            weight: number | null;
        };
        service: {
            provider: {
                id: string;
                createdAt: Date;
                name: string;
                auth0Id: string | null;
                email: string;
                passwordHash: string | null;
                role: import("@prisma/client").$Enums.UserRole;
                phone: string | null;
                dni: string | null;
                avatarUrl: string | null;
                isActive: boolean;
                emailVerified: boolean;
                lastLoginAt: Date | null;
                updatedAt: Date;
                weight: number | null;
            };
        } & {
            id: string;
            createdAt: Date;
            isActive: boolean;
            description: string | null;
            title: string;
            price: import("@prisma/client/runtime/library").Decimal;
            durationMin: number;
            serviceType: import("@prisma/client").$Enums.ServiceType;
            providerId: string;
        };
    } & {
        id: string;
        userId: string;
        status: string;
        bookedAt: Date;
        notes: string | null;
        serviceId: string;
    }>;
}
