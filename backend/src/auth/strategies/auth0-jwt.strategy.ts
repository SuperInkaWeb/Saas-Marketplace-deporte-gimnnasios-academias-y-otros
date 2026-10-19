import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import * as https from 'https';

export interface Auth0JwtPayload {
  sub: string;      // Auth0 user ID e.g. "auth0|abc123"
  email?: string;
  email_verified?: boolean;
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
    let domain = config.get<string>('AUTH0_DOMAIN') || 'dev-khvop4d61s5ip8d3.us.auth0.com';
    let audience = config.get<string>('AUTH0_AUDIENCE') || 'https://hercix-api';

    // Si están configuradas con las credenciales de desarrollo viejas o de prueba, forzar las corporativas oficiales de Mario (Hercix)
    if (domain === 'dev-6d0mok1v1ohx5iez.us.auth0.com' || domain === 'dev-vdhdedydkqqaxog0.us.auth0.com' || domain === 'dev-vdhdedydkqqaxog0') {
      domain = 'dev-khvop4d61s5ip8d3.us.auth0.com';
    }
    if (audience === 'https://sportnexus-api' || !audience.startsWith('https://')) {
      audience = 'https://hercix-api';
    }

    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${domain}/.well-known/jwks.json`,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: audience,
      issuer: [`https://${domain}/`, `https://${domain}`], // Accept both with and without trailing slash
      algorithms: ['RS256'],
      passReqToCallback: true,
    });
  }

  private fetchUserInfo(domain: string, token: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: domain,
        port: 443,
        path: '/userinfo',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              reject(new Error('Invalid JSON from userinfo'));
            }
          } else {
            reject(new Error(`Userinfo status code: ${res.statusCode}`));
          }
        });
      });

      req.on('error', (err) => reject(err));
      req.end();
    });
  }

  /**
   * Called after Auth0 token is validated.
   * Finds or creates the user in our Prisma DB.
   * Return value is attached to request.user
   */
   async validate(req: any, payload: Auth0JwtPayload) {
    console.log('Validando Payload de Auth0:', JSON.stringify(payload, null, 2));
    const { sub, picture } = payload;
    let email = payload.email;
    let emailVerified = payload.email_verified;
    let name = payload.name;

    if (!sub) {
      throw new UnauthorizedException('Token inválido: falta sub');
    }

    // Fetch real email from Auth0 /userinfo if not present in custom API access token payload.
    // AUD-03: también se consulta si el token no dice si el correo está verificado.
    if (!email || emailVerified === undefined) {
      const authHeader = req.headers?.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        let domain = this.config.get<string>('AUTH0_DOMAIN') || 'dev-khvop4d61s5ip8d3.us.auth0.com';
        if (domain === 'dev-6d0mok1v1ohx5iez.us.auth0.com' || domain === 'dev-vdhdedydkqqaxog0.us.auth0.com' || domain === 'dev-vdhdedydkqqaxog0') {
          domain = 'dev-khvop4d61s5ip8d3.us.auth0.com';
        }
        try {
          console.log(`Fetching userinfo from Auth0 to retrieve real email for ${sub}...`);
          const userInfo = await this.fetchUserInfo(domain, token);
          if (userInfo && userInfo.email) {
            email = userInfo.email;
            emailVerified = userInfo.email_verified === true;
            name = userInfo.name || name;
            console.log(`Retrieved real email from userinfo: ${email}`);
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error('Error fetching userinfo from Auth0:', msg);
        }
      }
    }

    const user = await this.authService.findOrCreateAuth0User({
      auth0Id: sub,
      email: email ?? `${sub}@auth0.user`,
      emailVerified: emailVerified === true,
      name: name ?? 'Usuario',
      avatarUrl: picture,
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario inactivo o no encontrado');
    }

    return user;
  }
}

