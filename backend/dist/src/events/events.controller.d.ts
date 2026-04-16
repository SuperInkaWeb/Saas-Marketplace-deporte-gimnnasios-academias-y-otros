import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';
export declare class EventsController {
    private readonly eventsService;
    constructor(eventsService: EventsService);
    create(req: any, createDto: CreateEventDto): Promise<{
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
    update(id: string, req: any, updateDto: UpdateEventDto): Promise<{
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
