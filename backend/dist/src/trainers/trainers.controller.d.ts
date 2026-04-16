import { TrainersService } from './trainers.service';
import { AssignTrainerDto, UpdateTrainerProfileDto } from './dto/trainer.dto';
export declare class TrainersController {
    private readonly trainersService;
    constructor(trainersService: TrainersService);
    upsertProfile(user: any, updateTrainerProfileDto: UpdateTrainerProfileDto): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
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
    }>;
    assignToGym(gymId: string, user: any, assignTrainerDto: AssignTrainerDto): Promise<{
        id: string;
        gymId: string;
        trainerId: string;
        canCreateClasses: boolean;
        joinedAt: Date;
    }>;
    findAll(): Promise<({
        user: {
            id: string;
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
    })[]>;
    getGymTrainers(gymId: string): Promise<({
        trainer: {
            user: {
                id: string;
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
        };
    } & {
        id: string;
        gymId: string;
        trainerId: string;
        canCreateClasses: boolean;
        joinedAt: Date;
    })[]>;
}
