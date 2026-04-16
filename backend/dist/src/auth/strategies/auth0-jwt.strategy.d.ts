import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
export interface Auth0JwtPayload {
    sub: string;
    email?: string;
    name?: string;
    picture?: string;
    iss: string;
    aud: string | string[];
}
declare const Auth0JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class Auth0JwtStrategy extends Auth0JwtStrategy_base {
    private readonly config;
    private readonly authService;
    constructor(config: ConfigService, authService: AuthService);
    validate(payload: Auth0JwtPayload): Promise<{
        id: string;
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        avatarUrl: string | null;
        isActive: boolean;
    }>;
}
export {};
