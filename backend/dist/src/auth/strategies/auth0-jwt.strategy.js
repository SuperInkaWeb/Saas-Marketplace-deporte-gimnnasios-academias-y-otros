"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Auth0JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const jwks_rsa_1 = require("jwks-rsa");
const config_1 = require("@nestjs/config");
const auth_service_1 = require("../auth.service");
let Auth0JwtStrategy = class Auth0JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy, 'auth0') {
    config;
    authService;
    constructor(config, authService) {
        const domain = config.get('AUTH0_DOMAIN');
        const audience = config.get('AUTH0_AUDIENCE');
        super({
            secretOrKeyProvider: (0, jwks_rsa_1.passportJwtSecret)({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 5,
                jwksUri: `https://${domain}/.well-known/jwks.json`,
            }),
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            audience: audience,
            issuer: `https://${domain}/`,
            algorithms: ['RS256'],
        });
        this.config = config;
        this.authService = authService;
    }
    async validate(payload) {
        const { sub, email, name, picture } = payload;
        if (!sub) {
            throw new common_1.UnauthorizedException('Token inválido: falta sub');
        }
        const user = await this.authService.findOrCreateAuth0User({
            auth0Id: sub,
            email: email ?? `${sub}@auth0.user`,
            name: name ?? 'Usuario',
            avatarUrl: picture,
        });
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException('Usuario inactivo o no encontrado');
        }
        return user;
    }
};
exports.Auth0JwtStrategy = Auth0JwtStrategy;
exports.Auth0JwtStrategy = Auth0JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        auth_service_1.AuthService])
], Auth0JwtStrategy);
//# sourceMappingURL=auth0-jwt.strategy.js.map