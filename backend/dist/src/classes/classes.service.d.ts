import { PrismaService } from '../prisma/prisma.service';
import { CreateClassDto, UpdateClassDto } from './dto/class.dto';
import { NotificationsService } from '../notifications/notifications.service';
export declare class ClassesService {
    private prisma;
    private notificationsService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    create(gymId: string, currentUserId: string, dto: CreateClassDto): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        gymId: string;
        title: string;
        classType: import("@prisma/client").$Enums.ClassType;
        capacity: number;
        durationMin: number;
        scheduledAt: Date;
        location: string | null;
        meetingUrl: string | null;
        trainerId: string | null;
    }>;
    findAll(gymId?: string): Promise<({
        reservations: {
            id: string;
            user: {
                name: string;
            };
            status: import("@prisma/client").$Enums.ReservationStatus;
            userId: string;
        }[];
        gym: {
            name: string;
            city: string | null;
            ownerId: string;
        };
        trainer: ({
            user: {
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
        }) | null;
        _count: {
            reservations: number;
        };
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        gymId: string;
        title: string;
        classType: import("@prisma/client").$Enums.ClassType;
        capacity: number;
        durationMin: number;
        scheduledAt: Date;
        location: string | null;
        meetingUrl: string | null;
        trainerId: string | null;
    })[]>;
    findOne(id: string): Promise<{
        reservations: ({
            user: {
                name: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.ReservationStatus;
            notes: string | null;
            userId: string;
            classId: string;
            bookedAt: Date;
            cancelledAt: Date | null;
        })[];
        gym: {
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
        };
        trainer: ({
            user: {
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
        }) | null;
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        gymId: string;
        title: string;
        classType: import("@prisma/client").$Enums.ClassType;
        capacity: number;
        durationMin: number;
        scheduledAt: Date;
        location: string | null;
        meetingUrl: string | null;
        trainerId: string | null;
    }>;
    book(userId: string, classId: string): Promise<{
        user: {
            name: string;
        };
        class: {
            gym: {
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
            };
        } & {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            gymId: string;
            title: string;
            classType: import("@prisma/client").$Enums.ClassType;
            capacity: number;
            durationMin: number;
            scheduledAt: Date;
            location: string | null;
            meetingUrl: string | null;
            trainerId: string | null;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.ReservationStatus;
        notes: string | null;
        userId: string;
        classId: string;
        bookedAt: Date;
        cancelledAt: Date | null;
    }>;
    cancelBooking(userId: string, classId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.ReservationStatus;
        notes: string | null;
        userId: string;
        classId: string;
        bookedAt: Date;
        cancelledAt: Date | null;
    }>;
    markAttendance(reservationId: string, currentUserId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.ReservationStatus;
        notes: string | null;
        userId: string;
        classId: string;
        bookedAt: Date;
        cancelledAt: Date | null;
    }>;
    update(id: string, currentUserId: string, dto: UpdateClassDto): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        gymId: string;
        title: string;
        classType: import("@prisma/client").$Enums.ClassType;
        capacity: number;
        durationMin: number;
        scheduledAt: Date;
        location: string | null;
        meetingUrl: string | null;
        trainerId: string | null;
    }>;
    remove(id: string, currentUserId: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        gymId: string;
        title: string;
        classType: import("@prisma/client").$Enums.ClassType;
        capacity: number;
        durationMin: number;
        scheduledAt: Date;
        location: string | null;
        meetingUrl: string | null;
        trainerId: string | null;
    }>;
}
