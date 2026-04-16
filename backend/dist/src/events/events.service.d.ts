import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';
export declare class EventsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(organizerId: string, createDto: CreateEventDto): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        title: string;
        capacity: number | null;
        location: string | null;
        eventType: import("@prisma/client").$Enums.EventType;
        date: Date;
        organizerId: string;
    }>;
    findAll(): Promise<({
        organizer: {
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
        capacity: number | null;
        location: string | null;
        eventType: import("@prisma/client").$Enums.EventType;
        date: Date;
        organizerId: string;
    })[]>;
    findOne(id: string): Promise<{
        organizer: {
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
        capacity: number | null;
        location: string | null;
        eventType: import("@prisma/client").$Enums.EventType;
        date: Date;
        organizerId: string;
    }>;
    update(id: string, currentUserId: string, updateDto: UpdateEventDto, isAdmin: boolean): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        title: string;
        capacity: number | null;
        location: string | null;
        eventType: import("@prisma/client").$Enums.EventType;
        date: Date;
        organizerId: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        title: string;
        capacity: number | null;
        location: string | null;
        eventType: import("@prisma/client").$Enums.EventType;
        date: Date;
        organizerId: string;
    }>;
}
