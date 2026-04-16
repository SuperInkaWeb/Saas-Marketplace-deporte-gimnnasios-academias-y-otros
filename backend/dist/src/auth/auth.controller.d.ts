import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    getMe(user: {
        id: string;
    }): Promise<{
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
    getDashboardStats(user: any): Promise<{
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
}
