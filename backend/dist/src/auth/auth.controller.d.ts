import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '@prisma/client';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            createdAt: Date;
            name: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            createdAt: Date;
            name: string;
            auth0Id: string | null;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
            phone: string | null;
            dni: string | null;
            avatarUrl: string | null;
            isActive: boolean;
            emailVerified: boolean;
            lastLoginAt: Date | null;
            updatedAt: Date;
            weight: number | null;
        };
    }>;
    refresh(dto: {
        userId: string;
        refreshToken: string;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            createdAt: Date;
            name: string;
            auth0Id: string | null;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
            phone: string | null;
            dni: string | null;
            avatarUrl: string | null;
            isActive: boolean;
            emailVerified: boolean;
            lastLoginAt: Date | null;
            updatedAt: Date;
            weight: number | null;
        };
    }>;
    getMe(user: {
        id: string;
    }): Promise<{
        roles: string[];
        id: string;
        createdAt: Date;
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        phone: string | null;
        dni: string | null;
        avatarUrl: string | null;
        isActive: boolean;
        emailVerified: boolean;
        lastLoginAt: Date | null;
    } | null>;
    updateProfile(user: {
        id: string;
    }, dto: {
        name: string;
        phone?: string;
        dni?: string;
    }): Promise<{
        id: string;
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        phone: string | null;
        dni: string | null;
        avatarUrl: string | null;
    }>;
    switchRole(user: {
        id: string;
    }, dto: {
        role: UserRole;
    }): Promise<{
        id: string;
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        phone: string | null;
        dni: string | null;
        avatarUrl: string | null;
    }>;
    getDashboardStats(user: any): Promise<{
        gyms: number;
        classes: number;
        members: number;
        revenue: number;
        activities: {
            id: string;
            type: string;
            title: string;
            description: string;
            date: Date;
        }[];
        isAdmin: boolean;
        services?: undefined;
        gymDetails?: undefined;
        isTrainer?: undefined;
        reservations?: undefined;
        points?: undefined;
        months?: undefined;
    } | {
        gyms: number;
        classes: number;
        members: number;
        revenue: number;
        activities: any[];
        isAdmin?: undefined;
        services?: undefined;
        gymDetails?: undefined;
        isTrainer?: undefined;
        reservations?: undefined;
        points?: undefined;
        months?: undefined;
    } | {
        classes: number;
        members: number;
        services: number;
        gyms: number;
        activities: never[];
        revenue?: undefined;
        isAdmin?: undefined;
        gymDetails?: undefined;
        isTrainer?: undefined;
        reservations?: undefined;
        points?: undefined;
        months?: undefined;
    } | {
        classes: number;
        members: number;
        services: number;
        gyms: number;
        gymDetails: {
            id: string;
            name: string;
        }[];
        activities: {
            id: string;
            type: string;
            title: string;
            description: string;
            date: Date;
        }[];
        isTrainer: boolean;
        revenue?: undefined;
        isAdmin?: undefined;
        reservations?: undefined;
        points?: undefined;
        months?: undefined;
    } | {
        reservations: number;
        gyms: number;
        points: number;
        months: number;
        activities: {
            id: string;
            type: string;
            title: string;
            description: string;
            date: Date;
        }[];
        classes?: undefined;
        members?: undefined;
        revenue?: undefined;
        isAdmin?: undefined;
        services?: undefined;
        gymDetails?: undefined;
        isTrainer?: undefined;
    }>;
    invite(user: {
        id: string;
        role: UserRole;
    }, dto: {
        email: string;
        role: UserRole;
        gymId?: string;
    }): Promise<{
        message: string;
        invitationId: string;
        expiresAt: Date;
    }>;
}
