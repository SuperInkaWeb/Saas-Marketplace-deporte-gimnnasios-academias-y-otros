import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly config;
    constructor(prisma: PrismaService, jwtService: JwtService, config: ConfigService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            name: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
            createdAt: Date;
        };
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            auth0Id: string | null;
            name: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
            phone: string | null;
            avatarUrl: string | null;
            isActive: boolean;
            emailVerified: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    getMe(userId: string): Promise<{
        id: string;
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        phone: string | null;
        avatarUrl: string | null;
        isActive: boolean;
        emailVerified: boolean;
        createdAt: Date;
    } | null>;
    getDashboardStats(userId: string, role: string): Promise<{
        gyms: number;
        classes: number;
        members: number;
        revenue: number;
        activities: any[];
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
}
