import { ClassType } from '@prisma/client';
export declare class CreateClassDto {
    title: string;
    description?: string;
    classType?: ClassType;
    capacity?: number;
    durationMin?: number;
    price?: number;
    scheduledAt: string;
    location?: string;
    meetingUrl?: string;
    trainerId?: string;
}
export declare class UpdateClassDto {
    title?: string;
    description?: string;
    classType?: ClassType;
    capacity?: number;
    durationMin?: number;
    price?: number;
    scheduledAt?: string;
    location?: string;
    meetingUrl?: string;
    isActive?: boolean;
}
