import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard that validates Auth0-issued JWT tokens (RS256 via JWKS).
 * Use this instead of JwtAuthGuard for Auth0-protected routes.
 */
@Injectable()
export class Auth0Guard extends AuthGuard('auth0') {}
