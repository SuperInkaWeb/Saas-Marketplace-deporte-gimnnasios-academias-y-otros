import { GymStatus } from '@prisma/client';
export declare class CreateGymDto {
    name: string;
    description?: string;
    address?: string;
    city?: string;
    country?: string;
    phone?: string;
    email?: string;
    website?: string;
}
export declare class UpdateGymDto {
    name?: string;
    description?: string;
    address?: string;
    city?: string;
    country?: string;
    phone?: string;
    email?: string;
    website?: string;
    status?: GymStatus;
}
