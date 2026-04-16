import { ClassesService } from './classes.service';
import { CreateClassDto, UpdateClassDto } from './dto/class.dto';
export declare class ClassesController {
    private readonly classesService;
    constructor(classesService: ClassesService);
    create(gymId: string, user: any, createClassDto: CreateClassDto): Promise<{
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
    book(id: string, user: any): Promise<{
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
    cancelBooking(id: string, user: any): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.ReservationStatus;
        notes: string | null;
        userId: string;
        classId: string;
        bookedAt: Date;
        cancelledAt: Date | null;
    }>;
    markAttendance(reservationId: string, user: any): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.ReservationStatus;
        notes: string | null;
        userId: string;
        classId: string;
        bookedAt: Date;
        cancelledAt: Date | null;
    }>;
    update(id: string, user: any, updateClassDto: UpdateClassDto): Promise<{
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
    remove(id: string, user: any): Promise<{
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
