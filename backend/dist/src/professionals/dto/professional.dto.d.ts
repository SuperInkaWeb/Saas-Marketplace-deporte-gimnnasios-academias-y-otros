import { ServiceType } from '@prisma/client';
export declare class CreateProfessionalDto {
    title: string;
    description?: string;
    price: number;
    serviceType: ServiceType;
    durationMin?: number;
    isActive?: boolean;
}
export declare class UpdateProfessionalDto extends CreateProfessionalDto {
}
