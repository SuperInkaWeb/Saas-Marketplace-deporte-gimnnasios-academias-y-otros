import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '@prisma/client';
import { EmailService } from '../notifications/email.service';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly config;
    private readonly emailService;
    constructor(prisma: PrismaService, jwtService: JwtService, config: ConfigService, emailService: EmailService);
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
    refreshTokens(userId: string, refreshToken: string): Promise<{
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
    getMe(userId: string): Promise<{
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
    switchRole(userId: string, newRole: UserRole): Promise<{
        id: string;
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        phone: string | null;
        dni: string | null;
        avatarUrl: string | null;
    }>;
    updateProfile(userId: string, data: {
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
    getDashboardStats(userId: string, role: string): Promise<{
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
    findOrCreateAuth0User(params: {
        auth0Id: string;
        email: string;
        name: string;
        avatarUrl?: string;
    }): Promise<{
        id: string;
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        avatarUrl: string | null;
        isActive: boolean;
    }>;
    private generateTokens;
    inviteUser(invitedBy: {
        id: string;
        role: UserRole;
    }, email: string, role: UserRole, gymId?: string): Promise<{
        message: string;
        invitationId: string;
        expiresAt: Date;
    }>;
}
