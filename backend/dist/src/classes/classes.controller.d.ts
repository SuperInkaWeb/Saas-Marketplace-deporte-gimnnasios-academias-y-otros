import { ClassesService } from './classes.service';
import { CreateClassDto, UpdateClassDto } from './dto/class.dto';
export declare class ClassesController {
    private readonly classesService;
    constructor(classesService: ClassesService);
    create(gymId: string, user: any, createClassDto: CreateClassDto): Promise<{
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        description: string | null;
        title: string;
        price: import("@prisma/client/runtime/library").Decimal;
        location: string | null;
        capacity: number;
        gymId: string;
        trainerId: string | null;
        classType: import("@prisma/client").$Enums.ClassType;
        durationMin: number;
        scheduledAt: Date;
        meetingUrl: string | null;
    }>;
    findAll(gymId?: string, myReservations?: string, user?: any): Promise<({
        reservations: {
            id: string;
            userId: string;
            user: {
                id: string;
                name: string;
                email: string;
                role: import("@prisma/client").$Enums.UserRole;
                dni: string | null;
                avatarUrl: string | null;
            };
            status: import("@prisma/client").$Enums.ReservationStatus;
        }[];
        gym: {
            name: string;
            ownerId: string;
            city: string | null;
        };
        _count: {
            reservations: number;
        };
        trainer: ({
            user: {
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
        }) | null;
    } & {
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        description: string | null;
        title: string;
        price: import("@prisma/client/runtime/library").Decimal;
        location: string | null;
        capacity: number;
        gymId: string;
        trainerId: string | null;
        classType: import("@prisma/client").$Enums.ClassType;
        durationMin: number;
        scheduledAt: Date;
        meetingUrl: string | null;
    })[]>;
    findOne(id: string): Promise<{
        reservations: ({
            user: {
                id: string;
                name: string;
                email: string;
                role: import("@prisma/client").$Enums.UserRole;
                dni: string | null;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            status: import("@prisma/client").$Enums.ReservationStatus;
            bookedAt: Date;
            cancelledAt: Date | null;
            notes: string | null;
            classId: string;
        })[];
        gym: {
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
        };
        trainer: ({
            user: {
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
        }) | null;
    } & {
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        description: string | null;
        title: string;
        price: import("@prisma/client/runtime/library").Decimal;
        location: string | null;
        capacity: number;
        gymId: string;
        trainerId: string | null;
        classType: import("@prisma/client").$Enums.ClassType;
        durationMin: number;
        scheduledAt: Date;
        meetingUrl: string | null;
    }>;
    book(id: string, user: any): Promise<{
        user: {
            name: string;
        };
        class: {
            gym: {
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
            };
        } & {
            id: string;
            createdAt: Date;
            isActive: boolean;
            updatedAt: Date;
            description: string | null;
            title: string;
            price: import("@prisma/client/runtime/library").Decimal;
            location: string | null;
            capacity: number;
            gymId: string;
            trainerId: string | null;
            classType: import("@prisma/client").$Enums.ClassType;
            durationMin: number;
            scheduledAt: Date;
            meetingUrl: string | null;
        };
    } & {
        id: string;
        userId: string;
        status: import("@prisma/client").$Enums.ReservationStatus;
        bookedAt: Date;
        cancelledAt: Date | null;
        notes: string | null;
        classId: string;
    }>;
    cancelBooking(id: string, user: any): Promise<{
        id: string;
        userId: string;
        status: import("@prisma/client").$Enums.ReservationStatus;
        bookedAt: Date;
        cancelledAt: Date | null;
        notes: string | null;
        classId: string;
    }>;
    markAttendance(reservationId: string, user: any): Promise<{
        id: string;
        userId: string;
        status: import("@prisma/client").$Enums.ReservationStatus;
        bookedAt: Date;
        cancelledAt: Date | null;
        notes: string | null;
        classId: string;
    }>;
    unmarkAttendance(reservationId: string, user: any): Promise<{
        id: string;
        userId: string;
        status: import("@prisma/client").$Enums.ReservationStatus;
        bookedAt: Date;
        cancelledAt: Date | null;
        notes: string | null;
        classId: string;
    }>;
    removeReservation(reservationId: string, user: any): Promise<{
        id: string;
        userId: string;
        status: import("@prisma/client").$Enums.ReservationStatus;
        bookedAt: Date;
        cancelledAt: Date | null;
        notes: string | null;
        classId: string;
    }>;
    update(id: string, user: any, updateClassDto: UpdateClassDto): Promise<{
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        description: string | null;
        title: string;
        price: import("@prisma/client/runtime/library").Decimal;
        location: string | null;
        capacity: number;
        gymId: string;
        trainerId: string | null;
        classType: import("@prisma/client").$Enums.ClassType;
        durationMin: number;
        scheduledAt: Date;
        meetingUrl: string | null;
    }>;
    remove(id: string, user: any): Promise<{
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        description: string | null;
        title: string;
        price: import("@prisma/client/runtime/library").Decimal;
        location: string | null;
        capacity: number;
        gymId: string;
        trainerId: string | null;
        classType: import("@prisma/client").$Enums.ClassType;
        durationMin: number;
        scheduledAt: Date;
        meetingUrl: string | null;
    }>;
}
