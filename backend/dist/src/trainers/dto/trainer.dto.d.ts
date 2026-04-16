export declare class UpdateTrainerProfileDto {
    bio?: string;
    specialties?: string[];
    certifications?: string[];
    experienceYears?: number;
    hourlyRate?: number;
}
export declare class AssignTrainerDto {
    trainerId: string;
    canCreateClasses?: boolean;
}
