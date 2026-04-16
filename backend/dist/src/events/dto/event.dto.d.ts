import { EventType } from '@prisma/client';
export declare class CreateEventDto {
    title: string;
    description?: string;
    eventType: EventType;
    price?: number;
    date: string;
    location?: string;
    capacity?: number;
    isActive?: boolean;
}
export declare class UpdateEventDto extends CreateEventDto {
}
