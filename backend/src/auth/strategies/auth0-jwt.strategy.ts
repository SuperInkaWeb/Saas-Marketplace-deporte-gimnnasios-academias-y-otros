import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

export interface Auth0JwtPayload {
  sub: string;      // Auth0 user ID e.g. "auth0|abc123"
  email?: string;
  name?: string;
  picture?: string;
  iss: string;
  aud: string | string[];
}

@Injectable()
export class Auth0JwtStrategy extends PassportStrategy(Strategy, 'auth0') {
  constructor(
    private readonly config: ConfigService,
    private readonly authService: AuthService,
  ) {
    const domain = config.get<string>('AUTH0_DOMAIN')!;
    const audience = config.get<string>('AUTH0_AUDIENCE')!;

    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${domain}/.well-known/jwks.json`,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: audience,
      issuer: `https://${domain}/`,
      algorithms: ['RS256'],
    });
  }

  /**
   * Called after Auth0 token is validated.
   * Finds or creates the user in our Prisma DB.
   * Return value is attached to request.user
   */
  async validate(payload: Auth0JwtPayload) {
    const { sub, email, name, picture } = payload;

    if (!sub) {
      throw new UnauthorizedException('Token inválido: falta sub');
    }

    const user = await this.authService.findOrCreateAuth0User({
      auth0Id: sub,
      email: email ?? `${sub}@auth0.user`,
      name: name ?? 'Usuario',
      avatarUrl: picture,
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario inactivo o no encontrado');
    }

    return user;
  }
}
